import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Get all scheduled jobs for a family
export const getByFamily = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledJobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get scheduled jobs for a child on a specific date
export const getByChildDate = query({
  args: {
    childId: v.id("children"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledJobs")
      .withIndex("by_child_date", (q) =>
        q.eq("childId", args.childId).eq("date", args.date)
      )
      .collect();
  },
});

// Schedule a job for a child on a specific date
export const create = mutation({
  args: {
    userId: v.id("users"),
    jobId: v.id("jobs"),
    childId: v.id("children"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scheduledJobs", {
      userId: args.userId,
      jobId: args.jobId,
      childId: args.childId,
      date: args.date,
      createdAt: Date.now(),
    });
  },
});

// Schedule multiple jobs at once (for week planner bulk operations)
export const createBatch = mutation({
  args: {
    userId: v.id("users"),
    entries: v.array(
      v.object({
        jobId: v.id("jobs"),
        childId: v.id("children"),
        date: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = [];
    for (let i = 0; i < args.entries.length; i++) {
      const entry = args.entries[i];
      const id = await ctx.db.insert("scheduledJobs", {
        userId: args.userId,
        jobId: entry.jobId,
        childId: entry.childId,
        date: entry.date,
        createdAt: now + i,
      });
      ids.push(id);
    }
    return ids;
  },
});

export const quickAddForToday = mutation({
  args: {
    userId: v.id("users"),
    jobId: v.id("jobs"),
    childIds: v.array(v.id("children")),
    date: v.string(),
    preApprove: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = [];

    for (let i = 0; i < args.childIds.length; i++) {
      const childId = args.childIds[i];
      const timestamp = now + i;

      if (args.preApprove) {
        const instanceId = await ctx.db.insert("jobInstances", {
          userId: args.userId,
          jobId: args.jobId,
          childId,
          status: "approved",
          startedAt: timestamp,
          completedAt: timestamp,
          approvedAt: timestamp,
          createdAt: timestamp,
        });
        ids.push(instanceId);
        continue;
      }

      const existingEntries = await ctx.db
        .query("scheduledJobs")
        .withIndex("by_child_date", (q) =>
          q.eq("childId", childId).eq("date", args.date)
        )
        .collect();

      const duplicate = existingEntries.find((entry) => entry.jobId === args.jobId);
      if (duplicate) {
        ids.push(duplicate._id);
        continue;
      }

      const scheduledId = await ctx.db.insert("scheduledJobs", {
        userId: args.userId,
        jobId: args.jobId,
        childId,
        date: args.date,
        createdAt: timestamp,
      });
      ids.push(scheduledId);
    }

    return ids;
  },
});

// Remove a scheduled job
export const remove = mutation({
  args: { scheduledJobId: v.id("scheduledJobs") },
  handler: async (ctx, args) => {
    const sj = await ctx.db.get(args.scheduledJobId);
    if (!sj) return;

    // Also delete any job instances linked to this scheduled job
    const instances = await ctx.db
      .query("jobInstances")
      .withIndex("by_scheduled_job", (q) =>
        q.eq("scheduledJobId", args.scheduledJobId)
      )
      .collect();

    for (const instance of instances) {
      const exists = await ctx.db.get(instance._id);
      if (exists) await ctx.db.delete(instance._id);
    }

    await ctx.db.delete(args.scheduledJobId);
  },
});

// Remove all scheduled jobs for a child on a date (clear a day)
export const clearDay = mutation({
  args: {
    childId: v.id("children"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("scheduledJobs")
      .withIndex("by_child_date", (q) =>
        q.eq("childId", args.childId).eq("date", args.date)
      )
      .collect();

    for (const entry of entries) {
      // Delete linked instances
      const instances = await ctx.db
        .query("jobInstances")
        .withIndex("by_scheduled_job", (q) =>
          q.eq("scheduledJobId", entry._id)
        )
        .collect();

      for (const instance of instances) {
        const exists = await ctx.db.get(instance._id);
        if (exists) await ctx.db.delete(instance._id);
      }

      await ctx.db.delete(entry._id);
    }
  },
});
