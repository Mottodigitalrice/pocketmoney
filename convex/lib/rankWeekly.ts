/**
 * Pure weekly-delta math — NO Convex imports, NO React.
 *
 * Why pure: this powers a kudos line on the kid dashboard (`SiblingRankBoard`)
 * and is also unit-testable without spinning up Convex. Same style as
 * `rankMath.ts` / `walletMath.ts` / `luckyChestMath.ts`.
 *
 * Motivation (G5):
 *   The lifetime leaderboard normalizes age via `rankMultiplier` in the
 *   computed score, but the *visual* leaderboard still shows raw lifetime
 *   yen, so a trailing 4yo sibling reads as "behind" even when the math
 *   says otherwise. This helper produces a private encouragement signal
 *   that compares THIS WEEK's earnings against the SAME child's own rolling
 *   4-week average — never against siblings — so the kudos line is always
 *   self-vs-self.
 *
 * Earning-only contract:
 *   The helper is intentionally agnostic about transaction shape — the
 *   caller is responsible for filtering to "earnings" before passing the
 *   amounts in. We pre-filter again here (drop non-positive values) as a
 *   defensive belt-and-suspenders: spending, withdrawals, and zero/negative
 *   amounts should never weigh into a "did you earn more than usual?" signal.
 *   See `convex/lib/walletMath.ts` for the canonical `splitEarning` contract
 *   on what constitutes a positive earning amount.
 *
 * Threshold model (tunable):
 *   ratio >= 1.20  → above_avg  ("you earned more than usual — keep going!")
 *   ratio <= 0.80  → below_avg  ("usual is higher — small steps add up")
 *   otherwise      → at_avg     ("right on your usual pace")
 *
 *   Boundary policy: the `>=` and `<=` on 1.20 / 0.80 mean exactly-at-1.20
 *   classifies as `above_avg` and exactly-at-0.80 as `below_avg`. Picked
 *   `>=`/`<=` over strict inequalities so the kudos message tips toward the
 *   more-encouraging side at the boundary.
 *
 * Edge cases:
 *   - Empty history list                            → `no_history`, ratio 0, %Δ 0
 *   - Empty this-week AND non-empty history         → `below_avg`, ratio 0, %Δ -100
 *   - Both empty                                    → `no_history`, ratio 0, %Δ 0
 */

export type WeeklyDeltaKind = "no_history" | "above_avg" | "at_avg" | "below_avg";

export interface WeeklyDeltaResult {
  /** Sum of positive amounts in the current week. */
  thisWeekTotal: number;
  /**
   * Per-week average across the prior 4 weeks. Computed as
   * `sum(last4WeeksAmounts) / 4` — the divisor is a fixed 4 (not the number
   * of non-zero entries), so a kid with one big week and three zero weeks
   * gets a fair denominator. If `last4WeeksAmounts` is empty the average is 0
   * and `kind` returns `no_history`.
   */
  rolling4WeekAvg: number;
  /** `thisWeekTotal / rolling4WeekAvg`, or 0 when the average is 0. */
  ratio: number;
  /** Categorized kudos signal — drives which i18n key the UI selects. */
  kind: WeeklyDeltaKind;
  /**
   * Signed integer. `+35` means "35% above your usual"; `-20` means "20% below
   * your usual". Always 0 when `kind === "no_history"`.
   */
  percentDelta: number;
}

const ABOVE_THRESHOLD = 1.2;
const BELOW_THRESHOLD = 0.8;
const HISTORY_WEEKS = 4;

/**
 * Compute the kid's weekly-vs-rolling-avg encouragement signal.
 *
 * @param thisWeekAmounts   Positive yen amounts earned in the current week.
 *                          Non-positive values are filtered out defensively.
 * @param last4WeeksAmounts Flat list of yen earnings across the previous 4
 *                          weeks. Order does not matter — only the sum is
 *                          used. Non-positive values are filtered out.
 */
export function computeWeeklyDelta(
  thisWeekAmounts: readonly number[],
  last4WeeksAmounts: readonly number[],
): WeeklyDeltaResult {
  // Earning-only filter: drop non-positive amounts. NaN/Infinity also skipped
  // (Number.isFinite filters both). This matches the "earnings vs spending"
  // intent — only positive integer earnings count.
  const earningsThis = thisWeekAmounts.filter(
    (a) => Number.isFinite(a) && a > 0,
  );
  const earningsHistory = last4WeeksAmounts.filter(
    (a) => Number.isFinite(a) && a > 0,
  );

  const thisWeekTotal = earningsThis.reduce((sum, a) => sum + a, 0);
  const historyTotal = earningsHistory.reduce((sum, a) => sum + a, 0);

  // No history → can't compute a meaningful comparison. Kudos UI hides.
  if (earningsHistory.length === 0) {
    return {
      thisWeekTotal,
      rolling4WeekAvg: 0,
      ratio: 0,
      kind: "no_history",
      percentDelta: 0,
    };
  }

  // Average uses a fixed 4-week divisor so a kid with a single non-zero
  // historical week still gets a representative baseline (vs. dividing by 1
  // and ballooning the avg).
  const rolling4WeekAvg = historyTotal / HISTORY_WEEKS;

  // Avoid /0 — shouldn't happen given earningsHistory.length > 0 AND filter
  // is `> 0`, but defensive anyway. If avg is somehow 0, treat as below_avg
  // when this-week has anything and at_avg when both are zero.
  if (rolling4WeekAvg === 0) {
    return {
      thisWeekTotal,
      rolling4WeekAvg: 0,
      ratio: 0,
      kind: "no_history",
      percentDelta: 0,
    };
  }

  const ratio = thisWeekTotal / rolling4WeekAvg;
  // Math.round on a signed delta — keeps the UI string honest (no .999%
  // jitter) while preserving the sign.
  const percentDelta = Math.round((ratio - 1) * 100);

  let kind: WeeklyDeltaKind;
  if (ratio >= ABOVE_THRESHOLD) kind = "above_avg";
  else if (ratio <= BELOW_THRESHOLD) kind = "below_avg";
  else kind = "at_avg";

  return {
    thisWeekTotal,
    rolling4WeekAvg,
    ratio,
    kind,
    percentDelta,
  };
}

export const __testing__ = {
  ABOVE_THRESHOLD,
  BELOW_THRESHOLD,
  HISTORY_WEEKS,
};
