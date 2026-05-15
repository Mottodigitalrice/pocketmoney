import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getCurrentUser } from "./users";
import { creditApprovedJob } from "./wallets";
import { assertOwnedBy, assertOwnedByOrNull } from "../lib/auth";

const PROOF_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_PROOF_BYTES = 2.5 * 1024 * 1024;

const proofArgs = v.object({
  storageId: v.id("_storage"),
  fileName: v.string(),
  contentType: v.string(),
  size: v.number(),
});

const jobInstanceStatusValidator = v.union(
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("approved"),
  v.literal("rejected")
);

// Job instance shape plus a resolved proofUrl (or null when proof is absent
// or expired).
const jobInstanceWithProofUrlValidator = v.object({
  _id: v.id("jobInstances"),
  _creationTime: v.number(),
  userId: v.id("users"),
  jobId: v.id("jobs"),
  childId: v.id("children"),
  scheduledJobId: v.optional(v.id("scheduledJobs")),
  status: jobInstanceStatusValidator,
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
  proofUrl: v.union(v.string(), v.null()),
});

function isImageContentType(contentType: string) {
  return contentType.startsWith("image/");
}

export async function deleteJobInstanceAndProof(
  ctx: MutationCtx,
  instance: Doc<"jobInstances">
) {
  if (instance.proofStorageId && !instance.proofDeletedAt) {
    try {
      await ctx.storage.delete(instance.proofStorageId);
    } catch {
      // Instance deletion should stay idempotent if storage was already removed.
    }
  }

  await ctx.db.delete(instance._id);
}

async function withProofUrl<T extends { proofStorageId?: Id<"_storage">; proofDeletedAt?: number }>(
  ctx: QueryCtx,
  instance: T
) {
  if (!instance.proofStorageId || instance.proofDeletedAt) {
    return { ...instance, proofUrl: null };
  }

  return {
    ...instance,
    proofUrl: await ctx.storage.getUrl(instance.proofStorageId),
  };
}

// Get all job instances for a family
export const getByFamily = query({
  args: {},
  returns: v.array(jobInstanceWithProofUrlValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const instances = await ctx.db
      .query("jobInstances")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return await Promise.all(
      instances.map(async (instance) => await withProofUrl(ctx, instance))
    );
  },
});

// Get all job instances for a specific child
export const getByChild = query({
  args: { childId: v.id("children") },
  returns: v.array(jobInstanceWithProofUrlValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const child = await ctx.db.get(args.childId);
    if (!child) return [];
    assertOwnedBy(child, user._id, "child");

    const instances = await ctx.db
      .query("jobInstances")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
    return await Promise.all(
      instances.map(async (instance) => await withProofUrl(ctx, instance))
    );
  },
});

export const generateProofUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Start a new job instance (optionally from a scheduled job)
export const start = mutation({
  args: {
    jobId: v.id("jobs"),
    childId: v.id("children"),
    scheduledJobId: v.optional(v.id("scheduledJobs")),
  },
  returns: v.id("jobInstances"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const [job, child, scheduledJob] = await Promise.all([
      ctx.db.get(args.jobId),
      ctx.db.get(args.childId),
      args.scheduledJobId ? ctx.db.get(args.scheduledJobId) : Promise.resolve(null),
    ]);

    assertOwnedBy(job, user._id, "job");
    assertOwnedBy(child, user._id, "child");
    if (args.scheduledJobId) {
      const sj = assertOwnedBy(scheduledJob, user._id, "scheduled job");
      if (sj.jobId !== args.jobId || sj.childId !== args.childId) {
        throw new Error("Invalid scheduled job");
      }
    }

    return await ctx.db.insert("jobInstances", {
      userId: user._id,
      jobId: args.jobId,
      childId: args.childId,
      scheduledJobId: args.scheduledJobId,
      status: "in_progress",
      startedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

// Mark a job instance as completed by the child
export const complete = mutation({
  args: {
    instanceId: v.id("jobInstances"),
    proof: v.optional(proofArgs),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const instance = assertOwnedByOrNull(
      await ctx.db.get(args.instanceId),
      user._id,
      "job instance"
    );
    if (!instance) return null;
    if (instance.status !== "in_progress") {
      throw new Error("Only in-progress jobs can be completed");
    }

    const job = assertOwnedBy(
      await ctx.db.get(instance.jobId),
      user._id,
      "job"
    );
    if (job.requiresPhotoProof && !args.proof && !instance.proofStorageId) {
      throw new Error("Photo proof is required for this job");
    }
    if (args.proof) {
      if (!isImageContentType(args.proof.contentType)) {
        throw new Error("Photo proof must be an image");
      }
      if (args.proof.size <= 0 || args.proof.size > MAX_PROOF_BYTES) {
        throw new Error("Photo proof is too large");
      }
    }

    const now = Date.now();
    const updates: {
      status: "completed";
      completedAt: number;
      proofStorageId?: Id<"_storage">;
      proofFileName?: string;
      proofContentType?: string;
      proofFileSize?: number;
      proofUploadedAt?: number;
    } = {
      status: "completed",
      completedAt: now,
    };

    if (args.proof) {
      updates.proofStorageId = args.proof.storageId;
      updates.proofFileName = args.proof.fileName;
      updates.proofContentType = args.proof.contentType;
      updates.proofFileSize = args.proof.size;
      updates.proofUploadedAt = now;
    }

    await ctx.db.patch(args.instanceId, updates);
    return null;
  },
});

// Approve a completed job instance (parent action)
export const approve = mutation({
  args: { instanceId: v.id("jobInstances") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const instance = assertOwnedByOrNull(
      await ctx.db.get(args.instanceId),
      user._id,
      "job instance"
    );
    if (!instance) return null;
    if (instance.status === "approved") return null;

    const job = assertOwnedBy(
      await ctx.db.get(instance.jobId),
      user._id,
      "job"
    );

    await ctx.db.patch(args.instanceId, {
      status: "approved",
      approvedAt: Date.now(),
    });

    await creditApprovedJob(ctx, {
      userId: user._id,
      childId: instance.childId,
      jobInstanceId: args.instanceId,
      amount: job.yenAmount,
      note: `Approved: ${job.title}`,
    });
    return null;
  },
});

export const cleanupApprovedPhotoProofs = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx) => {
    const cutoff = Date.now() - PROOF_RETENTION_MS;
    const instances = await ctx.db.query("jobInstances").collect();
    let deleted = 0;

    for (const instance of instances) {
      if (
        instance.status !== "approved" ||
        !instance.approvedAt ||
        instance.approvedAt > cutoff ||
        !instance.proofStorageId ||
        instance.proofDeletedAt
      ) {
        continue;
      }

      try {
        await ctx.storage.delete(instance.proofStorageId);
      } catch {
        // Keep cleanup idempotent if storage was already removed manually.
      }

      await ctx.db.patch(instance._id, {
        proofDeletedAt: Date.now(),
      });
      deleted += 1;
    }

    return { deleted };
  },
});

// Reject a completed job instance (parent action)
export const reject = mutation({
  args: {
    instanceId: v.id("jobInstances"),
    parentNote: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const instance = assertOwnedByOrNull(
      await ctx.db.get(args.instanceId),
      user._id,
      "job instance"
    );
    if (!instance) return null;

    await ctx.db.patch(args.instanceId, {
      status: "rejected",
      rejectedAt: Date.now(),
      rejectionCount: (instance.rejectionCount ?? 0) + 1,
      parentNote: args.parentNote,
    });
    return null;
  },
});

