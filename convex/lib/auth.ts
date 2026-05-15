import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Shared ownership / auth helpers for Convex functions.
 *
 * Every public query and mutation in `convex/functions/*.ts` MUST:
 *   1. Resolve the current user via `getCurrentUser(ctx)` (re-exported from
 *      `functions/users.ts`).
 *   2. Assert ownership of any row it reads or writes by calling one of the
 *      helpers below. Do NOT inline `if (doc.userId !== user._id) throw ...`
 *      checks anymore — funnel them through here so the rules stay uniform
 *      and the audit surface is small.
 *
 * Usage:
 *   const user = await getCurrentUser(ctx);
 *   const child = await ctx.db.get(childId);
 *   assertOwnedBy(child, user._id, "child"); // throws if !child or wrong owner
 */

type OwnedDoc = { userId: Id<"users"> } & { _id: unknown };

/**
 * Assert that `doc` exists and belongs to `userId`. Throws otherwise.
 *
 * @param doc      The document fetched via `ctx.db.get(...)`. May be `null`.
 * @param userId   The current user's `_id` (from `getCurrentUser`).
 * @param resource Human-readable label used in the error message, e.g. "child".
 * @returns        The doc, narrowed to non-null and confirmed-owned.
 */
export function assertOwnedBy<T extends OwnedDoc>(
  doc: T | null,
  userId: Id<"users">,
  resource: string
): T {
  if (!doc) {
    throw new Error(`${capitalize(resource)} not found`);
  }
  if (doc.userId !== userId) {
    throw new Error(`Not your ${resource}`);
  }
  return doc;
}

/**
 * Like `assertOwnedBy` but returns `null` if the doc is missing (idempotent
 * delete pattern). Still throws on wrong-owner — soft-not-found is fine,
 * cross-tenant access never is.
 */
export function assertOwnedByOrNull<T extends OwnedDoc>(
  doc: T | null,
  userId: Id<"users">,
  resource: string
): T | null {
  if (!doc) return null;
  if (doc.userId !== userId) {
    throw new Error(`Not your ${resource}`);
  }
  return doc;
}

/**
 * Fetch a doc by id and assert ownership in one call. Throws on missing OR
 * wrong-owner. Convenience wrapper over `ctx.db.get` + `assertOwnedBy`.
 */
export async function getOwnedById<TableName extends "children" | "jobs" | "scheduledJobs" | "jobInstances" | "wallets" | "goals" | "luckyChests" | "transactions">(
  ctx: QueryCtx | MutationCtx,
  id: Id<TableName>,
  userId: Id<"users">,
  resource: string
): Promise<Doc<TableName>> {
  const doc = await ctx.db.get(id);
  return assertOwnedBy(doc as (Doc<TableName> & OwnedDoc) | null, userId, resource) as Doc<TableName>;
}

function capitalize(s: string) {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}
