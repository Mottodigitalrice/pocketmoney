import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUser } from "./users";
import { ensureWalletsForChild } from "./wallets";
import { assertOwnedBy } from "../lib/auth";
import { overdraftErrorOrNull } from "../lib/withdrawGuard";

const jarValidator = v.union(
  v.literal("spend"),
  v.literal("save"),
  v.literal("give")
);

const transactionTypeValidator = v.union(
  v.literal("earning"),
  v.literal("interest"),
  v.literal("withdrawal"),
  v.literal("migration"),
  v.literal("correction"),
  v.literal("bonus"),
  v.literal("luckyChest")
);

const reasonValidator = v.union(
  v.literal("cashOut"),
  v.literal("penalty"),
  v.literal("correction"),
  v.literal("other")
);

const transactionDocValidator = v.object({
  _id: v.id("transactions"),
  _creationTime: v.number(),
  userId: v.id("users"),
  childId: v.id("children"),
  walletId: v.optional(v.id("wallets")),
  jar: v.optional(jarValidator),
  amount: v.number(),
  type: transactionTypeValidator,
  reason: v.optional(reasonValidator),
  note: v.optional(v.string()),
  jobInstanceId: v.optional(v.id("jobInstances")),
  createdAt: v.number(),
});

export const getByChild = query({
  args: { childId: v.id("children") },
  returns: v.array(transactionDocValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const child = await ctx.db.get(args.childId);
    if (!child) return [];
    assertOwnedBy(child, user._id, "child");

    return await ctx.db
      .query("transactions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .order("desc")
      .collect();
  },
});

export const getByFamily = query({
  args: {},
  returns: v.array(transactionDocValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Withdraw from a child's jar. Overdraft is blocked by a balance check
 * BEFORE any `ctx.db.patch` — see F6 (c).
 *
 * Error contract (frontend pattern-matches these prefixes):
 *   - `OVERDRAFT: balance ¥X cannot cover withdrawal ¥Y` — insufficient funds.
 *   - `Withdrawal amount must be positive` — non-positive amount.
 *   - `Wallet not found` — shouldn't happen (ensureWalletsForChild ran), but
 *     left as a structured throw for resilience.
 */
export const withdraw = mutation({
  args: {
    childId: v.id("children"),
    jar: jarValidator,
    amount: v.number(),
    reason: reasonValidator,
    note: v.optional(v.string()),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }

    const user = await getCurrentUser(ctx);
    assertOwnedBy(await ctx.db.get(args.childId), user._id, "child");

    await ensureWalletsForChild(ctx, user._id, args.childId);
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_child_jar", (q) =>
        q.eq("childId", args.childId).eq("jar", args.jar)
      )
      .unique();

    if (!wallet) {
      throw new Error("Wallet not found");
    }
    // (c) Structured overdraft error — thrown BEFORE any db.patch so the
    // ledger stays consistent on failure. Format must keep the OVERDRAFT:
    // prefix; F12 (frontend) will pattern-match on it. See
    // `convex/lib/withdrawGuard.ts` for the pure predicate.
    const overdraftError = overdraftErrorOrNull(wallet.balance, args.amount);
    if (overdraftError) {
      throw new Error(overdraftError);
    }

    const now = Date.now();
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.amount,
      updatedAt: now,
    });

    return await ctx.db.insert("transactions", {
      userId: user._id,
      childId: args.childId,
      walletId: wallet._id,
      jar: args.jar,
      amount: -args.amount,
      type: args.reason === "correction" ? "correction" : "withdrawal",
      reason: args.reason,
      ...(args.note !== undefined ? { note: args.note } : {}),
      createdAt: now,
    });
  },
});

