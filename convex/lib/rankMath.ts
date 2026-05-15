/**
 * Pure rank math — NO Convex imports, NO React.
 *
 * Ported unchanged from `src/components/providers/PocketMoneyProvider.tsx`
 * (the `rankThresholds` table + `getRankForChild` body). The provider now
 * imports from this lib instead of inlining the math.
 *
 * Tier model:
 *   - score = floor(lifetimeEarnings * rankMultiplier)
 *   - rankMultiplier defaults to 1.0 (oldest sibling). A multiplier of 2.0
 *     means the kid reaches the same tier with half the yen — used to keep
 *     younger siblings motivated.
 *
 * Tier thresholds (yen-equivalent score):
 *   Noob    0
 *   Normal  500
 *   Pro     2000
 *   Master  5000
 *   Hacker  10000  (top tier — no next)
 */

export type PirateRank = "Noob" | "Normal" | "Pro" | "Master" | "Hacker";

interface Threshold {
  rank: PirateRank;
  score: number;
}

export const RANK_THRESHOLDS: readonly Threshold[] = [
  { rank: "Noob", score: 0 },
  { rank: "Normal", score: 500 },
  { rank: "Pro", score: 2000 },
  { rank: "Master", score: 5000 },
  { rank: "Hacker", score: 10000 },
] as const;

export interface RankCalculation {
  /** Current tier the child is in. */
  tier: PirateRank;
  /** Score required to reach the next tier, or `null` if at top tier. */
  nextTierAt: number | null;
  /** Integer 0–100. % progress through the current tier. 100 if at top tier. */
  progressToNext: number;
  /** Pass-through score after multiplier applied (floor'd). */
  score: number;
  /** Next tier name, or null at top. */
  nextRank: PirateRank | null;
  /** Multiplier echoed back for convenience. */
  multiplier: number;
}

/**
 * Compute the child's rank tier given lifetime earnings and their age-based
 * multiplier.
 *
 * Behaviour ported unchanged from the provider — DO NOT "fix" rounding here
 * without a separate frame; downstream UI assumes integer progress %.
 */
export function calculateRank(
  lifetimeEarnings: number,
  rankMultiplier: number
): RankCalculation {
  // Defensive: provider had `child?.rankMultiplier ?? 1` — preserve that default
  // here too, plus guard against NaN/null leaking in.
  const multiplier =
    Number.isFinite(rankMultiplier) && rankMultiplier > 0 ? rankMultiplier : 1;
  const lifetime = Number.isFinite(lifetimeEarnings) ? Math.max(0, lifetimeEarnings) : 0;

  const score = Math.floor(lifetime * multiplier);

  const currentIndex = RANK_THRESHOLDS.reduce(
    (bestIndex, threshold, index) => (score >= threshold.score ? index : bestIndex),
    0
  );
  // safe: currentIndex always points to a valid entry since RANK_THRESHOLDS
  // has at least one element and the reduce starts at index 0.
  const current = RANK_THRESHOLDS[currentIndex]!;
  const next = RANK_THRESHOLDS[currentIndex + 1];
  const previousScore = current.score;
  const nextScore = next?.score;

  const progressToNext = nextScore
    ? Math.min(
        100,
        Math.round(((score - previousScore) / (nextScore - previousScore)) * 100)
      )
    : 100;

  return {
    tier: current.rank,
    nextTierAt: nextScore ?? null,
    progressToNext,
    score,
    nextRank: next?.rank ?? null,
    multiplier,
  };
}
