/**
 * Pure cron resilience helpers — NO Convex imports, NO `ctx`.
 *
 * These helpers exist so the weekly Save-interest cron can recover from
 * outages (vacation, paused deploys, billing lapses) WITHOUT double-crediting.
 * Pure-and-testable so the contract is provable in Vitest.
 *
 * Conventions:
 *   - "Week start" = Monday 00:00:00.000 UTC. The cron fires Monday 10:00 UTC,
 *     so a week-start that's <= "now" is always a candidate to be credited.
 *   - All timestamps are JS millisecond epochs (Date.now() / Date.getTime()).
 *   - "Half-open week range" = [weekStart, weekStart + 7 days).
 *
 * NOTE: the production interest handler currently uses a JST week-start
 * (Mon 00:00 JST) for idempotency. That predates F3. cronMath standardizes
 * on UTC Monday — see `weeksToBackfill` rationale below. The behaviour is
 * unchanged from a user POV (same cron fires Mon 10 UTC, same once-per-week
 * cadence), but the backfill window is now well-defined in a single timezone.
 */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MS_PER_WEEK = 7 * MS_PER_DAY;

/**
 * Snap an instant to the Monday-00:00 UTC week-start that contains it.
 *
 * Examples:
 *   2026-05-15T12:34:56Z (Friday) → 2026-05-11T00:00:00.000Z (Monday)
 *   2026-05-11T00:00:00Z (Monday 00:00) → 2026-05-11T00:00:00.000Z
 *   2026-05-10T23:59:59Z (Sunday night) → 2026-05-04T00:00:00.000Z (prev Mon)
 *
 * JS `getUTCDay()` returns 0=Sun..6=Sat. We want 0=Mon..6=Sun for arithmetic,
 * so we re-key: `(day + 6) % 7`.
 */
export function weekStartUTC(at: Date | number): Date {
  const ms = typeof at === "number" ? at : at.getTime();
  const d = new Date(ms);
  const dayMonIndexed = (d.getUTCDay() + 6) % 7; // 0=Mon..6=Sun
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  monday.setUTCDate(monday.getUTCDate() - dayMonIndexed);
  return monday;
}

/**
 * Return the array of week-start ISO strings (most-recent-first) that the
 * Save-interest cron should attempt to credit when it fires at `now`.
 *
 * Contract:
 *   - Result[0] is always the current week's Monday 00:00 UTC.
 *   - Result has length `lookback` (default 4 = current + 3 missed).
 *   - Each entry is exactly 7 days earlier than the previous.
 *
 * Why lookback=4 (NOT 8, NOT unbounded):
 *   - The interest contract is "this week's balance × 10%/52". Beyond ~1 month
 *     of outage, the right move is human intervention (call the manual
 *     recovery mutation `wallets.runInterestForWeek` per affected week),
 *     not silent retroactive credit. 4 weeks gives a comfortable vacation /
 *     billing-lapse buffer without unbounded blast radius if a bug ever
 *     causes the predicate to misfire.
 *   - Bounded lookback also bounds DB-scan cost: each run touches at most
 *     `4 × wallets × transactionsPerWallet` rows.
 */
export function weeksToBackfill(
  now: Date | number,
  lookback: number = 4
): string[] {
  if (!Number.isInteger(lookback) || lookback < 1) {
    throw new Error(
      `weeksToBackfill: lookback must be a positive integer, got ${lookback}`
    );
  }
  const start = weekStartUTC(now);
  const out: string[] = [];
  for (let i = 0; i < lookback; i++) {
    const d = new Date(start.getTime() - i * MS_PER_WEEK);
    out.push(d.toISOString());
  }
  return out;
}

/**
 * Minimal shape that the `hasTransactionInWeek` predicate needs from a
 * Convex transaction document. Kept structural so the helper is trivially
 * usable from tests without importing `Doc<"transactions">`.
 */
export interface TxLike {
  type: string;
  createdAt: number;
}

/**
 * Return `true` iff `transactions` contains at least one row whose
 * `type === "interest"` AND whose `createdAt` falls in the half-open range
 * `[weekStartMs, weekStartMs + 7 days)`.
 *
 * This is the EXACT idempotency check the refactored cron uses to decide
 * "credit needed for this (wallet, week)?". Extracted so it's testable
 * without Convex.
 *
 * Returning `true` means "skip — already credited". The handler must invert
 * to decide whether to credit.
 */
export function hasTransactionInWeek(
  transactions: ReadonlyArray<TxLike>,
  weekStart: Date | number,
  type: string = "interest"
): boolean {
  const start = typeof weekStart === "number" ? weekStart : weekStart.getTime();
  const end = start + MS_PER_WEEK;
  for (const tx of transactions) {
    if (tx.type !== type) continue;
    if (tx.createdAt >= start && tx.createdAt < end) return true;
  }
  return false;
}

/**
 * Validate that a candidate `weekStartISO` is a Monday-00:00 UTC instant.
 * Throws otherwise. Used by the public `runInterestForWeek` mutation to
 * reject malformed input from the dashboard.
 */
export function assertIsWeekStartISO(iso: string): Date {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`assertIsWeekStartISO: not a valid ISO date: ${iso}`);
  }
  const snapped = weekStartUTC(d);
  if (snapped.getTime() !== d.getTime()) {
    throw new Error(
      `assertIsWeekStartISO: ${iso} is not a Monday 00:00 UTC week-start (expected ${snapped.toISOString()})`
    );
  }
  return d;
}
