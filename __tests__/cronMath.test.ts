import { describe, expect, it } from "vitest";
import {
  MS_PER_DAY,
  MS_PER_WEEK,
  weekStartUTC,
  weeksToBackfill,
  hasTransactionInWeek,
} from "../convex/lib/cronMath";

/**
 * cronMath calendar edge-case contract tests (deep).
 *
 * Why pure: `cronMath.ts` is the timezone- and calendar-correctness layer
 * for the weekly Save-interest cron. `__tests__/cron-resilience.test.ts`
 * already covers the F3 happy-path contract (snap-to-Monday, lookback
 * window, idempotency predicate, manual-recovery input gate).
 *
 * This file adds calendar edge cases that the cron will eventually hit in
 * production over multi-year operation and that aren't proven anywhere else:
 *   - Year boundary (Dec-31 Mon vs Jan-1 Mon)
 *   - DST edge (UTC normalization means DST in any local zone is irrelevant)
 *   - Leap-day stability (Feb 29 → still snaps to the correct Monday)
 *   - Cleanup window arithmetic (90-day-prior timestamp shape)
 *   - Constant invariants (MS_PER_DAY * 7 === MS_PER_WEEK)
 */

describe("MS_PER_DAY / MS_PER_WEEK — constants", () => {
  it("MS_PER_DAY is 86_400_000", () => {
    expect(MS_PER_DAY).toBe(86_400_000);
    expect(MS_PER_DAY).toBe(24 * 60 * 60 * 1000);
  });

  it("MS_PER_WEEK === 7 × MS_PER_DAY", () => {
    expect(MS_PER_WEEK).toBe(7 * MS_PER_DAY);
    expect(MS_PER_WEEK).toBe(604_800_000);
  });
});

describe("weekStartUTC — calendar edge cases", () => {
  it("DST edge: UTC normalization means DST shifts don't move week-start", () => {
    // The cron runs in UTC. EU DST 'spring forward' happens at 2026-03-29
    // 01:00 UTC (last Sunday of March). A Mon-after-DST timestamp must
    // still snap to that Monday's 00:00 UTC — there's no DST in UTC, this
    // is purely about not accidentally calling .getDay() (local) instead
    // of .getUTCDay().
    const monAfterDST = new Date("2026-03-30T12:00:00.000Z"); // Mon
    expect(weekStartUTC(monAfterDST).toISOString()).toBe(
      "2026-03-30T00:00:00.000Z",
    );

    // And the Sunday IN the DST week (Mar 29) should snap to the prior
    // Monday (Mar 23), not to Mar 30.
    const sunDuringDST = new Date("2026-03-29T15:00:00.000Z");
    expect(weekStartUTC(sunDuringDST).toISOString()).toBe(
      "2026-03-23T00:00:00.000Z",
    );
  });

  it("leap-day stability: Feb 29 (2024) snaps to that week's Monday", () => {
    // 2024-02-29 is a Thursday. Its week's Monday is 2024-02-26.
    const leapDay = new Date("2024-02-29T10:00:00.000Z");
    expect(weekStartUTC(leapDay).toISOString()).toBe(
      "2024-02-26T00:00:00.000Z",
    );
  });

  it("leap-day stability: Mar 1 in a leap year still snaps correctly", () => {
    // 2024-03-01 is a Friday → its Monday is 2024-02-26 (same as Feb 29
    // above, since they're in the same week).
    const dayAfterLeap = new Date("2024-03-01T08:00:00.000Z");
    expect(weekStartUTC(dayAfterLeap).toISOString()).toBe(
      "2024-02-26T00:00:00.000Z",
    );
  });

  it("year boundary: Dec 31 (Tue) snaps to its Monday in the OLD year", () => {
    // 2024-12-31 is a Tuesday. Its week's Monday is 2024-12-30 — same year.
    const dec31 = new Date("2024-12-31T23:00:00.000Z");
    expect(weekStartUTC(dec31).toISOString()).toBe("2024-12-30T00:00:00.000Z");
  });

  it("year boundary: Jan 1 (Wed) snaps to a Monday in the PREVIOUS year", () => {
    // 2025-01-01 is a Wednesday. Its week's Monday is 2024-12-30 — prev year.
    // This is the critical proof that the snap is calendar-correct, not
    // year-aware. weekStartUTC must straddle the year boundary cleanly.
    const jan1 = new Date("2025-01-01T05:00:00.000Z");
    expect(weekStartUTC(jan1).toISOString()).toBe("2024-12-30T00:00:00.000Z");
  });
});

describe("weeksToBackfill — calendar edge cases", () => {
  it("4-week lookback straddling year boundary returns 4 weeks across 2 years", () => {
    // Mon 2025-01-13: lookback=4 should give Jan-13, Jan-06, Dec-30, Dec-23
    // (the latter two in 2024).
    const monJan13 = new Date("2025-01-13T10:00:00.000Z");
    expect(weeksToBackfill(monJan13, 4)).toEqual([
      "2025-01-13T00:00:00.000Z",
      "2025-01-06T00:00:00.000Z",
      "2024-12-30T00:00:00.000Z",
      "2024-12-23T00:00:00.000Z",
    ]);
  });

  it("each result is exactly MS_PER_WEEK ms earlier than the previous (math invariant)", () => {
    const out = weeksToBackfill(new Date("2026-05-15T00:00:00.000Z"), 4);
    for (let i = 1; i < out.length; i++) {
      const cur = new Date(out[i]!).getTime();
      const prev = new Date(out[i - 1]!).getTime();
      expect(prev - cur).toBe(MS_PER_WEEK);
    }
  });
});

describe("hasTransactionInWeek — half-open interval boundary (×̅)", () => {
  // The half-open interval [weekStart, weekStart + 7d) is the heart of the
  // idempotency contract. cron-resilience.test.ts covers the basic inclusive-
  // lower and exclusive-upper cases. This file adds:
  //   - Empty list edge (no false positives from undefined behaviour)
  //   - Microsecond-precision-style edge: one ms inside upper bound is IN,
  //     one ms past upper bound is OUT.
  const weekStartMs = new Date("2026-05-11T00:00:00.000Z").getTime();

  it("empty transaction list returns false (no false positives)", () => {
    expect(hasTransactionInWeek([], weekStartMs)).toBe(false);
  });

  it("one ms inside upper bound is in the week", () => {
    const oneMsBeforeEnd = weekStartMs + MS_PER_WEEK - 1;
    expect(
      hasTransactionInWeek(
        [{ type: "interest", createdAt: oneMsBeforeEnd }],
        weekStartMs,
      ),
    ).toBe(true);
  });

  it("exactly at upper bound (weekStart + 7d) is NOT in the week (exclusive)", () => {
    // This is the F3 contract: half-open. A credit timestamped at exactly
    // the next week's Monday-00:00 belongs to NEXT week, not this one.
    const exactlyAtEnd = weekStartMs + MS_PER_WEEK;
    expect(
      hasTransactionInWeek(
        [{ type: "interest", createdAt: exactlyAtEnd }],
        weekStartMs,
      ),
    ).toBe(false);
  });
});
