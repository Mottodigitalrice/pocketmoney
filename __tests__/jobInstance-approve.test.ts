/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

/**
 * Mutation-level coverage for the core earn path: `jobInstances.approve` →
 * `wallets.creditApprovedJob` (HIGH gap, SEC-2026-07-18 audit).
 *
 * This is the single most-exercised money path in production and previously had
 * NO executed test — `edge-cases.test.ts (b)` only asserts an error string
 * equals itself and re-implements a local `shouldApprove` predicate; it never
 * calls the mutation. These tests drive the real mutation and lock:
 *   - a ¥100 approval splits to 70/20/10 with 3 `earning` txns tagged with the
 *     jobInstanceId, and balance == ledger (drift 0),
 *   - double-approve is idempotent (no second credit),
 *   - approving after the child was deleted throws CHILD_DELETED_AFTER_COMPLETION,
 *   - a foreign family cannot credit another family's instance.
 */

const modules = import.meta.glob("../convex/**/*.ts");
type T = TestConvex<typeof schema>;

async function seedUser(t: T, subject: string) {
  const userId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      clerkId: subject,
      email: `${subject}@test.local`,
      captainCodeEnabled: false,
      luckyChestMaxAmount: 100,
      createdAt: Date.now(),
    }),
  );
  return { userId, asUser: t.withIdentity({ subject }) };
}

/** Seed a child + a ¥`yen` job + a `completed` jobInstance awaiting approval. */
async function seedCompletedInstance(
  t: T,
  userId: Id<"users">,
  yen = 100,
): Promise<{ childId: Id<"children">; instanceId: Id<"jobInstances"> }> {
  return await t.run(async (ctx) => {
    const now = Date.now();
    const childId = await ctx.db.insert("children", {
      userId,
      name: "Earner",
      icon: "shark",
      rankMultiplier: 1,
      createdAt: now,
    });
    const jobId = await ctx.db.insert("jobs", {
      userId,
      title: "Make bed",
      yenAmount: yen,
      icon: "star",
      createdAt: now,
    });
    const instanceId = await ctx.db.insert("jobInstances", {
      userId,
      jobId,
      childId,
      status: "completed",
      completedAt: now,
      createdAt: now,
    });
    return { childId, instanceId };
  });
}

async function walletBalances(t: T, childId: Id<"children">) {
  return await t.run(async (ctx) => {
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_child", (q) => q.eq("childId", childId))
      .collect();
    const by: { spend: number; save: number; give: number } = {
      spend: 0,
      save: 0,
      give: 0,
    };
    for (const w of wallets) by[w.jar] = w.balance;
    return by;
  });
}

async function earningTxns(t: T, childId: Id<"children">) {
  return await t.run(async (ctx) =>
    (
      await ctx.db
        .query("transactions")
        .withIndex("by_child", (q) => q.eq("childId", childId))
        .collect()
    ).filter((tx) => tx.type === "earning"),
  );
}

describe("jobInstances.approve — core earn path", () => {
  it("credits ¥100 as 70/20/10 with tagged earning txns and drift 0", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t, "earn-happy");
    const { childId, instanceId } = await seedCompletedInstance(t, userId, 100);

    await asUser.mutation(api.functions.jobInstances.approve, { instanceId });

    const bal = await walletBalances(t, childId);
    expect(bal).toEqual({ spend: 70, save: 20, give: 10 });

    const txns = await earningTxns(t, childId);
    expect(txns).toHaveLength(3);
    // Every earning txn is tagged with the originating instance.
    expect(txns.every((tx) => tx.jobInstanceId === instanceId)).toBe(true);
    // Ledger == balance (drift 0).
    const ledger = txns.reduce((s, tx) => s + tx.amount, 0);
    expect(ledger).toBe(bal.spend + bal.save + bal.give);
    expect(ledger).toBe(100);

    // Status flipped to approved.
    const status = await t.run(async (ctx) => {
      const inst = await ctx.db.get(instanceId);
      return inst?.status;
    });
    expect(status).toBe("approved");
  });

  it("is idempotent — a second approve does NOT re-credit", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t, "earn-idem");
    const { childId, instanceId } = await seedCompletedInstance(t, userId, 100);

    await asUser.mutation(api.functions.jobInstances.approve, { instanceId });
    await asUser.mutation(api.functions.jobInstances.approve, { instanceId });

    expect(await walletBalances(t, childId)).toEqual({
      spend: 70,
      save: 20,
      give: 10,
    });
    expect(await earningTxns(t, childId)).toHaveLength(3);
  });

  it("throws CHILD_DELETED_AFTER_COMPLETION if the child is gone, with no credit", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t, "earn-orphan");
    const { childId, instanceId } = await seedCompletedInstance(t, userId, 100);

    await t.run(async (ctx) => {
      await ctx.db.delete(childId);
    });

    await expect(
      asUser.mutation(api.functions.jobInstances.approve, { instanceId }),
    ).rejects.toThrow(/CHILD_DELETED_AFTER_COMPLETION/);

    // No wallet/txn was created for the deleted child.
    expect(await earningTxns(t, childId)).toHaveLength(0);
  });

  it("a foreign family cannot credit another family's instance", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t, "earn-owner");
    const { asUser: attacker } = await seedUser(t, "earn-attacker");
    const { childId, instanceId } = await seedCompletedInstance(t, userId, 100);

    // The instance EXISTS but belongs to another family → assertOwnedByOrNull
    // hard-rejects (cross-tenant access is never a soft no-op).
    await expect(
      attacker.mutation(api.functions.jobInstances.approve, { instanceId }),
    ).rejects.toThrow(/Not your job instance/);

    expect(await earningTxns(t, childId)).toHaveLength(0);
    const status = await t.run(async (ctx) => {
      const inst = await ctx.db.get(instanceId);
      return inst?.status;
    });
    expect(status).toBe("completed"); // unchanged
  });
});
