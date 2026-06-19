/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "../convex/schema";
import { internal } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

/**
 * Locks `functions/admin.clearAllUsers` — the destructive full-deployment user
 * wipe (an `internalMutation`).
 *
 * Two behaviours that MUST NOT silently regress:
 *   - `confirm:false` (the default) is a DRY RUN: it counts but deletes nothing.
 *   - `confirm:true` actually wipes every user and all their user-scoped rows.
 *
 * We seed 2 users, each with a row in every user-scoped table the wipe walks
 * (children, jobs, scheduledJobs, jobInstances, wallets, transactions, goals,
 * luckyChests), then assert counts + that the rows do/don't survive.
 */

const modules = import.meta.glob("../convex/**/*.ts");
type T = TestConvex<typeof schema>;

// One full user "graph": a user plus exactly one row in each of the 8
// user-scoped tables clearAllUsers iterates. Mirrors the seeding shape used in
// access-control.test.ts, extended to cover every wiped table.
async function seedFullUser(t: T, subject: string): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: subject,
      email: `${subject}@test.local`,
      captainCodeEnabled: false,
      luckyChestMaxAmount: 100,
      createdAt: now,
    });
    const childId = await ctx.db.insert("children", {
      userId,
      name: `${subject} Kid`,
      icon: "shark",
      rankMultiplier: 1,
      createdAt: now,
    });
    const jobId = await ctx.db.insert("jobs", {
      userId,
      title: "A Job",
      yenAmount: 100,
      icon: "star",
      createdAt: now,
    });
    const scheduledJobId = await ctx.db.insert("scheduledJobs", {
      userId,
      jobId,
      childId,
      date: "2026-06-20",
      createdAt: now,
    });
    await ctx.db.insert("jobInstances", {
      userId,
      jobId,
      childId,
      scheduledJobId,
      status: "completed",
      createdAt: now,
    });
    const walletId = await ctx.db.insert("wallets", {
      userId,
      childId,
      jar: "spend",
      balance: 500,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("transactions", {
      userId,
      childId,
      walletId,
      jar: "spend",
      amount: 100,
      type: "earning",
      createdAt: now,
    });
    await ctx.db.insert("goals", {
      userId,
      childId,
      title: "A Goal",
      targetAmount: 1000,
      emoji: "🎯",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("luckyChests", {
      userId,
      childId,
      weekStart: "2026-06-15",
      amount: 50,
      openedAt: now,
    });
    return userId;
  });
}

// Tables the wipe walks, for re-query assertions.
const userScopedTables = [
  "children",
  "jobs",
  "scheduledJobs",
  "jobInstances",
  "wallets",
  "transactions",
  "goals",
  "luckyChests",
] as const;

async function countAll(t: T) {
  return await t.run(async (ctx) => {
    const users = (await ctx.db.query("users").collect()).length;
    let rows = 0;
    for (const table of userScopedTables) {
      rows += (await ctx.db.query(table).collect()).length;
    }
    return { users, rows };
  });
}

describe("functions/admin.clearAllUsers", () => {
  it("dry run (confirm:false) counts but deletes nothing", async () => {
    const t = convexTest(schema, modules);
    await seedFullUser(t, "family_dry_A");
    await seedFullUser(t, "family_dry_B");

    const before = await countAll(t);
    expect(before.users).toBe(2);
    // 8 rows per user (one per user-scoped table) × 2 users.
    expect(before.rows).toBe(16);

    const result = await t.mutation(internal.functions.admin.clearAllUsers, {
      confirm: false,
    });

    expect(result.dryRun).toBe(true);
    expect(result.users).toBe(2);
    expect(result.rows).toBeGreaterThan(0);
    expect(result.rows).toBe(16);

    // Nothing actually deleted.
    const after = await countAll(t);
    expect(after).toEqual(before);
    expect(after.users).toBe(2);
    expect(after.rows).toBe(16);
  });

  it("real wipe (confirm:true) deletes every user and all their rows", async () => {
    const t = convexTest(schema, modules);
    await seedFullUser(t, "family_wipe_A");
    await seedFullUser(t, "family_wipe_B");

    const before = await countAll(t);
    expect(before.users).toBe(2);
    expect(before.rows).toBe(16);

    const result = await t.mutation(internal.functions.admin.clearAllUsers, {
      confirm: true,
    });

    expect(result.dryRun).toBe(false);
    expect(result.users).toBe(2);
    expect(result.rows).toBe(16);

    // Everything is gone.
    const after = await countAll(t);
    expect(after.users).toBe(0);
    expect(after.rows).toBe(0);
  });
});
