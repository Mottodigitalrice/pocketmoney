import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUser } from "./users";
import { ensureWalletsForChild } from "./wallets";
import { assertOwnedBy } from "../lib/auth";

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
    if (wallet.balance < args.amount) {
      throw new Error("Insufficient wallet balance");
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
      note: args.note,
      createdAt: now,
    });
  },
});
