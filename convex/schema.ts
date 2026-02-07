import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users/Families table (synced with Clerk)
  // Each user represents one family account
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Children belonging to a family
  children: defineTable({
    userId: v.id("users"),
    name: v.string(),
    icon: v.string(), // avatar key: "shark", "dolphin", "turtle", "octopus", "starfish", "whale", "crab", "fish"
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Job library - reusable job templates
  jobs: defineTable({
    userId: v.id("users"),
    title: v.string(),
    titleJa: v.optional(v.string()),
    titleKey: v.optional(v.string()),
    yenAmount: v.number(),
    icon: v.string(),
    isOneOff: v.optional(v.boolean()),
    // Legacy fields kept optional for migration
    assignedTo: v.optional(v.string()),
    dailyLimit: v.optional(v.number()),
    weeklyLimit: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Scheduled job assignments - links jobs to children on specific dates
  scheduledJobs: defineTable({
    userId: v.id("users"),
    jobId: v.id("jobs"),
    childId: v.id("children"),
    date: v.string(), // "YYYY-MM-DD" format
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_child_date", ["childId", "date"])
    .index("by_job", ["jobId"]),

  // Individual job completions
  jobInstances: defineTable({
    userId: v.id("users"),
    jobId: v.id("jobs"),
    childId: v.id("children"),
    scheduledJobId: v.optional(v.id("scheduledJobs")),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_child", ["childId"])
    .index("by_job", ["jobId"])
    .index("by_child_status", ["childId", "status"])
    .index("by_scheduled_job", ["scheduledJobId"]),
});
