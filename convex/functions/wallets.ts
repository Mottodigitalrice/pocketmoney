import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { getCurrentUser } from "./users";
import { assertOwnedBy } from "../lib/auth";
import { splitEarning as splitEarningPure } from "../lib/walletMath";
import {
  computeMigrationDelta,
  isDeltaZero,
} from "../lib/migrationDiff";
import {
  assertIsWeekStartISO,
  hasTransactionInWeek,
  weeksToBackfill,
} from "../lib/cronMath";

const jars = ["spend", "save", "give"] as const;
type Jar = (typeof jars)[number];
const SAVE_INTEREST_APR = 0.1;
const WEEKS_PER_YEAR = 52;
const INTEREST_BACKFILL_WEEKS = 4; // current week + 3 missed (F3 contract)

// Re-export so existing import sites (`import { splitEarning } from "./wallets"`)
// continue to work. The lib is the authoritative implementation now.
export const splitEarning = (amount: number): Record<Jar, number> =>
  splitEarningPure(amount);

const jarValidator = v.union(
  v.literal("spend"),
  v.literal("save"),
  v.literal("give")
);

const walletDocValidator = v.object({
  _id: v.id("wallets"),
  _creationTime: v.number(),
  userId: v.id("users"),
  childId: v.id("children"),
  jar: jarValidator,
  balance: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

async function assertChildOwner(ctx: MutationCtx, childId: Id<"children">) {
  const user = await getCurrentUser(ctx);
  const child = assertOwnedBy(await ctx.db.get(childId), user._id, "child");
  return { user, child };
}

export async function ensureWalletsForChild(
  ctx: MutationCtx,
  userId: Id<"users">,
  childId: Id<"children">
) {
  const now = Date.now();
  const wallets = [];

  for (const jar of jars) {
    const existing = await ctx.db
      .query("wallets")
      .withIndex("by_child_jar", (q) => q.eq("childId", childId).eq("jar", jar))
      .unique();

    if (existing) {
      wallets.push(existing);
      continue;
    }

    const walletId = await ctx.db.insert("wallets", {
      userId,
      childId,
      jar,
      balance: 0,
      createdAt: now,
      updatedAt: now,
    });
    const wallet = await ctx.db.get(walletId);
    if (wallet) wallets.push(wallet);
  }

  return wallets;
}

export async function creditApprovedJob(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    childId: Id<"children">;
    jobInstanceId: Id<"jobInstances">;
    amount: number;
    note?: string;
  }
) {
  const wallets = await ensureWalletsForChild(ctx, args.userId, args.childId);
  const split = splitEarning(args.amount);
  const now = Date.now();

  for (const wallet of wallets) {
    const amount = split[wallet.jar];
    if (amount === 0) continue;

    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + amount,
      updatedAt: now,
    });
    await ctx.db.insert("transactions", {
      userId: args.userId,
      childId: args.childId,
      walletId: wallet._id,
      jar: wallet.jar,
      amount,
      type: "earning",
      note: args.note,
      jobInstanceId: args.jobInstanceId,
      createdAt: now,
    });
  }
}

async function creditWallet(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    childId: Id<"children">;
    walletId: Id<"wallets">;
    jar: Jar;
    currentBalance: number;
    amount: number;
    type: "interest" | "migration";
    note: string;
    createdAt?: number;
  }
) {
  if (args.amount <= 0) return;

  const now = args.createdAt ?? Date.now();
  await ctx.db.patch(args.walletId, {
    balance: args.currentBalance + args.amount,
    updatedAt: now,
  });
  await ctx.db.insert("transactions", {
    userId: args.userId,
    childId: args.childId,
    walletId: args.walletId,
    jar: args.jar,
    amount: args.amount,
    type: args.type,
    note: args.note,
    createdAt: now,
  });
}

export async function creditBonus(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    childId: Id<"children">;
    amount: number;
    note?: string;
    type?: "bonus" | "luckyChest";
  }
) {
  const wallets = await ensureWalletsForChild(ctx, args.userId, args.childId);
  const split = splitEarning(args.amount);
  const now = Date.now();

  for (const wallet of wallets) {
    const amount = split[wallet.jar];
    if (amount === 0) continue;

    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + amount,
      updatedAt: now,
    });
    await ctx.db.insert("transactions", {
      userId: args.userId,
      childId: args.childId,
      walletId: wallet._id,
      jar: wallet.jar,
      amount,
      type: args.type ?? "bonus",
      note: args.note,
      createdAt: now,
    });
  }
}

export const getByChild = query({
  args: { childId: v.id("children") },
  returns: v.array(walletDocValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const child = await ctx.db.get(args.childId);
    if (!child) return [];
    assertOwnedBy(child, user._id, "child");

    return await ctx.db
      .query("wallets")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
  },
});

export const getByFamily = query({
  args: {},
  returns: v.array(walletDocValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const ensureForChild = mutation({
  args: { childId: v.id("children") },
  returns: v.array(walletDocValidator),
  handler: async (ctx, args) => {
    const { user } = await assertChildOwner(ctx, args.childId);
    return await ensureWalletsForChild(ctx, user._id, args.childId);
  },
});

/**
 * Migrate legacy approved-job earnings into the 3-jar wallet system.
 *
 * Per-child idempotency contract:
 *   - `lifetimeEarnings` = sum of `earning`-type transactions on that child
 *     (NOT including bonus / interest / luckyChest — those are post-split
 *     credits already and aren't part of the migration baseline).
 *   - For each child we compute `expected = splitEarning(lifetimeEarnings)`
 *     and compare against `actual` = the sum of past migration-type
 *     transactions, grouped by jar.
 *   - We credit ONLY the per-jar delta `(expected - actual)`. Already-fully-
 *     migrated children get a zero-write no-op return. Partially-migrated
 *     children (e.g. previous run crashed after Spend) finish only the
 *     missing jars.
 *   - Negative deltas (jar already over-credited via manual adjustment)
 *     clamp to 0 — the ledger is immutable, we never issue compensating debits.
 *
 * `dryRun: true` → returns the diff shape with NO writes (preview).
 * `dryRun: false` (or omitted) → performs writes AND returns the same shape
 *   reflecting what was credited on this call.
 *
 * Auth: only the calling parent operates on their own children
 * (`assertOwnedBy` via the `by_user` index on `children`).
 */
const childMigrationDiffValidator = v.object({
  childId: v.id("children"),
  lifetimeEarnings: v.number(),
  expected: v.object({
    spend: v.number(),
    save: v.number(),
    give: v.number(),
  }),
  actual: v.object({
    spend: v.number(),
    save: v.number(),
    give: v.number(),
  }),
  delta: v.object({
    spend: v.number(),
    save: v.number(),
    give: v.number(),
  }),
});

export const migrateLegacyEarnings = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    children: v.array(childMigrationDiffValidator),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun === true;
    const user = await getCurrentUser(ctx);

    // Auth-gated by index: only this user's children. `assertOwnedBy` is
    // implicitly satisfied since we query by userId; explicit assertion
    // would only matter if we fetched by id from somewhere else.
    const children = await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const childrenDiffs: Array<{
      childId: Id<"children">;
      lifetimeEarnings: number;
      expected: { spend: number; save: number; give: number };
      actual: { spend: number; save: number; give: number };
      delta: { spend: number; save: number; give: number };
    }> = [];

    for (const child of children) {
      // Defense in depth: confirm ownership of every doc we touch even
      // though the index already filtered by user.
      assertOwnedBy(child, user._id, "child");

      // lifetimeEarnings = sum of earning-type transactions (NOT bonus/
      // interest/luckyChest — those are post-split credits already).
      const childTxs = await ctx.db
        .query("transactions")
        .withIndex("by_child", (q) => q.eq("childId", child._id))
        .collect();

      const lifetimeEarnings = childTxs
        .filter((t) => t.type === "earning")
        .reduce((sum, t) => sum + Math.max(0, t.amount), 0);

      // actual = sum of migration-type transactions, grouped by jar.
      const actualSpend = childTxs
        .filter((t) => t.type === "migration" && t.jar === "spend")
        .reduce((sum, t) => sum + t.amount, 0);
      const actualSave = childTxs
        .filter((t) => t.type === "migration" && t.jar === "save")
        .reduce((sum, t) => sum + t.amount, 0);
      const actualGive = childTxs
        .filter((t) => t.type === "migration" && t.jar === "give")
        .reduce((sum, t) => sum + t.amount, 0);

      const { expected, actual, delta } = computeMigrationDelta({
        lifetimeEarnings,
        actualSpend,
        actualSave,
        actualGive,
      });

      // Record the diff in the response regardless of dryRun.
      childrenDiffs.push({
        childId: child._id,
        lifetimeEarnings,
        expected,
        actual,
        delta,
      });

      // No writes if dryRun OR if there's nothing to do.
      if (dryRun || isDeltaZero(delta)) continue;

      // Apply only the non-zero deltas.
      const wallets = await ensureWalletsForChild(ctx, user._id, child._id);
      for (const wallet of wallets) {
        const amount = delta[wallet.jar];
        if (amount <= 0) continue;
        await creditWallet(ctx, {
          userId: user._id,
          childId: child._id,
          walletId: wallet._id,
          jar: wallet.jar,
          currentBalance: wallet.balance,
          amount,
          type: "migration",
          note: "Opening deposit from approved jobs before wallets",
        });
      }
    }

    return { children: childrenDiffs };
  },
});

export const awardBonus = mutation({
  args: {
    childId: v.id("children"),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Bonus amount must be positive");
    }

    const { user } = await assertChildOwner(ctx, args.childId);
    await creditBonus(ctx, {
      userId: user._id,
      childId: args.childId,
      amount: Math.round(args.amount),
      note: args.note,
    });
    return null;
  },
});

/**
 * Compute interest for one save-jar wallet for one specific week, and credit
 * it IF AND ONLY IF no interest transaction already exists in that week's
 * half-open range `[weekStart, weekStart+7d)`.
 *
 * The idempotency check is the predicate from `cronMath.hasTransactionInWeek`.
 * Re-running the same (wallet, week) is a no-op.
 *
 * Returns `true` if a credit was made, `false` if skipped (already credited,
 * zero balance, or interest rounds to ¥0).
 *
 * @internal — called from the cron handler and `runInterestForWeek`.
 */
async function creditWeekIfMissing(
  ctx: MutationCtx,
  wallet: Doc<"wallets">,
  weekStartMs: number
): Promise<boolean> {
  if (wallet.jar !== "save" || wallet.balance <= 0) return false;

  const txs = await ctx.db
    .query("transactions")
    .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
    .collect();

  if (hasTransactionInWeek(txs, weekStartMs, "interest")) return false;

  // Preserve EXACT F2 formula: balance * 10% APR / 52 weeks, floored.
  const amount = Math.floor(
    (wallet.balance * SAVE_INTEREST_APR) / WEEKS_PER_YEAR
  );
  if (amount <= 0) return false;

  await creditWallet(ctx, {
    userId: wallet.userId,
    childId: wallet.childId,
    walletId: wallet._id,
    jar: wallet.jar,
    currentBalance: wallet.balance,
    amount,
    type: "interest",
    note: "Weekly Save jar interest",
    // Tag the credit at the week-start so future runs of the predicate
    // place it unambiguously inside [weekStart, weekStart+7d).
    createdAt: weekStartMs,
  });
  return true;
}

/**
 * Weekly Save-interest cron handler.
 *
 * Walks back up to `INTEREST_BACKFILL_WEEKS` (= 4) week-starts and credits
 * any (wallet, weekStart) pair that has no interest transaction in that
 * week's range. Order: most-recent-first, but order doesn't matter for
 * correctness — each (wallet, week) credit is independently idempotent.
 *
 * Re-running same-day is safe: the second run finds the credit we just
 * inserted and skips. See `__tests__/cron-resilience.test.ts` for the
 * idempotency proof.
 */
export const creditWeeklySaveInterest = internalMutation({
  args: {},
  returns: v.object({
    credited: v.number(),
    creditsApplied: v.number(),
    weeksConsidered: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const weekStarts = weeksToBackfill(now, INTEREST_BACKFILL_WEEKS);
    const wallets = await ctx.db.query("wallets").collect();

    let credited = 0;
    let creditsApplied = 0;

    for (const wallet of wallets) {
      if (wallet.jar !== "save" || wallet.balance <= 0) continue;

      for (const iso of weekStarts) {
        const weekStartMs = new Date(iso).getTime();
        const before = wallet.balance;
        const did = await creditWeekIfMissing(ctx, wallet, weekStartMs);
        if (did) {
          creditsApplied += 1;
          credited += Math.floor((before * SAVE_INTEREST_APR) / WEEKS_PER_YEAR);
        }
      }
    }

    return { credited, creditsApplied, weeksConsidered: weekStarts.length };
  },
});

/**
 * Owner-only manual recovery mutation. Lets a parent re-run interest for
 * a single past week from the Convex dashboard if they suspect a missed
 * cron beyond the 4-week auto-backfill window.
 *
 * Same idempotency rule as the cron: only credits children of the calling
 * family that have no interest transaction in `[weekStart, weekStart+7d)`.
 *
 * @param weekStartISO Must be a Monday 00:00 UTC ISO timestamp
 *                     (e.g. "2026-04-13T00:00:00.000Z"). Throws otherwise.
 */
export const runInterestForWeek = mutation({
  args: { weekStartISO: v.string() },
  returns: v.object({
    creditedChildIds: v.array(v.id("children")),
    skippedChildIds: v.array(v.id("children")),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const weekStart = assertIsWeekStartISO(args.weekStartISO);
    const weekStartMs = weekStart.getTime();

    const familyWallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const credited = new Set<Id<"children">>();
    const skipped = new Set<Id<"children">>();

    for (const wallet of familyWallets) {
      if (wallet.jar !== "save") continue;
      const did = await creditWeekIfMissing(ctx, wallet, weekStartMs);
      if (did) credited.add(wallet.childId);
      else skipped.add(wallet.childId);
    }

    // A child should only appear in one bucket. If we credited any save-jar
    // for them, they're "credited"; only fully-skipped children stay in
    // skipped.
    for (const id of credited) skipped.delete(id);

    return {
      creditedChildIds: Array.from(credited),
      skippedChildIds: Array.from(skipped),
    };
  },
});
