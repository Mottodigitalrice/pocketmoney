import { describe, expect, it } from "vitest";
import {
  MS_PER_DAY,
  MS_PER_WEEK,
  assertIsWeekStartISO,
  hasTransactionInWeek,
  weekStartUTC,
  weeksToBackfill,
  type TxLike,
} from "../convex/lib/cronMath";

/**
 * F3 cron resilience contract tests.
 *
 * The pure helpers MUST be correct in isolation, because the Convex
 * cron handler delegates idempotency to them. If these tests pass,
 * the cron cannot double-credit interest by construction.
 */

// Canonical reference week: 2026-05-11 Monday 00:00 UTC.
// Picked because 2026 is the current year per CLAUDE.md and 2026-05-11
// is unambiguously a Monday.
const REF_MONDAY = new Date("2026-05-11T00:00:00.000Z");
const REF_MONDAY_MS = REF_MONDAY.getTime();

describe("weekStartUTC — snap to Monday 00:00 UTC", () => {
  it("Monday morning stays put", () => {
    expect(weekStartUTC(REF_MONDAY).toISOString()).toBe(
      "2026-05-11T00:00:00.000Z"
    );
  });

  it("Monday afternoon snaps back to 00:00", () => {
    expect(weekStartUTC(new Date("2026-05-11T14:30:00.000Z")).toISOString()).toBe(
      "2026-05-11T00:00:00.000Z"
    );
  });

  it("mid-week (Wednesday) snaps to the same week's Monday", () => {
    expect(weekStartUTC(new Date("2026-05-13T08:00:00.000Z")).toISOString()).toBe(
      "2026-05-11T00:00:00.000Z"
    );
  });

  it("Friday snaps to the same week's Monday", () => {
    expect(weekStartUTC(new Date("2026-05-15T23:59:59.999Z")).toISOString()).toBe(
      "2026-05-11T00:00:00.000Z"
    );
  });

  it("Sunday 23:59 snaps to the SAME week's Monday (not the next)", () => {
    expect(weekStartUTC(new Date("2026-05-17T23:59:00.000Z")).toISOString()).toBe(
      "2026-05-11T00:00:00.000Z"
    );
  });

  it("Sunday 00:01 still in this week's Monday", () => {
    expect(weekStartUTC(new Date("2026-05-17T00:01:00.000Z")).toISOString()).toBe(
      "2026-05-11T00:00:00.000Z"
    );
  });

  it("the Monday AFTER snaps to itself", () => {
    expect(weekStartUTC(new Date("2026-05-18T00:00:00.000Z")).toISOString()).toBe(
      "2026-05-18T00:00:00.000Z"
    );
  });

  it("accepts millisecond epoch as input", () => {
    expect(weekStartUTC(REF_MONDAY_MS).toISOString()).toBe(
      "2026-05-11T00:00:00.000Z"
    );
  });
});

describe("weeksToBackfill — lookback window", () => {
  it("default lookback returns exactly 4 weeks, most-recent-first", () => {
    const result = weeksToBackfill(REF_MONDAY);
    expect(result).toHaveLength(4);
    expect(result[0]).toBe("2026-05-11T00:00:00.000Z");
    expect(result[1]).toBe("2026-05-04T00:00:00.000Z");
    expect(result[2]).toBe("2026-04-27T00:00:00.000Z");
    expect(result[3]).toBe("2026-04-20T00:00:00.000Z");
  });

  it("lookback=1 returns ONLY the current week", () => {
    expect(weeksToBackfill(REF_MONDAY, 1)).toEqual([
      "2026-05-11T00:00:00.000Z",
    ]);
  });

  it("lookback=2 returns current + 1 prior", () => {
    expect(weeksToBackfill(REF_MONDAY, 2)).toEqual([
      "2026-05-11T00:00:00.000Z",
      "2026-05-04T00:00:00.000Z",
    ]);
  });

  it("lookback=3 returns current + 2 prior", () => {
    expect(weeksToBackfill(REF_MONDAY, 3)).toEqual([
      "2026-05-11T00:00:00.000Z",
      "2026-05-04T00:00:00.000Z",
      "2026-04-27T00:00:00.000Z",
    ]);
  });

  it("lookback=4 returns current + 3 prior (the F3 contract)", () => {
    expect(weeksToBackfill(REF_MONDAY, 4)).toEqual([
      "2026-05-11T00:00:00.000Z",
      "2026-05-04T00:00:00.000Z",
      "2026-04-27T00:00:00.000Z",
      "2026-04-20T00:00:00.000Z",
    ]);
  });

  it("each result is exactly 7 days earlier than the previous", () => {
    const result = weeksToBackfill(REF_MONDAY, 4);
    for (let i = 1; i < result.length; i++) {
      const prev = new Date(result[i - 1]).getTime();
      const cur = new Date(result[i]).getTime();
      expect(prev - cur).toBe(MS_PER_WEEK);
    }
  });

  it("mid-week 'now' still produces correct week-starts", () => {
    // Wednesday 2026-05-13 — current week is still Mon 2026-05-11.
    expect(weeksToBackfill(new Date("2026-05-13T08:00:00.000Z"), 4)).toEqual([
      "2026-05-11T00:00:00.000Z",
      "2026-05-04T00:00:00.000Z",
      "2026-04-27T00:00:00.000Z",
      "2026-04-20T00:00:00.000Z",
    ]);
  });

  it("Sunday-night 'now' still produces SAME week-starts (not next week)", () => {
    expect(weeksToBackfill(new Date("2026-05-17T23:59:00.000Z"), 4)).toEqual([
      "2026-05-11T00:00:00.000Z",
      "2026-05-04T00:00:00.000Z",
      "2026-04-27T00:00:00.000Z",
      "2026-04-20T00:00:00.000Z",
    ]);
  });

  it("crossing a month boundary works (Apr → May)", () => {
    // 2026-04-29 Wednesday → current week is Mon 2026-04-27.
    expect(weeksToBackfill(new Date("2026-04-29T00:00:00.000Z"), 4)).toEqual([
      "2026-04-27T00:00:00.000Z",
      "2026-04-20T00:00:00.000Z",
      "2026-04-13T00:00:00.000Z",
      "2026-04-06T00:00:00.000Z",
    ]);
  });

  it("rejects lookback=0 / negative / non-integer", () => {
    expect(() => weeksToBackfill(REF_MONDAY, 0)).toThrow(/positive integer/);
    expect(() => weeksToBackfill(REF_MONDAY, -1)).toThrow(/positive integer/);
    expect(() => weeksToBackfill(REF_MONDAY, 1.5)).toThrow(/positive integer/);
  });
});

describe("hasTransactionInWeek — idempotency predicate", () => {
  const weekStartMs = REF_MONDAY_MS;
  const weekEndMs = weekStartMs + MS_PER_WEEK;

  const interestAtWeekStart: TxLike = {
    type: "interest",
    createdAt: weekStartMs,
  };
  const interestMidWeek: TxLike = {
    type: "interest",
    createdAt: weekStartMs + 3 * MS_PER_DAY,
  };
  const interestSecondBeforeEnd: TxLike = {
    type: "interest",
    createdAt: weekEndMs - 1,
  };
  const interestAtWeekEnd: TxLike = {
    type: "interest",
    createdAt: weekEndMs, // EXCLUSIVE upper bound — should not match
  };
  const interestPrevWeek: TxLike = {
    type: "interest",
    createdAt: weekStartMs - 1,
  };
  const earningMidWeek: TxLike = {
    type: "earning",
    createdAt: weekStartMs + 3 * MS_PER_DAY,
  };

  it("returns false for empty transaction list", () => {
    expect(hasTransactionInWeek([], weekStartMs)).toBe(false);
  });

  it("returns true when an interest tx sits exactly at weekStart (inclusive lower bound)", () => {
    expect(hasTransactionInWeek([interestAtWeekStart], weekStartMs)).toBe(true);
  });

  it("returns true when an interest tx sits mid-week", () => {
    expect(hasTransactionInWeek([interestMidWeek], weekStartMs)).toBe(true);
  });

  it("returns true when an interest tx sits one ms before week-end", () => {
    expect(hasTransactionInWeek([interestSecondBeforeEnd], weekStartMs)).toBe(
      true
    );
  });

  it("returns FALSE when an interest tx sits exactly at weekStart+7d (exclusive upper bound)", () => {
    // This is the critical edge case for the half-open range.
    expect(hasTransactionInWeek([interestAtWeekEnd], weekStartMs)).toBe(false);
  });

  it("returns FALSE when only previous week has an interest tx", () => {
    expect(hasTransactionInWeek([interestPrevWeek], weekStartMs)).toBe(false);
  });

  it("ignores transactions of a different type (e.g. 'earning' mid-week)", () => {
    expect(hasTransactionInWeek([earningMidWeek], weekStartMs)).toBe(false);
  });

  it("accepts mixed list, returns true if ANY interest tx is in range", () => {
    expect(
      hasTransactionInWeek(
        [earningMidWeek, interestPrevWeek, interestMidWeek],
        weekStartMs
      )
    ).toBe(true);
  });

  it("accepts mixed list, returns false if NO interest tx is in range", () => {
    expect(
      hasTransactionInWeek(
        [earningMidWeek, interestPrevWeek, interestAtWeekEnd],
        weekStartMs
      )
    ).toBe(false);
  });

  it("custom type parameter works (e.g. 'bonus')", () => {
    const bonusMidWeek: TxLike = {
      type: "bonus",
      createdAt: weekStartMs + MS_PER_DAY,
    };
    expect(hasTransactionInWeek([bonusMidWeek], weekStartMs, "bonus")).toBe(
      true
    );
    expect(hasTransactionInWeek([bonusMidWeek], weekStartMs, "interest")).toBe(
      false
    );
  });

  it("accepts Date object as weekStart", () => {
    expect(hasTransactionInWeek([interestMidWeek], REF_MONDAY)).toBe(true);
  });
});

describe("idempotency proof — re-running the predicate after a credit is a no-op", () => {
  /**
   * This test simulates the EXACT pattern the cron handler uses:
   *
   *   1. Run #1: handler sees no interest tx in week → would credit, appends
   *      a new TxLike{ type: "interest", createdAt: weekStartMs } to the
   *      transaction list (simulating the DB insert).
   *   2. Run #2 (same day, same cron retry, or manual recovery call): handler
   *      sees the freshly-inserted interest tx → predicate returns true →
   *      handler MUST skip.
   *
   * If the predicate misbehaves, this is where double-crediting would show
   * up. The test is the green-bar contract for "won't double-credit".
   */
  it("first run credits, second run finds the credit and skips", () => {
    const weekStartMs = REF_MONDAY_MS;
    const transactions: TxLike[] = []; // empty DB to start

    // Run #1 — predicate says "not credited" → credit would proceed.
    expect(hasTransactionInWeek(transactions, weekStartMs)).toBe(false);
    // Simulate the credit insert that the handler would do:
    transactions.push({ type: "interest", createdAt: weekStartMs });

    // Run #2 — predicate now finds the credit, returns true → handler skips.
    expect(hasTransactionInWeek(transactions, weekStartMs)).toBe(true);

    // Run #3 — same answer, no matter how many times we re-run.
    expect(hasTransactionInWeek(transactions, weekStartMs)).toBe(true);
  });

  it("a credit for week N does not block crediting week N+1 or week N-1", () => {
    const weekN = REF_MONDAY_MS;
    const weekNplus1 = weekN + MS_PER_WEEK;
    const weekNminus1 = weekN - MS_PER_WEEK;

    const transactions: TxLike[] = [
      { type: "interest", createdAt: weekN + MS_PER_DAY }, // credited week N
    ];

    expect(hasTransactionInWeek(transactions, weekN)).toBe(true);
    expect(hasTransactionInWeek(transactions, weekNplus1)).toBe(false);
    expect(hasTransactionInWeek(transactions, weekNminus1)).toBe(false);
  });

  it("4-week backfill scenario: 3 missed weeks, then cron fires — each missed week credited exactly once", () => {
    const weeks = weeksToBackfill(REF_MONDAY, 4).map((iso) =>
      new Date(iso).getTime()
    );
    // Start with NO interest transactions (3 weeks of outage + current).
    const transactions: TxLike[] = [];

    // Simulate the handler: for each week-start (most-recent first), credit
    // if no interest tx exists in that week's range.
    let credits = 0;
    for (const ws of weeks) {
      if (!hasTransactionInWeek(transactions, ws)) {
        transactions.push({ type: "interest", createdAt: ws });
        credits += 1;
      }
    }
    expect(credits).toBe(4);
    expect(transactions).toHaveLength(4);

    // Re-run the SAME loop — must produce zero new credits (idempotency).
    let creditsOnRerun = 0;
    for (const ws of weeks) {
      if (!hasTransactionInWeek(transactions, ws)) {
        transactions.push({ type: "interest", createdAt: ws });
        creditsOnRerun += 1;
      }
    }
    expect(creditsOnRerun).toBe(0);
    expect(transactions).toHaveLength(4);
  });

  it("partial backfill scenario: only 2 weeks missed → exactly 2 credits", () => {
    const weeks = weeksToBackfill(REF_MONDAY, 4).map((iso) =>
      new Date(iso).getTime()
    );
    // Two oldest weeks were already credited at the time the outage started.
    const transactions: TxLike[] = [
      { type: "interest", createdAt: weeks[2] }, // 2 weeks ago
      { type: "interest", createdAt: weeks[3] }, // 3 weeks ago
    ];

    let credits = 0;
    for (const ws of weeks) {
      if (!hasTransactionInWeek(transactions, ws)) {
        transactions.push({ type: "interest", createdAt: ws });
        credits += 1;
      }
    }
    expect(credits).toBe(2); // only the 2 missed weeks
    expect(transactions).toHaveLength(4);
  });
});

describe("assertIsWeekStartISO — manual recovery input gate", () => {
  it("accepts a valid Monday 00:00 UTC ISO string", () => {
    expect(assertIsWeekStartISO("2026-05-11T00:00:00.000Z").toISOString()).toBe(
      "2026-05-11T00:00:00.000Z"
    );
  });

  it("rejects a Wednesday", () => {
    expect(() => assertIsWeekStartISO("2026-05-13T00:00:00.000Z")).toThrow(
      /not a Monday 00:00 UTC/
    );
  });

  it("rejects a Monday with a non-zero time component", () => {
    expect(() => assertIsWeekStartISO("2026-05-11T10:00:00.000Z")).toThrow(
      /not a Monday 00:00 UTC/
    );
  });

  it("rejects garbage input", () => {
    expect(() => assertIsWeekStartISO("not-a-date")).toThrow(/not a valid ISO/);
  });

  it("error message includes the expected snapped value (helps the parent)", () => {
    expect(() => assertIsWeekStartISO("2026-05-13T00:00:00.000Z")).toThrow(
      /2026-05-11T00:00:00\.000Z/
    );
  });
});
