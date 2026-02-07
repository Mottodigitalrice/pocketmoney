import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Get all jobs for a family, sorted by creation date
export const getByFamily = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("asc")
      .collect();
  },
});

// Get jobs available for a specific child (assigned to "all" or to that child)
export const getForChild = query({
  args: {
    userId: v.id("users"),
    childId: v.string(),
  },
  handler: async (ctx, args) => {
    const allJobs = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("asc")
      .collect();

    return allJobs.filter(
      (job) => job.assignedTo === "all" || job.assignedTo === args.childId
    );
  },
});

// Create a new job
export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    titleJa: v.optional(v.string()),
    yenAmount: v.number(),
    assignedTo: v.string(),
    dailyLimit: v.number(),
    weeklyLimit: v.number(),
    icon: v.string(),
    titleKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobs", {
      userId: args.userId,
      title: args.title,
      titleJa: args.titleJa,
      titleKey: args.titleKey,
      yenAmount: args.yenAmount,
      assignedTo: args.assignedTo,
      dailyLimit: args.dailyLimit,
      weeklyLimit: args.weeklyLimit,
      icon: args.icon,
      createdAt: Date.now(),
    });
  },
});

// Update a job
export const update = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.optional(v.string()),
    titleJa: v.optional(v.string()),
    titleKey: v.optional(v.string()),
    yenAmount: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
    dailyLimit: v.optional(v.number()),
    weeklyLimit: v.optional(v.number()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { jobId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(jobId, filteredUpdates);
  },
});

// Remove a job and all its instances
export const remove = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return; // Already deleted

    // Delete all job instances for this job
    const instances = await ctx.db
      .query("jobInstances")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();

    for (const instance of instances) {
      const exists = await ctx.db.get(instance._id);
      if (exists) await ctx.db.delete(instance._id);
    }

    await ctx.db.delete(args.jobId);
  },
});

// Seed default jobs for a new family
export const seedDefaults = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const defaults = [
      { title: "Fold the washing", titleKey: "job_fold_washing", yenAmount: 100, assignedTo: "all", dailyLimit: 1, weeklyLimit: 7, icon: "\u{1F455}" },
      { title: "Clean up toys", titleKey: "job_clean_toys", yenAmount: 50, assignedTo: "all", dailyLimit: 2, weeklyLimit: 7, icon: "\u{1F9F8}" },
      { title: "Make the bed", titleKey: "job_make_bed", yenAmount: 50, assignedTo: "all", dailyLimit: 1, weeklyLimit: 7, icon: "\u{1F6CF}\uFE0F" },
      { title: "Set the table", titleKey: "job_set_table", yenAmount: 100, assignedTo: "all", dailyLimit: 1, weeklyLimit: 7, icon: "\u{1F37D}\uFE0F" },
      { title: "Water the plants", titleKey: "job_water_plants", yenAmount: 100, assignedTo: "all", dailyLimit: 1, weeklyLimit: 3, icon: "\u{1F331}" },
      { title: "Put shoes away", titleKey: "job_put_shoes_away", yenAmount: 50, assignedTo: "all", dailyLimit: 2, weeklyLimit: 7, icon: "\u{1F45F}" },
      { title: "Feed the pets", titleKey: "job_feed_pets", yenAmount: 150, assignedTo: "all", dailyLimit: 1, weeklyLimit: 7, icon: "\u{1F43E}" },
      { title: "Put dishes in the sink", titleKey: "job_dishes_sink", yenAmount: 50, assignedTo: "all", dailyLimit: 3, weeklyLimit: 7, icon: "\u{1F37D}\uFE0F" },
      { title: "Pick up books", titleKey: "job_pick_books", yenAmount: 50, assignedTo: "all", dailyLimit: 2, weeklyLimit: 7, icon: "\u{1F4DA}" },
      { title: "Wipe the table", titleKey: "job_wipe_table", yenAmount: 100, assignedTo: "all", dailyLimit: 1, weeklyLimit: 7, icon: "\u{1F9F9}" },
      { title: "Dirty clothes in basket", titleKey: "job_dirty_clothes", yenAmount: 50, assignedTo: "all", dailyLimit: 2, weeklyLimit: 7, icon: "\u{1F9FA}" },
      { title: "Tidy your room", titleKey: "job_tidy_room", yenAmount: 200, assignedTo: "all", dailyLimit: 1, weeklyLimit: 7, icon: "\u{1F3E0}" },
      { title: "Help set up the futon", titleKey: "job_setup_futon", yenAmount: 150, assignedTo: "all", dailyLimit: 1, weeklyLimit: 7, icon: "\u{1F6CB}\uFE0F" },
      { title: "Brush teeth (no asking!)", titleKey: "job_brush_teeth", yenAmount: 100, assignedTo: "all", dailyLimit: 2, weeklyLimit: 14, icon: "\u{1FAA5}" },
      { title: "Pack school bag", titleKey: "job_pack_school_bag", yenAmount: 100, assignedTo: "all", dailyLimit: 1, weeklyLimit: 5, icon: "\u{1F392}" },
      { title: "Put away groceries", titleKey: "job_put_away_groceries", yenAmount: 200, assignedTo: "all", dailyLimit: 1, weeklyLimit: 3, icon: "\u{1F6D2}" },
      { title: "Sweep the floor", titleKey: "job_sweep_floor", yenAmount: 200, assignedTo: "all", dailyLimit: 1, weeklyLimit: 3, icon: "\u{1F9F9}" },
      { title: "Wipe windows", titleKey: "job_wipe_windows", yenAmount: 300, assignedTo: "all", dailyLimit: 1, weeklyLimit: 1, icon: "\u{1FA9F}" },
      { title: "Sort the recycling", titleKey: "job_sort_recycling", yenAmount: 150, assignedTo: "all", dailyLimit: 1, weeklyLimit: 3, icon: "\u267B\uFE0F" },
      { title: "Help cook dinner", titleKey: "job_help_cook", yenAmount: 500, assignedTo: "all", dailyLimit: 1, weeklyLimit: 3, icon: "\u{1F468}\u200D\u{1F373}" },
    ];

    const now = Date.now();

    for (let i = 0; i < defaults.length; i++) {
      const job = defaults[i];
      await ctx.db.insert("jobs", {
        userId: args.userId,
        title: job.title,
        titleKey: job.titleKey,
        yenAmount: job.yenAmount,
        assignedTo: job.assignedTo,
        dailyLimit: job.dailyLimit,
        weeklyLimit: job.weeklyLimit,
        icon: job.icon,
        createdAt: now + i, // offset to preserve order
      });
    }
  },
});
