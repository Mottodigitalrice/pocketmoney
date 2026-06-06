/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import {
  assertPositiveYenAmount,
  assertLuckyChestMaxAmount,
  __testing__ as VALIDATION,
} from "../convex/lib/inputValidation";
import {
  clampLuckyChestMax,
  __testing__ as CHEST_MATH,
} from "../convex/lib/luckyChestMath";

/**
 * QA hardening (2026-06-06) — Wave 1: money correctness.
 *
 * Mutation-level reproduce-then-fix tests run against the in-memory
 * `convex-test` harness. Each block reproduces a real ledger-integrity bug
 * found in the QA pass (see working-files/qa-findings-ledger.md F1–F4), then
 * locks the fixed behavior.
 *
 * The invariant under test everywhere: a wallet's `balance` must ALWAYS equal
 * the signed sum of its transactions (the ledger never lies), balances are
 * integers, and no path drives a balance negative.
 */

const modules = import.meta.glob("../convex/**/*.ts");
type T = TestConvex<typeof schema>;

const SUBJECT = "clerk_money_test";

async function seedFamily(t: T, subject = SUBJECT) {
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      clerkId: subject,
      email: `${subject}@test.local`,
      captainCodeEnabled: false,
      luckyChestMaxAmount: 100,
      createdAt: Date.now(),
    });
  });
  return { userId, asUser: t.withIdentity({ subject }) };
}

/** Seed a child with all three jars; optionally pre-fund one jar with a
 *  matching earning transaction so the ledger starts internally consistent. */
async function seedChildWithFundedJar(
  t: T,
  userId: Id<"users">,
  jar: "spend" | "save" | "give",
  balance: number,
) {
  return await t.run(async (ctx) => {
    const now = Date.now();
    const childId = await ctx.db.insert("children", {
      userId,
      name: "Test Kid",
      icon: "shark",
      rankMultiplier: 1,
      createdAt: now,
    });
    let fundedWalletId: Id<"wallets"> | null = null;
    for (const j of ["spend", "save", "give"] as const) {
      const bal = j === jar ? balance : 0;
      const walletId = await ctx.db.insert("wallets", {
        userId,
        childId,
        jar: j,
        balance: bal,
        createdAt: now,
        updatedAt: now,
      });
      if (j === jar) {
        fundedWalletId = walletId;
        if (balance > 0) {
          // Back the opening balance with a real ledger entry so the
          // reconciliation invariant (sum(tx) === balance) holds at t0.
          await ctx.db.insert("transactions", {
            userId,
            childId,
            walletId,
            jar: j,
            amount: balance,
            type: "earning",
            createdAt: now,
          });
        }
      }
    }
    return { childId, walletId: fundedWalletId! };
  });
}

async function walletBalanceAndLedger(t: T, walletId: Id<"wallets">) {
  return await t.run(async (ctx) => {
    const wallet = await ctx.db.get(walletId);
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", walletId))
      .collect();
    const ledgerSum = txs.reduce((s, tx) => s + tx.amount, 0);
    return { balance: wallet?.balance ?? null, ledgerSum, txCount: txs.length };
  });
}

// ──────────────────────────────────────────────────────────────────────
// F1a — withdraw must reject non-integer amounts (float corrupts ledger)
// ──────────────────────────────────────────────────────────────────────
describe("F1a withdraw integer invariant", () => {
  it("rejects a non-integer withdrawal and leaves the balance untouched", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedFamily(t);
    const { childId, walletId } = await seedChildWithFundedJar(
      t,
      userId,
      "spend",
      1000,
    );

    await expect(
      asUser.mutation(api.functions.transactions.withdraw, {
        childId,
        jar: "spend",
        amount: 10.5,
        reason: "cashOut",
      }),
    ).rejects.toThrow();

    const { balance, ledgerSum } = await walletBalanceAndLedger(t, walletId);
    expect(balance).toBe(1000); // unchanged — no float written
    expect(balance).toBe(ledgerSum); // ledger still reconciles
  });

  it("allows an exact-balance withdrawal to clear to 0, then blocks overdraft", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedFamily(t);
    const { childId, walletId } = await seedChildWithFundedJar(
      t,
      userId,
      "spend",
      1000,
    );

    await asUser.mutation(api.functions.transactions.withdraw, {
      childId,
      jar: "spend",
      amount: 1000,
      reason: "cashOut",
    });
    let snap = await walletBalanceAndLedger(t, walletId);
    expect(snap.balance).toBe(0);
    expect(snap.balance).toBe(snap.ledgerSum); // 1000 - 1000 === 0

    await expect(
      asUser.mutation(api.functions.transactions.withdraw, {
        childId,
        jar: "spend",
        amount: 1,
        reason: "cashOut",
      }),
    ).rejects.toThrow(/OVERDRAFT/);

    snap = await walletBalanceAndLedger(t, walletId);
    expect(snap.balance).toBe(0); // never negative
  });
});

// ──────────────────────────────────────────────────────────────────────
// F1b — awardBonus must reject non-integers (no silent Math.round)
// ──────────────────────────────────────────────────────────────────────
describe("F1b awardBonus integer invariant", () => {
  it("rejects a fractional bonus instead of silently rounding", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedFamily(t);
    const { childId } = await seedChildWithFundedJar(t, userId, "spend", 0);

    await expect(
      asUser.mutation(api.functions.wallets.awardBonus, {
        childId,
        amount: 10.5,
      }),
    ).rejects.toThrow();

    // Nothing credited.
    const total = await t.run(async (ctx) => {
      const wallets = await ctx.db
        .query("wallets")
        .withIndex("by_child", (q) => q.eq("childId", childId))
        .collect();
      return wallets.reduce((s, w) => s + w.balance, 0);
    });
    expect(total).toBe(0);
  });

  it("an integer bonus reconciles exactly across the three jars (spend+save+give === N)", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedFamily(t);
    const { childId } = await seedChildWithFundedJar(t, userId, "spend", 0);

    for (const N of [1, 3, 7, 99, 101, 500]) {
      // Award onto a fresh child each iteration to isolate the sum.
      const kid = await t.run(async (ctx) => {
        const now = Date.now();
        return await ctx.db.insert("children", {
          userId,
          name: `kid-${N}`,
          icon: "crab",
          rankMultiplier: 1,
          createdAt: now,
        });
      });
      await asUser.mutation(api.functions.wallets.awardBonus, {
        childId: kid,
        amount: N,
      });
      const sum = await t.run(async (ctx) => {
        const wallets = await ctx.db
          .query("wallets")
          .withIndex("by_child", (q) => q.eq("childId", kid))
          .collect();
        return wallets.reduce((s, w) => s + w.balance, 0);
      });
      expect(sum, `bonus of ¥${N} must split with no rounding leak`).toBe(N);
    }
    void childId;
  });
});

// ──────────────────────────────────────────────────────────────────────
// F1c / F2 — lucky-chest max must be clamped so `open` can never throw OOB
// ──────────────────────────────────────────────────────────────────────
describe("F2 lucky-chest cap invariant", () => {
  it("rejects a max above the 10,000 cap (so kid never sees a raw error on open)", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedFamily(t);
    await expect(
      asUser.mutation(api.functions.users.setLuckyChestMaxAmount, {
        amount: 50_000,
      }),
    ).rejects.toThrow();
  });

  it("rejects a non-integer max", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedFamily(t);
    await expect(
      asUser.mutation(api.functions.users.setLuckyChestMaxAmount, {
        amount: 100.5,
      }),
    ).rejects.toThrow();
  });

  it("accepts a valid in-range max and stores it as an integer", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedFamily(t);
    await asUser.mutation(api.functions.users.setLuckyChestMaxAmount, {
      amount: 5_000,
    });
    const stored = await t.run(
      async (ctx) => (await ctx.db.get(userId))?.luckyChestMaxAmount,
    );
    expect(stored).toBe(5_000);
  });

  it("clampLuckyChestMax keeps every value in [0, cap] (legacy-value guard)", () => {
    expect(clampLuckyChestMax(50_000)).toBe(CHEST_MATH.MAX_LUCKY_CHEST_CAP);
    expect(clampLuckyChestMax(100.5)).toBe(100); // floored
    expect(clampLuckyChestMax(5_000)).toBe(5_000);
    expect(clampLuckyChestMax(0)).toBe(0); // disabled
    expect(clampLuckyChestMax(-5)).toBe(0);
    expect(clampLuckyChestMax(NaN)).toBe(0);
  });

  it("open() never throws for a LEGACY stored max > cap; payout stays ≤ cap", async () => {
    const t = convexTest(schema, modules);
    // Legacy family whose cap was set to 50_000 before the setter guard.
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "clerk_legacy_chest",
        email: "legacy@test.local",
        captainCodeEnabled: false,
        luckyChestMaxAmount: 50_000, // out of range — pre-fix value
        createdAt: Date.now(),
      });
    });
    const asUser = t.withIdentity({ subject: "clerk_legacy_chest" });

    const week = [
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
      "2026-06-06",
      "2026-06-07",
    ];

    // Seed an UNLOCKED chest: one mustDo scheduled job with an approved
    // instance for the week.
    const childId = await t.run(async (ctx) => {
      const now = Date.now();
      const cid = await ctx.db.insert("children", {
        userId,
        name: "Legacy Kid",
        icon: "whale",
        rankMultiplier: 1,
        createdAt: now,
      });
      const jobId = await ctx.db.insert("jobs", {
        userId,
        title: "Tidy",
        yenAmount: 100,
        icon: "broom",
        createdAt: now,
      });
      const scheduledJobId = await ctx.db.insert("scheduledJobs", {
        userId,
        jobId,
        childId: cid,
        date: week[0]!,
        priority: "mustDo",
        createdAt: now,
      });
      await ctx.db.insert("jobInstances", {
        userId,
        jobId,
        childId: cid,
        scheduledJobId,
        status: "approved",
        approvedAt: now,
        createdAt: now,
      });
      return cid;
    });

    const chest = await asUser.mutation(api.functions.luckyChests.open, {
      childId,
      weekDates: week,
    });
    expect(chest).not.toBeNull();
    expect(chest!.amount).toBeGreaterThanOrEqual(1);
    expect(chest!.amount).toBeLessThanOrEqual(CHEST_MATH.MAX_LUCKY_CHEST_CAP);
  });
});

// ──────────────────────────────────────────────────────────────────────
// F4 — weekly interest backfill must keep balance === ledger (no divergence)
//      and be idempotent on re-run.
// ──────────────────────────────────────────────────────────────────────
describe("F4 interest backfill ledger integrity", () => {
  it("crediting 4 missed weeks keeps balance === sum(transactions)", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedFamily(t);
    // ¥5200 → floor(5200 * 0.10 / 52) = ¥10/week.
    const { walletId } = await seedChildWithFundedJar(t, userId, "save", 5200);

    await t.mutation(internal.functions.wallets.creditWeeklySaveInterest, {});

    const snap = await walletBalanceAndLedger(t, walletId);
    // The core invariant: the wallet balance equals its own ledger.
    expect(snap.balance).toBe(snap.ledgerSum);
    // 4 weekly credits compounding from 5200 → 5240 (10 each).
    expect(snap.balance).toBe(5240);
    expect(snap.txCount).toBe(5); // 1 opening earning + 4 interest
  });

  it("re-running the cron the same period credits nothing (idempotent)", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedFamily(t);
    const { walletId } = await seedChildWithFundedJar(t, userId, "save", 5200);

    await t.mutation(internal.functions.wallets.creditWeeklySaveInterest, {});
    const first = await walletBalanceAndLedger(t, walletId);

    await t.mutation(internal.functions.wallets.creditWeeklySaveInterest, {});
    const second = await walletBalanceAndLedger(t, walletId);

    expect(second.balance).toBe(first.balance);
    expect(second.txCount).toBe(first.txCount);
    expect(second.balance).toBe(second.ledgerSum);
  });
});

// ──────────────────────────────────────────────────────────────────────
// F3 — wallets.reconcile diagnostic query: drift must be 0 for a healthy
//      family and must surface a planted divergence.
// ──────────────────────────────────────────────────────────────────────
describe("F3 reconciliation query", () => {
  it("reports zero drift for a healthy wallet and non-zero for a tampered one", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedFamily(t);
    const { walletId } = await seedChildWithFundedJar(t, userId, "spend", 1000);

    let rows = await asUser.query(api.functions.wallets.reconcile, {});
    const healthy = rows.find((r) => r.walletId === walletId);
    expect(healthy?.drift).toBe(0);

    // Plant a divergence: bump balance without a matching ledger entry.
    await t.run(async (ctx) => {
      const w = await ctx.db.get(walletId);
      if (w) await ctx.db.patch(walletId, { balance: w.balance + 37 });
    });

    rows = await asUser.query(api.functions.wallets.reconcile, {});
    const tampered = rows.find((r) => r.walletId === walletId);
    expect(tampered?.drift).toBe(37);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Pure-helper guards backing the mutations above.
// ──────────────────────────────────────────────────────────────────────
describe("money validation helpers (pure)", () => {
  it("LUCKY_CHEST_MAX_CAP is locked to the chest-math cap", () => {
    // If these ever drift, the setter could store a value `open` rejects.
    expect(VALIDATION.LUCKY_CHEST_MAX_CAP).toBe(CHEST_MATH.MAX_LUCKY_CHEST_CAP);
  });

  it("assertPositiveYenAmount rejects non-integers, ≤0, and >max", () => {
    expect(() => assertPositiveYenAmount(10.5)).toThrow(/AMOUNT_NOT_INTEGER/);
    expect(() => assertPositiveYenAmount(NaN)).toThrow(/AMOUNT_NOT_INTEGER/);
    expect(() => assertPositiveYenAmount(Infinity)).toThrow(
      /AMOUNT_NOT_INTEGER/,
    );
    expect(() => assertPositiveYenAmount(0)).toThrow(/AMOUNT_OUT_OF_BOUNDS/);
    expect(() => assertPositiveYenAmount(-5)).toThrow(/AMOUNT_OUT_OF_BOUNDS/);
    expect(() =>
      assertPositiveYenAmount(VALIDATION.PAYOUT_YEN_AMOUNT_MAX + 1),
    ).toThrow(/AMOUNT_OUT_OF_BOUNDS/);
    // Valid boundary values pass.
    expect(() => assertPositiveYenAmount(1)).not.toThrow();
    expect(() =>
      assertPositiveYenAmount(VALIDATION.PAYOUT_YEN_AMOUNT_MAX),
    ).not.toThrow();
  });

  it("assertLuckyChestMaxAmount accepts [0,10000] integers, rejects rest", () => {
    expect(() => assertLuckyChestMaxAmount(0)).not.toThrow(); // disabled
    expect(() => assertLuckyChestMaxAmount(10_000)).not.toThrow();
    expect(() => assertLuckyChestMaxAmount(10_001)).toThrow(
      /LUCKY_CHEST_MAX_OUT_OF_BOUNDS/,
    );
    expect(() => assertLuckyChestMaxAmount(-1)).toThrow(
      /LUCKY_CHEST_MAX_OUT_OF_BOUNDS/,
    );
    expect(() => assertLuckyChestMaxAmount(100.5)).toThrow(
      /LUCKY_CHEST_MAX_OUT_OF_BOUNDS/,
    );
  });
});
