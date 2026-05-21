import { describe, expect, it } from "vitest";
import {
  materializeRecurrence,
  materializeRecurrenceFromMonIndexed,
  recurrenceMatchesDateMonIndexed,
  type RecurrenceRule,
} from "../convex/lib/recurrence";

/**
 * Recurrence materialization tests.
 *
 * Anchor week: 2026-05-11 is a Monday (verified by Date.UTC).
 *   Mon 2026-05-11
 *   Tue 2026-05-12
 *   Wed 2026-05-13
 *   Thu 2026-05-14
 *   Fri 2026-05-15
 *   Sat 2026-05-16
 *   Sun 2026-05-17
 */

const MONDAY_WEEK_START = "2026-05-11";
const MON = "2026-05-11";
const TUE = "2026-05-12";
const WED = "2026-05-13";
const THU = "2026-05-14";
const FRI = "2026-05-15";
const SAT = "2026-05-16";
const SUN = "2026-05-17";

const FULL_WEEK = [MON, TUE, WED, THU, FRI, SAT, SUN];

describe("anchor week sanity check", () => {
  it("2026-05-11 is a Monday in UTC", () => {
    const d = new Date(Date.UTC(2026, 4, 11));
    expect(d.getUTCDay()).toBe(1); // 1 = Monday
  });
  it("2026-05-17 is a Sunday in UTC", () => {
    const d = new Date(Date.UTC(2026, 4, 17));
    expect(d.getUTCDay()).toBe(0); // 0 = Sunday
  });
});

describe("materializeRecurrence — type=none", () => {
  it("returns [] for none", () => {
    const rule: RecurrenceRule = { type: "none" };
    expect(materializeRecurrence(rule, MONDAY_WEEK_START)).toEqual([]);
  });

  it("returns [] for none even with daysOfWeek set", () => {
    const rule: RecurrenceRule = { type: "none", daysOfWeek: [0, 1, 2] };
    expect(materializeRecurrence(rule, MONDAY_WEEK_START)).toEqual([]);
  });
});

describe("materializeRecurrence — type=daily", () => {
  it("returns all 7 dates", () => {
    const rule: RecurrenceRule = { type: "daily" };
    expect(materializeRecurrence(rule, MONDAY_WEEK_START)).toEqual(FULL_WEEK);
  });

  it("each result is YYYY-MM-DD format", () => {
    const rule: RecurrenceRule = { type: "daily" };
    const out = materializeRecurrence(rule, MONDAY_WEEK_START);
    for (const date of out) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("materializeRecurrence — type=weekdays", () => {
  it("returns 5 dates (Mon–Fri)", () => {
    const rule: RecurrenceRule = { type: "weekdays" };
    expect(materializeRecurrence(rule, MONDAY_WEEK_START)).toEqual([
      MON,
      TUE,
      WED,
      THU,
      FRI,
    ]);
  });

  it("works when week starts on a Sunday too", () => {
    // Week starting Sun 2026-05-10
    const rule: RecurrenceRule = { type: "weekdays" };
    const out = materializeRecurrence(rule, "2026-05-10");
    // Sun May 10, Mon 11, Tue 12, Wed 13, Thu 14, Fri 15, Sat 16
    // Mon-Fri = May 11-15
    expect(out).toEqual([MON, TUE, WED, THU, FRI]);
  });
});

describe("materializeRecurrence — type=specificDays (Sunday-indexed)", () => {
  it("specificDays: [0] (Sunday) → 1 date", () => {
    const rule: RecurrenceRule = { type: "specificDays", daysOfWeek: [0] };
    expect(materializeRecurrence(rule, MONDAY_WEEK_START)).toEqual([SUN]);
  });

  it("specificDays: [1,3,5] (Mon/Wed/Fri) → 3 dates", () => {
    const rule: RecurrenceRule = {
      type: "specificDays",
      daysOfWeek: [1, 3, 5],
    };
    expect(materializeRecurrence(rule, MONDAY_WEEK_START)).toEqual([
      MON,
      WED,
      FRI,
    ]);
  });

  it("specificDays: [0,6] (weekend: Sun + Sat) → 2 dates", () => {
    const rule: RecurrenceRule = { type: "specificDays", daysOfWeek: [0, 6] };
    // Sat=6, Sun=0 — in chronological order in our Mon-start week: SAT then SUN
    expect(materializeRecurrence(rule, MONDAY_WEEK_START)).toEqual([SAT, SUN]);
  });

  it("specificDays: [] → []", () => {
    const rule: RecurrenceRule = { type: "specificDays", daysOfWeek: [] };
    expect(materializeRecurrence(rule, MONDAY_WEEK_START)).toEqual([]);
  });

  it("specificDays with no daysOfWeek field → []", () => {
    const rule: RecurrenceRule = { type: "specificDays" };
    expect(materializeRecurrence(rule, MONDAY_WEEK_START)).toEqual([]);
  });

  it("specificDays: [0,1,2,3,4,5,6] → all 7 (same as daily)", () => {
    const rule: RecurrenceRule = {
      type: "specificDays",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    };
    expect(materializeRecurrence(rule, MONDAY_WEEK_START)).toEqual(FULL_WEEK);
  });
});

describe("materializeRecurrenceFromMonIndexed (legacy schema, 0=Mon..6=Sun)", () => {
  it("type=none → []", () => {
    expect(
      materializeRecurrenceFromMonIndexed({ type: "none" }, FULL_WEEK),
    ).toEqual([]);
  });

  it("type=daily → all 7", () => {
    expect(
      materializeRecurrenceFromMonIndexed({ type: "daily" }, FULL_WEEK),
    ).toEqual(FULL_WEEK);
  });

  it("type=weekdays → Mon–Fri", () => {
    expect(
      materializeRecurrenceFromMonIndexed({ type: "weekdays" }, FULL_WEEK),
    ).toEqual([MON, TUE, WED, THU, FRI]);
  });

  it("specificDays [0] (Mon-indexed = Monday) → MON only", () => {
    expect(
      materializeRecurrenceFromMonIndexed(
        { type: "specificDays", daysOfWeek: [0] },
        FULL_WEEK,
      ),
    ).toEqual([MON]);
  });

  it("specificDays [6] (Mon-indexed = Sunday) → SUN only", () => {
    expect(
      materializeRecurrenceFromMonIndexed(
        { type: "specificDays", daysOfWeek: [6] },
        FULL_WEEK,
      ),
    ).toEqual([SUN]);
  });

  it("null rule → []", () => {
    expect(materializeRecurrenceFromMonIndexed(null, FULL_WEEK)).toEqual([]);
  });

  it("undefined rule → []", () => {
    expect(materializeRecurrenceFromMonIndexed(undefined, FULL_WEEK)).toEqual(
      [],
    );
  });
});

describe("recurrenceMatchesDateMonIndexed (legacy predicate)", () => {
  it("none → false for any date", () => {
    expect(recurrenceMatchesDateMonIndexed({ type: "none" }, MON)).toBe(false);
    expect(recurrenceMatchesDateMonIndexed(undefined, MON)).toBe(false);
    expect(recurrenceMatchesDateMonIndexed(null, MON)).toBe(false);
  });

  it("daily → true for any date", () => {
    for (const date of FULL_WEEK) {
      expect(recurrenceMatchesDateMonIndexed({ type: "daily" }, date)).toBe(
        true,
      );
    }
  });

  it("weekdays → true Mon–Fri, false Sat/Sun", () => {
    const rule = { type: "weekdays" as const };
    expect(recurrenceMatchesDateMonIndexed(rule, MON)).toBe(true);
    expect(recurrenceMatchesDateMonIndexed(rule, FRI)).toBe(true);
    expect(recurrenceMatchesDateMonIndexed(rule, SAT)).toBe(false);
    expect(recurrenceMatchesDateMonIndexed(rule, SUN)).toBe(false);
  });

  it("specificDays [0,2,4] (Mon/Wed/Fri) → matches those days only", () => {
    const rule = { type: "specificDays" as const, daysOfWeek: [0, 2, 4] };
    expect(recurrenceMatchesDateMonIndexed(rule, MON)).toBe(true);
    expect(recurrenceMatchesDateMonIndexed(rule, TUE)).toBe(false);
    expect(recurrenceMatchesDateMonIndexed(rule, WED)).toBe(true);
    expect(recurrenceMatchesDateMonIndexed(rule, THU)).toBe(false);
    expect(recurrenceMatchesDateMonIndexed(rule, FRI)).toBe(true);
  });

  it("specificDays with no daysOfWeek → false", () => {
    expect(recurrenceMatchesDateMonIndexed({ type: "specificDays" }, MON)).toBe(
      false,
    );
  });
});

describe("materializeRecurrence — input validation", () => {
  it("throws on malformed weekStartISO", () => {
    expect(() =>
      materializeRecurrence({ type: "daily" }, "not-a-date"),
    ).toThrow(/YYYY-MM-DD/);
    expect(() =>
      materializeRecurrence({ type: "daily" }, "2026/05/11"),
    ).toThrow(/YYYY-MM-DD/);
    expect(() => materializeRecurrence({ type: "daily" }, "")).toThrow(
      /YYYY-MM-DD/,
    );
  });
});
