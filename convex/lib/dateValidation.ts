/**
 * Pure ISO date string validation — NO Convex imports, NO `ctx`.
 *
 * Wave 3a MED-4: extracted so `scheduledJobs.create / createBatch /
 * quickAddForToday` (and any other future callsite that takes a date string
 * from the client) can validate against a single, tested predicate.
 *
 * Contract:
 *   - Accepts `YYYY-MM-DD` (exact length 10, hyphens at positions 4 and 7).
 *   - Rejects malformed shape, non-numeric digits, impossible dates
 *     (e.g. 2026-02-30), and non-string inputs.
 *   - Validated via `new Date(...)` parse + round-trip equality so the JS
 *     date layer's automatic rollover (Feb 30 → Mar 2) cannot sneak past.
 *   - Leap years handled by the round-trip check (2024-02-29 ✅, 2025-02-29 ✗).
 *
 * Why a `lib/` helper and not a Convex `v.*` validator: Convex's v.string()
 * accepts any string. Validating ISO format requires a runtime regex + parse,
 * which has to live in the handler body. Centralizing here keeps the
 * validation rule consistent across all 3 callsites and unit-testable.
 *
 * Error code: throws `INVALID_DATE_FORMAT: <label>` so the client mapper can
 * branch on the prefix if it ever cares to render a bilingual message.
 * Bilingual surface is intentionally not localized here — the backend stays
 * locale-agnostic and the client renders via `mapConvexError`.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Assert that `input` is a valid `YYYY-MM-DD` ISO date string. Throws a
 * `Error("INVALID_DATE_FORMAT: <label>")` otherwise.
 *
 * Returns nothing — the TypeScript `asserts` predicate narrows the call-site
 * type so subsequent uses of `input` are typed as `string` without further
 * checks.
 *
 * @param input The candidate date string. Often `args.date` straight off
 *   the mutation argument.
 * @param label Human-readable label used in the thrown error message —
 *   e.g. `"date"` or `"entry.date[3]"`. Defaults to `"date"`.
 */
export function assertIsoDate(
  input: unknown,
  label: string = "date",
): asserts input is string {
  if (typeof input !== "string") {
    throw new Error(`INVALID_DATE_FORMAT: ${label}`);
  }
  if (!ISO_DATE_RE.test(input)) {
    throw new Error(`INVALID_DATE_FORMAT: ${label}`);
  }

  // Parse as UTC midnight so timezone offsets cannot perturb the round-trip.
  // `new Date("2026-02-30")` parses to 2026-03-02; the toISOString round-trip
  // would yield "2026-03-02", which differs from the input → we reject.
  const parsed = new Date(`${input}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`INVALID_DATE_FORMAT: ${label}`);
  }

  // Reconstruct the YYYY-MM-DD prefix from the parsed Date and compare.
  // Catches all non-existent calendar dates including non-leap Feb 29.
  const roundTrip = parsed.toISOString().slice(0, 10);
  if (roundTrip !== input) {
    throw new Error(`INVALID_DATE_FORMAT: ${label}`);
  }
}

/**
 * Non-throwing variant for callers that prefer a boolean. Mostly useful in
 * tests; production code should prefer `assertIsoDate` for its assertion
 * narrowing.
 */
export function isIsoDate(input: unknown): input is string {
  try {
    assertIsoDate(input);
    return true;
  } catch {
    return false;
  }
}

const MS_PER_DAY = 86_400_000;

/**
 * Assert that `input` is a canonical Monday-started ISO week: exactly 7
 * strictly-consecutive `YYYY-MM-DD` dates, where the first date is a Monday.
 *
 * ## Why this exists (SEC-2026-07-18)
 *
 * `luckyChests.open` / `getStatusForFamily` used `weekDates[0]` as the
 * `by_child_week` single-open key while validating only `weekDates.length ===
 * 7`. Because the whole array was attacker-controlled, a client could rotate /
 * permute / pad the 7 dates so `weekDates[0]` differed on every call, minting
 * a fresh Lucky Chest bonus each time (the once-per-week guard is keyed on that
 * value). Requiring a canonical Monday-started, strictly-consecutive week
 * collapses every real week to exactly ONE valid `weekDates[0]`, so the guard
 * holds: any rotation makes day 0 a non-Monday, and any padding breaks
 * consecutiveness — both rejected here.
 *
 * The Monday check reads the day-of-week of the calendar date itself (parsed at
 * UTC midnight), so it is timezone-agnostic: "2026-05-11" is a Monday in every
 * timezone. This matches the client's `getWeekDates()` contract, which always
 * emits the local Monday's date first, followed by Tue…Sun.
 *
 * Throws `INVALID_WEEK: <label>` (with a specific suffix) on any violation.
 */
export function assertMondayStartedWeek(
  input: unknown,
  label: string = "weekDates",
): asserts input is string[] {
  if (!Array.isArray(input) || input.length !== 7) {
    throw new Error(`INVALID_WEEK: ${label} must be 7 dates`);
  }

  const times: number[] = [];
  for (let i = 0; i < 7; i++) {
    // Reuse the ISO/impossible-date guard (rejects 2026-02-30, non-leap 2/29…).
    assertIsoDate(input[i], `${label}[${i}]`);
    times.push(new Date(`${input[i]}T00:00:00.000Z`).getTime());
  }

  // Day 0 must be a Monday (UTC day-of-week 1) — kills any rotation/permutation.
  if (new Date(times[0]!).getUTCDay() !== 1) {
    throw new Error(`INVALID_WEEK: ${label} must start on Monday`);
  }

  // Strictly consecutive calendar days — kills any padding/gaps/duplicates.
  for (let i = 1; i < 7; i++) {
    if (times[i]! - times[i - 1]! !== MS_PER_DAY) {
      throw new Error(`INVALID_WEEK: ${label} must be 7 consecutive days`);
    }
  }
}
