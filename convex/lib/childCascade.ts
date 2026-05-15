/**
 * Pure cascade-plan for `children.remove` — NO Convex imports.
 *
 * The actual delete loop in `convex/functions/children.ts` walks each of
 * these tables by the `by_child` index and removes every row keyed on the
 * removed child. The shape of WHICH tables to walk is data, not behavior,
 * so we keep it here as a single source of truth that can be unit-tested
 * without spinning up a Convex runtime.
 *
 * If you add a new per-child table (e.g. notifications, streaks), add it
 * to this list AND wire the corresponding `.query(...).withIndex("by_child", ...)`
 * loop in `children.remove`. The test in `__tests__/edge-cases.test.ts`
 * will fail until both are updated, which is the desired tripwire.
 *
 * jobInstances + scheduledJobs aren't included here because they need
 * non-trivial cleanup (proof storage, by_user index) that's not a simple
 * `ctx.db.delete` loop.
 */
export const CHILD_CASCADE_TABLES = [
  "wallets",
  "transactions",
  "goals",
  "luckyChests",
] as const;

export type ChildCascadeTable = (typeof CHILD_CASCADE_TABLES)[number];

/** Returns the simple-cascade table list. Stable, deterministic, ordered. */
export function getChildCascadeTables(): readonly ChildCascadeTable[] {
  return CHILD_CASCADE_TABLES;
}
