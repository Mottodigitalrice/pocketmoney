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

  // Jobs available for a family
  jobs: defineTable({
    userId: v.id("users"),
    title: v.string(),
    titleJa: v.optional(v.string()),
    titleKey: v.optional(v.string()),
    yenAmount: v.number(),
    assignedTo: v.string(), // "all" or a child's _id string
    dailyLimit: v.number(),
    weeklyLimit: v.number(),
    icon: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Individual job completions
  jobInstances: defineTable({
    userId: v.id("users"),
    jobId: v.id("jobs"),
    childId: v.id("children"),
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
    .index("by_child_status", ["childId", "status"]),
});
