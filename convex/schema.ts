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
    captainCodeEnabled: v.optional(v.boolean()),
    luckyChestMaxAmount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Children belonging to a family
  children: defineTable({
    userId: v.id("users"),
    name: v.string(),
    icon: v.string(), // avatar key: "shark", "dolphin", "turtle", "octopus", "starfish", "whale", "crab", "fish"
    age: v.optional(v.number()),
    rankMultiplier: v.optional(v.number()),
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
    requiresPhotoProof: v.optional(v.boolean()),
    recurrence: v.optional(
      v.object({
        type: v.union(
          v.literal("none"),
          v.literal("daily"),
          v.literal("weekdays"),
          v.literal("specificDays"),
        ),
        daysOfWeek: v.optional(v.array(v.number())),
        priority: v.optional(
          v.union(v.literal("mustDo"), v.literal("optional")),
        ),
      }),
    ),
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
    priority: v.optional(v.union(v.literal("mustDo"), v.literal("optional"))),
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
      v.literal("rejected"),
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    rejectionCount: v.optional(v.number()),
    parentNote: v.optional(v.string()),
    proofStorageId: v.optional(v.id("_storage")),
    proofFileName: v.optional(v.string()),
    proofContentType: v.optional(v.string()),
    proofFileSize: v.optional(v.number()),
    proofUploadedAt: v.optional(v.number()),
    proofDeletedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_child", ["childId"])
    .index("by_job", ["jobId"])
    .index("by_child_status", ["childId", "status"])
    .index("by_scheduled_job", ["scheduledJobId"]),

  wallets: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    jar: v.union(v.literal("spend"), v.literal("save"), v.literal("give")),
    balance: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_child", ["childId"])
    .index("by_child_jar", ["childId", "jar"]),

  transactions: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    walletId: v.optional(v.id("wallets")),
    jar: v.optional(
      v.union(v.literal("spend"), v.literal("save"), v.literal("give")),
    ),
    amount: v.number(),
    type: v.union(
      v.literal("earning"),
      v.literal("interest"),
      v.literal("withdrawal"),
      v.literal("migration"),
      v.literal("correction"),
      v.literal("bonus"),
      v.literal("luckyChest"),
    ),
    reason: v.optional(
      v.union(
        v.literal("cashOut"),
        v.literal("penalty"),
        v.literal("correction"),
        v.literal("other"),
      ),
    ),
    note: v.optional(v.string()),
    jobInstanceId: v.optional(v.id("jobInstances")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_child", ["childId"])
    .index("by_wallet", ["walletId"])
    .index("by_job_instance", ["jobInstanceId"]),

  goals: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    title: v.string(),
    targetAmount: v.number(),
    emoji: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_child", ["childId"])
    .index("by_child_status", ["childId", "status"]),

  luckyChests: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    weekStart: v.string(),
    amount: v.number(),
    openedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_child", ["childId"])
    .index("by_child_week", ["childId", "weekStart"]),
});
