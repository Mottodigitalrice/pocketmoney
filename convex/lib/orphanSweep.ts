/**
 * Pure orphan-storage math — NO Convex imports, NO `ctx`.
 *
 * Used by `convex/functions/audit.ts::findOrphanedProofs` to compute the set
 * difference between the IDs in `_storage` and the IDs claimed by this
 * family's `jobInstances.proofStorageId`. Set logic is trivial but extracted
 * here for the same reason as the other `convex/lib/` helpers: it can be
 * tested without spinning up the Convex test harness.
 *
 * Contract:
 *   - `findOrphansInList(all, referenced)` returns every string in `all` that
 *     is NOT in `referenced`.
 *   - Order of the output matches the order of `all` (stable; useful for
 *     making the surfaced list deterministic in the Convex dashboard).
 *   - Duplicate entries in either input are de-duplicated for membership
 *     purposes but the output never contains duplicates (so calling this
 *     repeatedly with the same inputs is idempotent — the deletion mutation
 *     can safely receive the same list twice without trying to double-delete
 *     anything that has already been removed).
 *   - Empty inputs are handled gracefully:
 *       findOrphansInList([], anything) → []
 *       findOrphansInList(all, [])      → unique(all)
 */

export function findOrphansInList(
  allStorageIds: string[],
  referencedStorageIds: string[],
): string[] {
  const referencedSet = new Set(referencedStorageIds);
  const seenOrphans = new Set<string>();
  const orphans: string[] = [];

  for (const id of allStorageIds) {
    if (referencedSet.has(id)) continue;
    if (seenOrphans.has(id)) continue;
    seenOrphans.add(id);
    orphans.push(id);
  }

  return orphans;
}
