import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUser } from "./users";
import { creditApprovedJob } from "./wallets";
import { deleteJobInstanceAndProof } from "./jobInstances";
import { assertOwnedBy, assertOwnedByOrNull } from "../lib/auth";

const priorityValidator = v.union(v.literal("mustDo"), v.literal("optional"));

const recurrenceArgs = v.object({
  jobId: v.id("jobs"),
  childIds: v.array(v.id("children")),
});

const scheduledJobDocValidator = v.object({
  _id: v.id("scheduledJobs"),
  _creationTime: v.number(),
  userId: v.id("users"),
  jobId: v.id("jobs"),
  childId: v.id("children"),
  date: v.string(),
  priority: v.optional(priorityValidator),
  createdAt: v.number(),
});

function dayIndexFromDateString(date: string) {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 ? 6 : day - 1;
}

function recurrenceMatchesDate(
  recurrence:
    | {
        type: "none" | "daily" | "weekdays" | "specificDays";
        daysOfWeek?: number[];
      }
    | undefined,
  date: string
) {
  if (!recurrence || recurrence.type === "none") return false;
  const dayIndex = dayIndexFromDateString(date);
  if (recurrence.type === "daily") return true;
  if (recurrence.type === "weekdays") return dayIndex >= 0 && dayIndex <= 4;
  return recurrence.daysOfWeek?.includes(dayIndex) ?? false;
}

// Get all scheduled jobs for a family
export const getByFamily = query({
  args: {},
  returns: v.array(scheduledJobDocValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("scheduledJobs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Get scheduled jobs for a child on a specific date
export const getByChildDate = query({
  args: {
    childId: v.id("children"),
    date: v.string(),
  },
  returns: v.array(scheduledJobDocValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const child = await ctx.db.get(args.childId);
    if (!child) return [];
    assertOwnedBy(child, user._id, "child");

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
    jobId: v.id("jobs"),
    childId: v.id("children"),
    date: v.string(),
    priority: v.optional(priorityValidator),
  },
  returns: v.id("scheduledJobs"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const [job, child] = await Promise.all([
      ctx.db.get(args.jobId),
      ctx.db.get(args.childId),
    ]);
    assertOwnedBy(job, user._id, "job");
    assertOwnedBy(child, user._id, "child");

    return await ctx.db.insert("scheduledJobs", {
      userId: user._id,
      jobId: args.jobId,
      childId: args.childId,
      date: args.date,
      priority: args.priority ?? "optional",
      createdAt: Date.now(),
    });
  },
});

// Schedule multiple jobs at once (for week planner bulk operations)
export const createBatch = mutation({
  args: {
    entries: v.array(
      v.object({
        jobId: v.id("jobs"),
        childId: v.id("children"),
        date: v.string(),
        priority: v.optional(priorityValidator),
      })
    ),
  },
  returns: v.array(v.id("scheduledJobs")),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    const ids = [];
    for (let i = 0; i < args.entries.length; i++) {
      const entry = args.entries[i];
      const [job, child] = await Promise.all([
        ctx.db.get(entry.jobId),
        ctx.db.get(entry.childId),
      ]);
      assertOwnedBy(job, user._id, "job");
      assertOwnedBy(child, user._id, "child");

      const id = await ctx.db.insert("scheduledJobs", {
        userId: user._id,
        jobId: entry.jobId,
        childId: entry.childId,
        date: entry.date,
        priority: entry.priority ?? "optional",
        createdAt: now + i,
      });
      ids.push(id);
    }
    return ids;
  },
});

export const applyRecurringForWeek = mutation({
  args: {
    weekDates: v.array(v.string()),
    entries: v.array(recurrenceArgs),
  },
  returns: v.array(v.id("scheduledJobs")),
  handler: async (ctx, args) => {
    if (args.weekDates.length !== 7) {
      throw new Error("Expected a full week of dates");
    }

    const user = await getCurrentUser(ctx);
    const now = Date.now();
    const ids = [];
    let offset = 0;

    for (const entry of args.entries) {
      const job = assertOwnedBy(
        await ctx.db.get(entry.jobId),
        user._id,
        "job"
      );
      if (!job.recurrence || job.recurrence.type === "none") continue;

      for (const childId of entry.childIds) {
        assertOwnedBy(await ctx.db.get(childId), user._id, "child");

        for (const date of args.weekDates) {
          if (!recurrenceMatchesDate(job.recurrence, date)) continue;

          const existingEntries = await ctx.db
            .query("scheduledJobs")
            .withIndex("by_child_date", (q) =>
              q.eq("childId", childId).eq("date", date)
            )
            .collect();

          if (existingEntries.some((scheduled) => scheduled.jobId === entry.jobId)) {
            continue;
          }

          const id = await ctx.db.insert("scheduledJobs", {
            userId: user._id,
            jobId: entry.jobId,
            childId,
            date,
            priority: job.recurrence.priority ?? "optional",
            createdAt: now + offset,
          });
          offset += 1;
          ids.push(id);
        }
      }
    }

    return ids;
  },
});

export const quickAddForToday = mutation({
  args: {
    jobId: v.id("jobs"),
    childIds: v.array(v.id("children")),
    date: v.string(),
    preApprove: v.boolean(),
    priority: v.optional(priorityValidator),
  },
  // Returns a mix of scheduledJobs ids (when scheduled) and jobInstances ids
  // (when pre-approved). Caller treats the array opaquely.
  returns: v.array(v.union(v.id("scheduledJobs"), v.id("jobInstances"))),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const job = assertOwnedBy(
      await ctx.db.get(args.jobId),
      user._id,
      "job"
    );

    const now = Date.now();
    const ids: Array<import("../_generated/dataModel").Id<"scheduledJobs"> | import("../_generated/dataModel").Id<"jobInstances">> = [];

    for (let i = 0; i < args.childIds.length; i++) {
      const childId = args.childIds[i];
      assertOwnedBy(await ctx.db.get(childId), user._id, "child");
      const timestamp = now + i;

      if (args.preApprove) {
        const instanceId = await ctx.db.insert("jobInstances", {
          userId: user._id,
          jobId: args.jobId,
          childId,
          status: "approved",
          startedAt: timestamp,
          completedAt: timestamp,
          approvedAt: timestamp,
          createdAt: timestamp,
        });
        ids.push(instanceId);
        await creditApprovedJob(ctx, {
          userId: user._id,
          childId,
          jobInstanceId: instanceId,
          amount: job.yenAmount,
          note: `Pre-approved: ${job.title}`,
        });
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
        userId: user._id,
        jobId: args.jobId,
        childId,
        date: args.date,
        priority: args.priority ?? "optional",
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const sj = assertOwnedByOrNull(
      await ctx.db.get(args.scheduledJobId),
      user._id,
      "scheduled job"
    );
    if (!sj) return null;

    // Also delete any job instances linked to this scheduled job
    const instances = await ctx.db
      .query("jobInstances")
      .withIndex("by_scheduled_job", (q) =>
        q.eq("scheduledJobId", args.scheduledJobId)
      )
      .collect();

    for (const instance of instances) {
      const exists = await ctx.db.get(instance._id);
      if (exists) await deleteJobInstanceAndProof(ctx, exists);
    }

    await ctx.db.delete(args.scheduledJobId);
    return null;
  },
});

// Remove all scheduled jobs for a child on a date (clear a day)
export const clearDay = mutation({
  args: {
    childId: v.id("children"),
    date: v.string(),
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
        if (exists) await deleteJobInstanceAndProof(ctx, exists);
      }

      await ctx.db.delete(entry._id);
    }
    return null;
  },
});
