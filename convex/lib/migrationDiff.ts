/**
 * Pure migration-diff math — NO Convex imports, NO `ctx`.
 *
 * Used by `convex/functions/wallets.ts::migrateLegacyEarnings` to compute,
 * per-child and per-jar, exactly how much the migration mutation should
 * credit RIGHT NOW vs. what was already credited by past (possibly partial)
 * runs.
 *
 * Why this exists: the original mutation skipped a child if ANY migration-type
 * transaction existed. If a previous run crashed after crediting Spend but
 * before Save+Give, that child was stuck with a partial migration forever.
 * This helper makes the migration **per-jar idempotent**: it always credits
 * exactly the missing delta, never re-credits an already-migrated jar, and
 * never undoes a manual adjustment that exceeded the expected split.
 *
 * Contract:
 *   - `lifetimeEarnings` = sum of `earning`-type transactions on the child
 *     (does NOT include bonus / interest / luckyChest — those are post-split
 *     credits already and aren't part of the migration baseline).
 *   - `actualSpend / actualSave / actualGive` = sum of migration-type
 *     transactions per jar (the immutable ledger of what previous runs did).
 *   - `delta.jar = max(0, expected.jar - actual.jar)`. Negative deltas (jar
 *     already over-credited via manual adjustment) clamp to 0 — we NEVER
 *     issue compensating debits because the ledger is immutable.
 *   - If all three deltas are zero, the migration is a no-op for that child.
 */

import {
  splitEarning as splitEarningPure,
  type JarSplit,
  DEFAULT_SPLIT,
} from "./walletMath";

export { splitEarningPure as splitEarning, DEFAULT_SPLIT };
export type { JarSplit };

export interface MigrationDiffInput {
  lifetimeEarnings: number;
  actualSpend: number;
  actualSave: number;
  actualGive: number;
}

export interface MigrationDiffResult {
  expected: JarSplit;
  actual: JarSplit;
  delta: JarSplit;
}

/**
 * Compute the per-jar migration delta for a single child.
 *
 * @param input        lifetime earnings + per-jar amounts already credited
 *                     by past migration runs (from migration-type txns).
 * @param split        Split percentages. Defaults to the 70/20/10 contract.
 * @returns            `{ expected, actual, delta }` where `delta` is what
 *                     SHOULD be credited on this run. All deltas are >= 0.
 */
export function computeMigrationDelta(
  input: MigrationDiffInput,
  split: JarSplit = DEFAULT_SPLIT,
): MigrationDiffResult {
  const expected = splitEarningPure(input.lifetimeEarnings, split);
  const actual: JarSplit = {
    spend: input.actualSpend,
    save: input.actualSave,
    give: input.actualGive,
  };
  const delta: JarSplit = {
    // Clamp negative deltas to 0. A negative delta means a manual adjustment
    // already pushed that jar past `expected` — we honour the adjustment and
    // do nothing on this jar rather than reverse it.
    spend: Math.max(0, expected.spend - actual.spend),
    save: Math.max(0, expected.save - actual.save),
    give: Math.max(0, expected.give - actual.give),
  };
  return { expected, actual, delta };
}

/**
 * Helper: true iff every jar's delta is zero (the migration is already
 * fully applied for this child). Lets the mutation short-circuit writes.
 */
export function isDeltaZero(delta: JarSplit): boolean {
  return delta.spend === 0 && delta.save === 0 && delta.give === 0;
}
