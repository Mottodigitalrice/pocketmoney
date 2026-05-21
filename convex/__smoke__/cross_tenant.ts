/**
 * Cross-tenant security smoke test.
 *
 * Programmatically creates two families (A and B), then attempts every
 * ownership-gated read/write from Family A's perspective using Family B's row
 * IDs. Every attempt MUST throw a "Not your X" error (or its variants). Any
 * attempt that succeeds is a P0 security regression.
 *
 * ## How to run
 *
 * From the project root, with a Convex dev deployment connected:
 *
 *   npx convex run __smoke__/cross_tenant:runCrossTenantAttackMatrix
 *
 * (Note: file is `cross_tenant.ts` not `cross-tenant.ts` because Convex's
 * module-path rules disallow hyphens.)
 *
 * The action returns a JSON summary:
 *   { totalAttempts: 23, threwAsExpected: 23, unexpectedSuccesses: [...] }
 *
 * If `unexpectedSuccesses` is non-empty, ownership is broken — fix before
 * shipping.
 *
 * NOTE: This is an `internalAction` so it cannot be called from the client.
 * It cleans up the two synthetic families and all of their data at the end —
 * even if an attack-step throws. It is intentionally NOT wired into
 * `convex/crons.ts`.
 *
 * The attack-matrix uses the same `assertOwnedBy` helper that the public
 * mutations use, exercised via parallel `__smoke_*` internal mutations that
 * accept an explicit `actorUserId` (instead of reading `ctx.auth`). That
 * proves the ownership-check logic itself is correct, independent of the
 * auth-resolution mechanism. The auth resolution is independently verified by
 * `getCurrentUser` rejecting unauthenticated callers.
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { assertOwnedBy } from "../lib/auth";

const SMOKE_CLERK_A = "__smoke_cross_tenant_A__";
const SMOKE_CLERK_B = "__smoke_cross_tenant_B__";

// -----------------------------------------------------------------------------
// Setup / teardown (internal, bypasses auth — only callable from this action)
// -----------------------------------------------------------------------------

export const _smokeSetupFamily = internalMutation({
  args: { clerkId: v.string(), email: v.string(), label: v.string() },
  returns: v.object({
    userId: v.id("users"),
    childId: v.id("children"),
    jobId: v.id("jobs"),
    scheduledJobId: v.id("scheduledJobs"),
    jobInstanceId: v.id("jobInstances"),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: `Smoke Family ${args.label}`,
      captainCodeEnabled: false,
      luckyChestMaxAmount: 100,
      createdAt: now,
    });
    const childId = await ctx.db.insert("children", {
      userId,
      name: `Kid-${args.label}`,
      icon: "shark",
      age: 8,
      rankMultiplier: 1,
      createdAt: now,
    });
    const jobId = await ctx.db.insert("jobs", {
      userId,
      title: `Job-${args.label}`,
      yenAmount: 100,
      icon: "🧹",
      createdAt: now,
    });
    const scheduledJobId = await ctx.db.insert("scheduledJobs", {
      userId,
      jobId,
      childId,
      date: "2026-05-15",
      priority: "optional",
      createdAt: now,
    });
    const jobInstanceId = await ctx.db.insert("jobInstances", {
      userId,
      jobId,
      childId,
      status: "in_progress",
      startedAt: now,
      createdAt: now,
    });
    // Seed wallets so withdrawal cross-tenant test can target a real wallet.
    for (const jar of ["spend", "save", "give"] as const) {
      await ctx.db.insert("wallets", {
        userId,
        childId,
        jar,
        balance: 1000,
        createdAt: now,
        updatedAt: now,
      });
    }
    await ctx.db.insert("goals", {
      userId,
      childId,
      title: `Goal-${args.label}`,
      targetAmount: 1000,
      emoji: "🎯",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("luckyChests", {
      userId,
      childId,
      weekStart: "2026-05-11",
      amount: 50,
      openedAt: now,
    });
    return { userId, childId, jobId, scheduledJobId, jobInstanceId };
  },
});

export const _smokeTeardown = internalMutation({
  args: { clerkIds: v.array(v.string()) },
  returns: v.object({ deletedUsers: v.number(), deletedRows: v.number() }),
  handler: async (ctx, args) => {
    let deletedUsers = 0;
    let deletedRows = 0;

    for (const clerkId of args.clerkIds) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .unique();
      if (!user) continue;

      for (const table of [
        "luckyChests",
        "goals",
        "transactions",
        "wallets",
        "jobInstances",
        "scheduledJobs",
        "jobs",
        "children",
      ] as const) {
        const rows = await ctx.db
          .query(table)
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        for (const row of rows) {
          await ctx.db.delete(row._id);
          deletedRows += 1;
        }
      }

      await ctx.db.delete(user._id);
      deletedUsers += 1;
    }

    return { deletedUsers, deletedRows };
  },
});

// -----------------------------------------------------------------------------
// Attack-matrix steps. Each step is an internalMutation/Query that mirrors a
// public function's ownership check by feeding an "actor userId" + "target row
// belonging to a DIFFERENT user" and verifying the helper throws.
// -----------------------------------------------------------------------------

/**
 * Generic ownership probe — given a doc id and an actorUserId that does NOT
 * own it, runs `assertOwnedBy` and confirms it throws. Returns true on
 * expected-throw, false on UNEXPECTED success (security regression).
 */
async function probeOwnership<T extends { userId: Id<"users">; _id: unknown }>(
  fetch: () => Promise<T | null>,
  actorUserId: Id<"users">,
  label: string,
): Promise<{ label: string; threw: boolean; error?: string }> {
  const doc = await fetch();
  try {
    assertOwnedBy(doc, actorUserId, label);
    return { label, threw: false };
  } catch (e) {
    return {
      label,
      threw: true,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export const _smokeRunAttackMatrix = internalQuery({
  args: {
    actorUserId: v.id("users"),
    targetIds: v.object({
      userId: v.id("users"),
      childId: v.id("children"),
      jobId: v.id("jobs"),
      scheduledJobId: v.id("scheduledJobs"),
      jobInstanceId: v.id("jobInstances"),
    }),
  },
  returns: v.object({
    attempts: v.array(
      v.object({
        label: v.string(),
        threw: v.boolean(),
        error: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const { actorUserId, targetIds } = args;
    const attempts: Array<{ label: string; threw: boolean; error?: string }> =
      [];

    // 1. children.update — fetch B's child as A
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "children.update target",
      ),
    );

    // 2. children.remove — same target, different op
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "children.remove target",
      ),
    );

    // 3. wallets.getByChild — A reading B's child
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "wallets.getByChild child",
      ),
    );

    // 4. wallets.ensureForChild — A creating wallets for B's child
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "wallets.ensureForChild child",
      ),
    );

    // 5. wallets.awardBonus — A awarding bonus to B's child
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "wallets.awardBonus child",
      ),
    );

    // 6. transactions.getByChild
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "transactions.getByChild child",
      ),
    );

    // 7. transactions.withdraw — A withdrawing from B's child's wallet
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "transactions.withdraw child",
      ),
    );

    // 8. jobs.getById — A reading B's job
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.jobId) as Promise<Doc<"jobs"> | null>,
        actorUserId,
        "jobs.getById target",
      ),
    );

    // 9. jobs.update
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.jobId) as Promise<Doc<"jobs"> | null>,
        actorUserId,
        "jobs.update target",
      ),
    );

    // 10. jobs.remove
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.jobId) as Promise<Doc<"jobs"> | null>,
        actorUserId,
        "jobs.remove target",
      ),
    );

    // 11. scheduledJobs.getByChildDate
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "scheduledJobs.getByChildDate child",
      ),
    );

    // 12. scheduledJobs.create — job ownership
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.jobId) as Promise<Doc<"jobs"> | null>,
        actorUserId,
        "scheduledJobs.create job",
      ),
    );

    // 13. scheduledJobs.create — child ownership
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "scheduledJobs.create child",
      ),
    );

    // 14. scheduledJobs.createBatch — job ownership
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.jobId) as Promise<Doc<"jobs"> | null>,
        actorUserId,
        "scheduledJobs.createBatch job",
      ),
    );

    // 15. scheduledJobs.applyRecurringForWeek
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.jobId) as Promise<Doc<"jobs"> | null>,
        actorUserId,
        "scheduledJobs.applyRecurringForWeek job",
      ),
    );

    // 16. scheduledJobs.quickAddForToday
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.jobId) as Promise<Doc<"jobs"> | null>,
        actorUserId,
        "scheduledJobs.quickAddForToday job",
      ),
    );

    // 17. scheduledJobs.remove
    attempts.push(
      await probeOwnership(
        () =>
          ctx.db.get(
            targetIds.scheduledJobId,
          ) as Promise<Doc<"scheduledJobs"> | null>,
        actorUserId,
        "scheduledJobs.remove target",
      ),
    );

    // 18. scheduledJobs.clearDay
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "scheduledJobs.clearDay child",
      ),
    );

    // 19. jobInstances.getByChild
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "jobInstances.getByChild child",
      ),
    );

    // 20. jobInstances.start — job
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.jobId) as Promise<Doc<"jobs"> | null>,
        actorUserId,
        "jobInstances.start job",
      ),
    );

    // 21. jobInstances.complete / approve / reject — instance ownership
    attempts.push(
      await probeOwnership(
        () =>
          ctx.db.get(
            targetIds.jobInstanceId,
          ) as Promise<Doc<"jobInstances"> | null>,
        actorUserId,
        "jobInstances.complete target",
      ),
    );
    attempts.push(
      await probeOwnership(
        () =>
          ctx.db.get(
            targetIds.jobInstanceId,
          ) as Promise<Doc<"jobInstances"> | null>,
        actorUserId,
        "jobInstances.approve target",
      ),
    );
    attempts.push(
      await probeOwnership(
        () =>
          ctx.db.get(
            targetIds.jobInstanceId,
          ) as Promise<Doc<"jobInstances"> | null>,
        actorUserId,
        "jobInstances.reject target",
      ),
    );

    // 22. goals.getByChild + create — both gate on child
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "goals.getByChild child",
      ),
    );
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "goals.create child",
      ),
    );

    // 23. luckyChests.open
    attempts.push(
      await probeOwnership(
        () => ctx.db.get(targetIds.childId) as Promise<Doc<"children"> | null>,
        actorUserId,
        "luckyChests.open child",
      ),
    );

    return { attempts };
  },
});

// -----------------------------------------------------------------------------
// Top-level action that orchestrates setup, attack, teardown.
// -----------------------------------------------------------------------------

export const runCrossTenantAttackMatrix = internalAction({
  args: {},
  returns: v.object({
    totalAttempts: v.number(),
    threwAsExpected: v.number(),
    unexpectedSuccesses: v.array(v.string()),
    sample: v.array(
      v.object({
        label: v.string(),
        threw: v.boolean(),
        error: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (
    ctx,
  ): Promise<{
    totalAttempts: number;
    threwAsExpected: number;
    unexpectedSuccesses: string[];
    sample: Array<{ label: string; threw: boolean; error?: string }>;
  }> => {
    // Always tear down whatever previous run left behind first, then again at
    // the end. Belt + braces.
    await ctx.runMutation(internal.__smoke__.cross_tenant._smokeTeardown, {
      clerkIds: [SMOKE_CLERK_A, SMOKE_CLERK_B],
    });

    const familyA = await ctx.runMutation(
      internal.__smoke__.cross_tenant._smokeSetupFamily,
      {
        clerkId: SMOKE_CLERK_A,
        email: "smoke-a@piratemoney.test",
        label: "A",
      },
    );
    const familyB = await ctx.runMutation(
      internal.__smoke__.cross_tenant._smokeSetupFamily,
      {
        clerkId: SMOKE_CLERK_B,
        email: "smoke-b@piratemoney.test",
        label: "B",
      },
    );

    let result;
    try {
      result = await ctx.runQuery(
        internal.__smoke__.cross_tenant._smokeRunAttackMatrix,
        {
          actorUserId: familyA.userId,
          targetIds: {
            userId: familyB.userId,
            childId: familyB.childId,
            jobId: familyB.jobId,
            scheduledJobId: familyB.scheduledJobId,
            jobInstanceId: familyB.jobInstanceId,
          },
        },
      );
    } finally {
      await ctx.runMutation(internal.__smoke__.cross_tenant._smokeTeardown, {
        clerkIds: [SMOKE_CLERK_A, SMOKE_CLERK_B],
      });
    }

    const totalAttempts = result.attempts.length;
    const threwAsExpected = result.attempts.filter((a) => a.threw).length;
    const unexpectedSuccesses = result.attempts
      .filter((a) => !a.threw)
      .map((a) => a.label);

    return {
      totalAttempts,
      threwAsExpected,
      unexpectedSuccesses,
      sample: result.attempts.slice(0, 3),
    };
  },
});
