import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Get all children for a family, sorted by creation date
export const getByFamily = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("asc")
      .collect();
  },
});

// Create a new child
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("children", {
      userId: args.userId,
      name: args.name,
      icon: args.icon,
      createdAt: Date.now(),
    });
  },
});

// Update a child's name or icon
export const update = mutation({
  args: {
    childId: v.id("children"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { childId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(childId, filteredUpdates);
  },
});

// Remove a child and all their job instances
export const remove = mutation({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.childId);
    if (!child) return; // Already deleted

    // Delete all job instances for this child
    const instances = await ctx.db
      .query("jobInstances")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();

    for (const instance of instances) {
      const exists = await ctx.db.get(instance._id);
      if (exists) await ctx.db.delete(instance._id);
    }

    // Delete all scheduled jobs for this child
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

    await ctx.db.delete(args.childId);
  },
});
