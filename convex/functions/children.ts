import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUser } from "./users";
import { ensureWalletsForChild } from "./wallets";
import { deleteJobInstanceAndProof } from "./jobInstances";
import { assertOwnedByOrNull } from "../lib/auth";

const childDocValidator = v.object({
  _id: v.id("children"),
  _creationTime: v.number(),
  userId: v.id("users"),
  name: v.string(),
  icon: v.string(),
  age: v.optional(v.number()),
  rankMultiplier: v.optional(v.number()),
  createdAt: v.number(),
});

// Get all children for a family, sorted by creation date
export const getByFamily = query({
  args: {},
  returns: v.array(childDocValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("asc")
      .collect();
  },
});

// Create a new child
export const create = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    age: v.optional(v.number()),
  },
  returns: v.id("children"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const siblings = await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const ages = siblings
      .map((sibling) => sibling.age)
      .filter((age): age is number => typeof age === "number" && age > 0);
    const oldestAge =
      args.age && args.age > 0 ? Math.max(args.age, ...ages) : undefined;
    const rankMultiplier =
      args.age && args.age > 0 && oldestAge ? oldestAge / args.age : 1;

    const childId = await ctx.db.insert("children", {
      userId: user._id,
      name: args.name,
      icon: args.icon,
      age: args.age,
      rankMultiplier,
      createdAt: Date.now(),
    });
    await ensureWalletsForChild(ctx, user._id, childId);
    return childId;
  },
});

// Update a child's name, icon, or age
export const update = mutation({
  args: {
    childId: v.id("children"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    age: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const child = assertOwnedByOrNull(
      await ctx.db.get(args.childId),
      user._id,
      "child"
    );
    if (!child) return null;

    const { childId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(childId, filteredUpdates);
    return null;
  },
});

// Remove a child and all their job instances, scheduled jobs, wallets,
// transactions, goals and lucky chests. Idempotent.
export const remove = mutation({
  args: { childId: v.id("children") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const child = assertOwnedByOrNull(
      await ctx.db.get(args.childId),
      user._id,
      "child"
    );
    if (!child) return null;

    // Delete all job instances for this child
    const instances = await ctx.db
      .query("jobInstances")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();

    for (const instance of instances) {
      const exists = await ctx.db.get(instance._id);
      if (exists) await deleteJobInstanceAndProof(ctx, exists);
    }

    // Delete all scheduled jobs for this child (no by_child index on
    // scheduledJobs alone, so iterate by_user and filter)
    const scheduled = await ctx.db
      .query("scheduledJobs")
      .withIndex("by_user", (q) => q.eq("userId", child.userId))
      .collect();

    for (const sj of scheduled) {
      if (sj.childId === args.childId) {
        const exists = await ctx.db.get(sj._id);
        if (exists) await ctx.db.delete(sj._id);
      }
    }

    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
    for (const wallet of wallets) {
      await ctx.db.delete(wallet._id);
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }

    const goals = await ctx.db
      .query("goals")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
    for (const goal of goals) {
      await ctx.db.delete(goal._id);
    }

    const luckyChests = await ctx.db
      .query("luckyChests")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
    for (const luckyChest of luckyChests) {
      await ctx.db.delete(luckyChest._id);
    }

    await ctx.db.delete(args.childId);
    return null;
  },
});
