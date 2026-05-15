import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUser } from "./users";
import { assertOwnedBy } from "../lib/auth";

const goalStatusValidator = v.union(
  v.literal("active"),
  v.literal("completed"),
  v.literal("archived")
);

const goalDocValidator = v.object({
  _id: v.id("goals"),
  _creationTime: v.number(),
  userId: v.id("users"),
  childId: v.id("children"),
  title: v.string(),
  targetAmount: v.number(),
  emoji: v.string(),
  status: goalStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const getByChild = query({
  args: { childId: v.id("children") },
  returns: v.array(goalDocValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const child = await ctx.db.get(args.childId);
    if (!child) return [];
    assertOwnedBy(child, user._id, "child");

    return await ctx.db
      .query("goals")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
  },
});

export const getByFamily = query({
  args: {},
  returns: v.array(goalDocValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const create = mutation({
  args: {
    childId: v.id("children"),
    title: v.string(),
    targetAmount: v.number(),
    emoji: v.string(),
  },
  returns: v.id("goals"),
  handler: async (ctx, args) => {
    if (args.targetAmount <= 0) {
      throw new Error("Goal target must be positive");
    }

    const user = await getCurrentUser(ctx);
    assertOwnedBy(await ctx.db.get(args.childId), user._id, "child");

    const now = Date.now();
    return await ctx.db.insert("goals", {
      userId: user._id,
      childId: args.childId,
      title: args.title,
      targetAmount: args.targetAmount,
      emoji: args.emoji,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});
