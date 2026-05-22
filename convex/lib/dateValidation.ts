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
