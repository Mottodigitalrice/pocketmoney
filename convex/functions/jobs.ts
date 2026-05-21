import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUser } from "./users";
import { deleteJobInstanceAndProof } from "./jobInstances";
import { assertOwnedBy, assertOwnedByOrNull } from "../lib/auth";

const recurrenceValidator = v.object({
  type: v.union(
    v.literal("none"),
    v.literal("daily"),
    v.literal("weekdays"),
    v.literal("specificDays"),
  ),
  daysOfWeek: v.optional(v.array(v.number())),
  priority: v.optional(v.union(v.literal("mustDo"), v.literal("optional"))),
});

const jobDocValidator = v.object({
  _id: v.id("jobs"),
  _creationTime: v.number(),
  userId: v.id("users"),
  title: v.string(),
  titleJa: v.optional(v.string()),
  titleKey: v.optional(v.string()),
  yenAmount: v.number(),
  icon: v.string(),
  isOneOff: v.optional(v.boolean()),
  requiresPhotoProof: v.optional(v.boolean()),
  recurrence: v.optional(recurrenceValidator),
  assignedTo: v.optional(v.string()),
  dailyLimit: v.optional(v.number()),
  weeklyLimit: v.optional(v.number()),
  createdAt: v.number(),
});

// Get all jobs for a family (excludes one-off jobs), sorted by creation date
export const getByFamily = query({
  args: {},
  returns: v.array(jobDocValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const allJobs = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("asc")
      .collect();

    return allJobs.filter((j) => !j.isOneOff);
  },
});

// Get a single job by ID
export const getById = query({
  args: { jobId: v.id("jobs") },
  returns: v.union(jobDocValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    assertOwnedBy(job, user._id, "job");
    return job;
  },
});

// Create a new job (library template)
export const create = mutation({
  args: {
    title: v.string(),
    titleJa: v.optional(v.string()),
    yenAmount: v.number(),
    icon: v.string(),
    titleKey: v.optional(v.string()),
    isOneOff: v.optional(v.boolean()),
    requiresPhotoProof: v.optional(v.boolean()),
    recurrence: v.optional(recurrenceValidator),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db.insert("jobs", {
      userId: user._id,
      title: args.title,
      ...(args.titleJa !== undefined ? { titleJa: args.titleJa } : {}),
      ...(args.titleKey !== undefined ? { titleKey: args.titleKey } : {}),
      yenAmount: args.yenAmount,
      icon: args.icon,
      ...(args.isOneOff !== undefined ? { isOneOff: args.isOneOff } : {}),
      ...(args.requiresPhotoProof !== undefined
        ? { requiresPhotoProof: args.requiresPhotoProof }
        : {}),
      ...(args.recurrence !== undefined ? { recurrence: args.recurrence } : {}),
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
    icon: v.optional(v.string()),
    requiresPhotoProof: v.optional(v.boolean()),
    recurrence: v.optional(recurrenceValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const job = assertOwnedByOrNull(
      await ctx.db.get(args.jobId),
      user._id,
      "job",
    );
    if (!job) return null;

    const { jobId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(jobId, filteredUpdates);
    return null;
  },
});

// Remove a job and all its instances and scheduled entries
export const remove = mutation({
  args: { jobId: v.id("jobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const job = assertOwnedByOrNull(
      await ctx.db.get(args.jobId),
      user._id,
      "job",
    );
    if (!job) return null;

    // Delete all job instances for this job
    const instances = await ctx.db
      .query("jobInstances")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();

    for (const instance of instances) {
      const exists = await ctx.db.get(instance._id);
      if (exists) await deleteJobInstanceAndProof(ctx, exists);
    }

    // Delete all scheduled jobs for this job
    const scheduled = await ctx.db
      .query("scheduledJobs")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();

    for (const sj of scheduled) {
      const exists = await ctx.db.get(sj._id);
      if (exists) await ctx.db.delete(sj._id);
    }

    await ctx.db.delete(args.jobId);
    return null;
  },
});

// Seed default jobs for a new family (library only, no scheduling)
export const seedDefaults = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const existingJob = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (existingJob) return null;

    const defaults = [
      {
        title: "Fold the washing",
        titleKey: "job_fold_washing",
        yenAmount: 100,
        icon: "\u{1F455}",
      },
      {
        title: "Clean up toys",
        titleKey: "job_clean_toys",
        yenAmount: 50,
        icon: "\u{1F9F8}",
      },
      {
        title: "Make the bed",
        titleKey: "job_make_bed",
        yenAmount: 50,
        icon: "\u{1F6CF}️",
      },
      {
        title: "Set the table",
        titleKey: "job_set_table",
        yenAmount: 100,
        icon: "\u{1F37D}️",
      },
      {
        title: "Water the plants",
        titleKey: "job_water_plants",
        yenAmount: 100,
        icon: "\u{1F331}",
      },
      {
        title: "Put shoes away",
        titleKey: "job_put_shoes_away",
        yenAmount: 50,
        icon: "\u{1F45F}",
      },
      {
        title: "Feed the pets",
        titleKey: "job_feed_pets",
        yenAmount: 150,
        icon: "\u{1F43E}",
      },
      {
        title: "Put dishes in the sink",
        titleKey: "job_dishes_sink",
        yenAmount: 50,
        icon: "\u{1F37D}️",
      },
      {
        title: "Pick up books",
        titleKey: "job_pick_books",
        yenAmount: 50,
        icon: "\u{1F4DA}",
      },
      {
        title: "Wipe the table",
        titleKey: "job_wipe_table",
        yenAmount: 100,
        icon: "\u{1F9F9}",
      },
      {
        title: "Dirty clothes in basket",
        titleKey: "job_dirty_clothes",
        yenAmount: 50,
        icon: "\u{1F9FA}",
      },
      {
        title: "Tidy your room",
        titleKey: "job_tidy_room",
        yenAmount: 200,
        icon: "\u{1F3E0}",
      },
      {
        title: "Help set up the futon",
        titleKey: "job_setup_futon",
        yenAmount: 150,
        icon: "\u{1F6CB}️",
      },
      {
        title: "Brush teeth (no asking!)",
        titleKey: "job_brush_teeth",
        yenAmount: 100,
        icon: "\u{1FAA5}",
      },
      {
        title: "Pack school bag",
        titleKey: "job_pack_school_bag",
        yenAmount: 100,
        icon: "\u{1F392}",
      },
      {
        title: "Put away groceries",
        titleKey: "job_put_away_groceries",
        yenAmount: 200,
        icon: "\u{1F6D2}",
      },
      {
        title: "Sweep the floor",
        titleKey: "job_sweep_floor",
        yenAmount: 200,
        icon: "\u{1F9F9}",
      },
      {
        title: "Wipe windows",
        titleKey: "job_wipe_windows",
        yenAmount: 300,
        icon: "\u{1FA9F}",
      },
      {
        title: "Sort the recycling",
        titleKey: "job_sort_recycling",
        yenAmount: 150,
        icon: "♻️",
      },
      {
        title: "Help cook dinner",
        titleKey: "job_help_cook",
        yenAmount: 500,
        icon: "\u{1F468}‍\u{1F373}",
      },
    ];

    const now = Date.now();

    for (let i = 0; i < defaults.length; i++) {
      const job = defaults[i]!; // safe: i bounded by defaults.length
      await ctx.db.insert("jobs", {
        userId: user._id,
        title: job.title,
        titleKey: job.titleKey,
        yenAmount: job.yenAmount,
        icon: job.icon,
        createdAt: now + i,
      });
    }
    return null;
  },
});
