/**
 * Pure wallet math helpers — NO Convex imports, NO `ctx`.
 *
 * Why pure: these run in two places (Convex server functions AND Vitest
 * unit tests). Keeping them dependency-free makes the contract testable
 * without spinning up a Convex backend.
 *
 * Rounding rule (CONTRACT):
 *   - save = floor(amount * splitSave/100)
 *   - give = floor(amount * splitGive/100)
 *   - spend = amount - save - give   (remainder ALWAYS lands here)
 *
 * Why: this matches the existing inline math in `convex/functions/wallets.ts`
 * (extracted unchanged in F2). The invariant `spend + save + give === amount`
 * holds for ALL non-negative integer inputs and ALL valid splits.
 *
 * Example for ¥10 @ 70/20/10: save=2, give=1, spend=7 → 7+2+1=10 ✓
 * Example for ¥101 @ 70/20/10: save=20, give=10, spend=71 → 71+20+10=101 ✓
 * Example for ¥7 @ 70/20/10: save=floor(1.4)=1, give=floor(0.7)=0, spend=6 → 6+1+0=7 ✓
 */

export type JarKey = "spend" | "save" | "give";

export interface JarSplit {
  spend: number;
  save: number;
  give: number;
}

export const DEFAULT_SPLIT: JarSplit = { spend: 70, save: 20, give: 10 };

/**
 * Split an integer yen `amount` across the three jars per the given split
 * percentages (default 70/20/10).
 *
 * @throws if `amount` is negative, non-finite, or non-integer.
 * @throws if `split` percentages don't sum to exactly 100.
 * @throws if any split percentage is negative.
 */
export function splitEarning(amount: number, split: JarSplit = DEFAULT_SPLIT): JarSplit {
  if (!Number.isFinite(amount)) {
    throw new Error(`splitEarning: amount must be a finite number, got ${amount}`);
  }
  if (!Number.isInteger(amount)) {
    throw new Error(`splitEarning: amount must be an integer (yen has no fractional cents), got ${amount}`);
  }
  if (amount < 0) {
    throw new Error(`splitEarning: amount must be non-negative, got ${amount}`);
  }

  if (split.spend < 0 || split.save < 0 || split.give < 0) {
    throw new Error(
      `splitEarning: split percentages must be non-negative, got ${JSON.stringify(split)}`
    );
  }
  const total = split.spend + split.save + split.give;
  if (total !== 100) {
    throw new Error(
      `splitEarning: split percentages must sum to 100, got ${total} (${JSON.stringify(split)})`
    );
  }

  // Floor save + give, then remainder goes to spend. Preserves the
  // sum-invariant by construction.
  const save = Math.floor((amount * split.save) / 100);
  const give = Math.floor((amount * split.give) / 100);
  const spend = amount - save - give;

  return { spend, save, give };
}
