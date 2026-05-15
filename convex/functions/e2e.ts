/**
 * DEV-ONLY E2E helpers — guarded against prod by env check.
 *
 * These mutations exist so Playwright specs can bypass UI surfaces that are
 * either expensive to drive (kid-side kanban) or that don't yet have stable
 * accessible locators. They are NOT for production use.
 *
 * ## Hard guard
 *
 * Every handler in this file calls `assertDevDeployment()` which throws
 * unless `CONVEX_DEPLOYMENT` starts with `dev:`. The Convex CLI sets this
 * env var on the deployment process at boot — for prod deployments it
 * starts with `prod:`. Anyone who manages to call these on prod gets a
 * thrown error before any data is touched.
 *
 * ## Auth
 *
 * Handlers also run `getCurrentUser(ctx)` so the caller must be a real
 * authenticated parent. Combined with the env guard, the attack surface is:
 *   - Must have a valid Clerk session.
 *   - Must be hitting a `dev:` Convex deployment.
 * Both must be true. In production, the env guard alone blocks 100% of calls.
 *
 * ## Helpers
 *
 * - `setJobInstanceCompleted` — flips an in-progress jobInstance to
 *   `completed`, bypassing the photo-proof requirement. Used by F8's parent
 *   happy-path spec so we don't have to spawn a second browser context just
 *   to drive the kid-side UI to mark a single job done.
 *
 * - `seedKidScenario` — in one transaction: create a child, create a job
 *   (with `requiresPhotoProof: true` and a configurable yenAmount), and
 *   schedule it for today as `mustDo`. Returns `{ childId, jobId,
 *   scheduledJobId }`. Used by F9's kid happy-path spec to skip the parent-
 *   side setup phase.
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getCurrentUser } from "./users";
import { ensureWalletsForChild } from "./wallets";
import { assertOwnedBy } from "../lib/auth";

function assertDevDeployment() {
  const deployment = process.env.CONVEX_DEPLOYMENT;
  if (!deployment || !deployment.startsWith("dev:")) {
    throw new Error(
      "E2E helpers disabled: CONVEX_DEPLOYMENT must start with 'dev:'."
    );
  }
}

/**
 * Force an in-progress jobInstance to `completed` without uploading photo
 * proof. Skips the proof validation that the public `complete` mutation
 * enforces, so this is dev-only by design.
 */
export const setJobInstanceCompleted = mutation({
  args: { instanceId: v.id("jobInstances") },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertDevDeployment();
    const user = await getCurrentUser(ctx);
    const instance = assertOwnedBy(
      await ctx.db.get(args.instanceId),
      user._id,
      "job instance"
    );
    if (instance.status !== "in_progress") {
      throw new Error(
        `E2E helper: instance must be in_progress, got '${instance.status}'`
      );
    }
    await ctx.db.patch(args.instanceId, {
      status: "completed",
      completedAt: Date.now(),
    });
    return null;
  },
});

/**
 * One-shot scenario seeder for F9 kid happy-path. Creates a child, a job, and
 * schedules the job for the given date (defaults to today). All three rows
 * belong to the calling parent.
 */
export const seedKidScenario = mutation({
  args: {
    childName: v.string(),
    childIcon: v.string(),
    childAge: v.optional(v.number()),
    jobTitle: v.string(),
    jobIcon: v.string(),
    jobYenAmount: v.number(),
    jobRequiresPhotoProof: v.optional(v.boolean()),
    date: v.string(), // YYYY-MM-DD
    priority: v.optional(
      v.union(v.literal("mustDo"), v.literal("optional"))
    ),
  },
  returns: v.object({
    childId: v.id("children"),
    jobId: v.id("jobs"),
    scheduledJobId: v.id("scheduledJobs"),
  }),
  handler: async (ctx, args) => {
    assertDevDeployment();
    const user = await getCurrentUser(ctx);
    const now = Date.now();

    const childId = await ctx.db.insert("children", {
      userId: user._id,
      name: args.childName,
      icon: args.childIcon,
      age: args.childAge,
      rankMultiplier: 1,
      createdAt: now,
    });
    await ensureWalletsForChild(ctx, user._id, childId);

    const jobId = await ctx.db.insert("jobs", {
      userId: user._id,
      title: args.jobTitle,
      yenAmount: args.jobYenAmount,
      icon: args.jobIcon,
      requiresPhotoProof: args.jobRequiresPhotoProof ?? false,
      createdAt: now,
    });

    const scheduledJobId = await ctx.db.insert("scheduledJobs", {
      userId: user._id,
      jobId,
      childId,
      date: args.date,
      priority: args.priority ?? "mustDo",
      createdAt: now,
    });

    return { childId, jobId, scheduledJobId };
  },
});
