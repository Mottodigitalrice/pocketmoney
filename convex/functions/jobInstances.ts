import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Get all job instances for a family
export const getByFamily = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobInstances")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get all job instances for a specific child
export const getByChild = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobInstances")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
  },
});

// Start a new job instance
export const start = mutation({
  args: {
    userId: v.id("users"),
    jobId: v.id("jobs"),
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobInstances", {
      userId: args.userId,
      jobId: args.jobId,
      childId: args.childId,
      status: "in_progress",
      startedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

// Mark a job instance as completed by the child
export const complete = mutation({
  args: { instanceId: v.id("jobInstances") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.instanceId, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

// Approve a completed job instance (parent action)
export const approve = mutation({
  args: { instanceId: v.id("jobInstances") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.instanceId, {
      status: "approved",
      approvedAt: Date.now(),
    });
  },
});

// Reject a completed job instance (parent action)
export const reject = mutation({
  args: { instanceId: v.id("jobInstances") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.instanceId, {
      status: "rejected",
    });
  },
});
