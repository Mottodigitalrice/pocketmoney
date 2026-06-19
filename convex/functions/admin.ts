/**
 * DESTRUCTIVE ADMIN TOOL — full-deployment user wipe.
 *
 * `clearAllUsers` deletes EVERY user and all of their user-scoped data on
 * whatever deployment it is run against (dev OR prod — there is no env guard,
 * because the intended use is a deliberate prod data reset).
 *
 * It is an `internalMutation`, so it is NOT callable from the client / public
 * API. The only way to invoke it is the Convex CLI:
 *
 *   # SAFE default — counts what would be deleted, deletes nothing:
 *   npx convex run functions/admin:clearAllUsers --prod
 *
 *   # ACTUALLY wipe everything (irreversible):
 *   npx convex run functions/admin:clearAllUsers '{"confirm":true}' --prod
 *
 * Because `confirm` defaults to a dry-run, an accidental no-args invocation
 * against prod is harmless. You must pass `{"confirm":true}` explicitly to
 * delete data.
 *
 * Modelled on `_smokeTeardown` in `convex/__smoke__/cross_tenant.ts` — same
 * 8-table dependency order — but iterates ALL users instead of a passed-in
 * clerkId list, and also deletes orphaned proof blobs from storage.
 *
 * ## Per-mutation size ceiling
 *
 * The whole wipe runs as a SINGLE Convex transaction. On a large dataset it can
 * hit Convex's per-mutation limits (documents scanned / execution time) and
 * abort partway through, leaving a PARTIAL wipe. The deletion order above is
 * dependency-safe, so a clean re-run simply picks up whatever remains and
 * finishes the job — no orphaned rows or dangling references result from a
 * mid-run abort.
 *
 * OPERATOR GUIDANCE: run it repeatedly until the returned `users`/`rows` counts
 * reach 0. For this hobby app the dataset is tiny, so it'll almost always
 * complete in a single run — but on a big deployment, keep re-running.
 */

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const clearAllUsers = internalMutation({
  args: { confirm: v.boolean() },
  returns: v.object({
    dryRun: v.boolean(),
    users: v.number(),
    rows: v.number(),
    proofBlobs: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const dryRun = !args.confirm;

    // User-scoped tables in dependency-safe deletion order. Mirrors
    // `_smokeTeardown` exactly: children-derived rows (luckyChests, goals,
    // transactions, wallets, jobInstances) first, then the scheduling /
    // job-library rows, then children last (before the user row itself).
    const tables = [
      "luckyChests",
      "goals",
      "transactions",
      "wallets",
      "jobInstances",
      "scheduledJobs",
      "jobs",
      "children",
    ] as const;

    const users = await ctx.db.query("users").collect();

    let userCount = 0;
    let rowCount = 0;
    let proofBlobCount = 0;

    for (const user of users) {
      for (const table of tables) {
        const rows = await ctx.db
          .query(table)
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        for (const row of rows) {
          // jobInstances may reference an uploaded photo-proof blob in
          // `_storage`. Delete the blob BEFORE deleting the row so we never
          // orphan it. Wrapped in try/catch so an already-deleted blob (e.g.
          // proof was previously cleared) doesn't abort the whole wipe.
          if (table === "jobInstances") {
            const proofStorageId = (
              row as {
                proofStorageId?: import("../_generated/dataModel").Id<"_storage">;
              }
            ).proofStorageId;
            if (proofStorageId) {
              try {
                if (!dryRun) {
                  await ctx.storage.delete(proofStorageId);
                }
                proofBlobCount += 1;
              } catch {
                // Blob already gone — ignore.
              }
            }
          }

          if (!dryRun) {
            await ctx.db.delete(row._id);
          }
          rowCount += 1;
        }
      }

      if (!dryRun) {
        await ctx.db.delete(user._id);
      }
      userCount += 1;
    }

    const message = dryRun
      ? `DRY RUN — pass confirm:true to delete. Would delete ${userCount} users, ${rowCount} rows, ${proofBlobCount} proof blobs.`
      : `Deleted ${userCount} users, ${rowCount} rows, ${proofBlobCount} proof blobs.`;

    return {
      dryRun,
      users: userCount,
      rows: rowCount,
      proofBlobs: proofBlobCount,
      message,
    };
  },
});
