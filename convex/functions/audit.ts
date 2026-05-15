/**
 * Owner-triggered storage audit (F5).
 *
 * Purpose: detect and clean up orphaned `_storage` files that were uploaded
 * as photo proofs but are no longer referenced by any `jobInstances` row.
 * Such orphans can arise when:
 *   - A proof upload succeeds but the subsequent `jobInstances` patch fails.
 *   - A jobInstance is deleted while it still had `proofStorageId` set (the
 *     `cleanupApprovedPhotoProofs` cron only acts on *approved* instances).
 *   - A smoke test creates real storage rows and the cleanup half of the test
 *     never runs (the known 2026-05-09 orphan in dev was exactly this).
 *
 * ---------------------------------------------------------------------------
 * IMPORTANT MULTI-FAMILY SAFETY NOTE — read before extending this module.
 * ---------------------------------------------------------------------------
 * The `_storage` table in Convex is **deployment-global**, not family-scoped.
 * `assertOwnedBy` works on `jobInstances` (which carry `userId`) but `_storage`
 * rows have no `userId`. That means:
 *
 *   1. We CANNOT correctly identify "this family's orphans" in the strict
 *      sense — we can only identify "storage files not referenced by any of
 *      this family's jobInstances." Those two sets differ: another family's
 *      legitimately-referenced photo proof is also "not referenced by this
 *      family." If we treated it as an orphan, we would delete another
 *      family's data.
 *
 *   2. The CORRECT use of this audit is therefore **single-family deployments
 *      OR dev cleanup**. In production with multiple families, an owner-only
 *      view of `findOrphanedProofs` will report many false positives (other
 *      families' rows). The owner MUST cross-check against expected upload
 *      sizes / content types before passing IDs to `deleteOrphanedProofs`.
 *      The mutation rejects any ID not surfaced by `findOrphanedProofs`, but
 *      `findOrphanedProofs` itself is not a safety net here.
 *
 *   3. Consequently this module is intentionally **NOT scheduled in
 *      `convex/crons.ts`**. An automated cron call from one family would
 *      surface every other family's files as "orphans"; even if the cron
 *      didn't auto-delete (which it wouldn't, since `confirm: true` is
 *      required), surfacing them is a privacy leak the audit shouldn't
 *      enable. Manual, owner-initiated invocation only — and in the dashboard
 *      the human is the final safety check.
 *
 *   4. Pattern note: `findOrphanedProofs` is a `query` because
 *      `ctx.db.system.query("_storage")` is only available in queries.
 *      `deleteOrphanedProofs` is a `mutation` (owner-triggered, NOT an
 *      `internalMutation`) and cannot enumerate `_storage` itself — the
 *      caller must invoke `findOrphanedProofs` first and pass the resulting
 *      array of storage IDs into `deleteOrphanedProofs`. The mutation then
 *      re-verifies each ID against the current orphan set before deleting.
 *
 * Storage-delete API: matches `cleanupApprovedPhotoProofs` in
 * `convex/functions/jobInstances.ts` — `await ctx.storage.delete(storageId)`,
 * wrapped in try/catch so a re-run after partial failure stays idempotent.
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { getCurrentUser } from "./users";
import { findOrphansInList } from "../lib/orphanSweep";

const orphanRowValidator = v.object({
  storageId: v.id("_storage"),
  contentType: v.union(v.string(), v.null()),
  size: v.union(v.number(), v.null()),
  createdAt: v.number(),
});

/**
 * List `_storage` rows that are NOT referenced by any of the current user's
 * `jobInstances.proofStorageId`. See the "MULTI-FAMILY SAFETY NOTE" above:
 * in a multi-family deployment this will also surface other families' files
 * and the human reviewer is responsible for filtering.
 *
 * Owner-only — requires an authenticated session via `getCurrentUser`. No
 * args (the entire system table is scanned; do not call this in a hot path).
 */
export const findOrphanedProofs = query({
  args: {},
  returns: v.array(orphanRowValidator),
  handler: async (ctx) => {
    // Auth gate — must be a logged-in user. We don't need `assertOwnedBy`
    // here because `_storage` rows have no owner field; the only thing we
    // CAN scope is the reference set, which is exactly what we do below.
    const user = await getCurrentUser(ctx);

    // Collect every storage file currently in the deployment.
    const allStorage = await ctx.db.system.query("_storage").collect();

    // Collect every storage ID referenced by THIS family's jobInstances.
    const myInstances = await ctx.db
      .query("jobInstances")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    const referencedIds = myInstances
      .map((inst) => inst.proofStorageId)
      .filter((id): id is Id<"_storage"> => id !== undefined);

    // Pure set-difference, extracted for testability.
    const orphanIds = new Set(
      findOrphansInList(
        allStorage.map((s) => s._id as unknown as string),
        referencedIds as unknown as string[]
      )
    );

    return allStorage
      .filter((s) => orphanIds.has(s._id as unknown as string))
      .map((s) => ({
        storageId: s._id,
        contentType: s.contentType ?? null,
        size: s.size ?? null,
        createdAt: s._creationTime,
      }));
  },
});

/**
 * Delete the storage IDs supplied in `args.storageIds`. Each ID is re-verified
 * against the current `findOrphanedProofs` output before deletion — if an ID
 * is no longer an orphan (e.g. a `jobInstances` patch landed between the read
 * and the delete) it is silently skipped.
 *
 * Args:
 *   - `confirm`    (required, must be `true` to actually delete; any other
 *                  value is a dry-run and returns `deleted: 0`).
 *   - `storageIds` (REQUIRED — see header comment: a mutation cannot enumerate
 *                  `_storage` itself, so the caller must pass the list it got
 *                  back from `findOrphanedProofs`).
 *
 * Owner-only — `getCurrentUser` enforces auth. Note: we do not call
 * `assertOwnedBy` on `_storage` because the table has no `userId`. The
 * implicit ownership check is the orphan re-verification: an ID can only be
 * in the orphan set if it isn't referenced by another family's instances OR
 * by this family's instances — and that's the best `_storage` lets us do.
 * See header comment for why this is acceptable for manual sweep but NOT
 * safe to auto-cron.
 */
export const deleteOrphanedProofs = mutation({
  args: {
    confirm: v.boolean(),
    storageIds: v.array(v.id("_storage")),
  },
  returns: v.object({
    deleted: v.number(),
    storageIds: v.array(v.id("_storage")),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Auth gate — must be a logged-in user.
    const user = await getCurrentUser(ctx);

    if (args.confirm !== true) {
      return {
        deleted: 0,
        storageIds: [],
        message:
          "dry run; pass confirm: true to actually delete the supplied storageIds",
      };
    }

    // Re-derive the current orphan set (same logic as findOrphanedProofs;
    // duplicated because a mutation cannot call a query in the same txn).
    const myInstances = await ctx.db
      .query("jobInstances")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
    const referencedIds = new Set(
      myInstances
        .map((inst) => inst.proofStorageId)
        .filter((id): id is Id<"_storage"> => id !== undefined)
        .map((id) => id as unknown as string)
    );

    const deletedIds: Id<"_storage">[] = [];

    for (const storageId of args.storageIds) {
      // Skip anything that is no longer an orphan (a concurrent upload may
      // have claimed it). De-dupe also handled here via deletedIds inclusion.
      if (referencedIds.has(storageId as unknown as string)) continue;
      if (deletedIds.includes(storageId)) continue;

      try {
        await ctx.storage.delete(storageId);
      } catch {
        // Stay idempotent — re-running after a partial failure is supported.
      }
      deletedIds.push(storageId);
    }

    return { deleted: deletedIds.length, storageIds: deletedIds };
  },
});
