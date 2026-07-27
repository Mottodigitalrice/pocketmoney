import { describe, it, expect } from "vitest";
import {
  assertIsoDate,
  isIsoDate,
  assertMondayStartedWeek,
} from "../../convex/lib/dateValidation";

/** Build the canonical Mon→Sun week (7 UTC date strings) containing `iso`. */
function mondayWeek(iso: string): string[] {
  const d = new Date(`${iso}T00:00:00.000Z`);
  const day = d.getUTCDay();
  const toMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + toMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setUTCDate(monday.getUTCDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

/**
 * Wave 3a MED-4 ISO date validation contract tests.
 *
 * Used by `scheduledJobs.create / createBatch / applyRecurringForWeek /
 * quickAddForToday` to reject malformed or impossible date strings before
 * they hit the `by_child_date` index.
 */

describe("assertIsoDate", () => {
  it("accepts a typical valid date", () => {
    expect(() => assertIsoDate("2026-05-22")).not.toThrow();
  });

  it("accepts year boundaries (Jan 1)", () => {
    expect(() => assertIsoDate("2026-01-01")).not.toThrow();
  });

  it("accepts year boundaries (Dec 31)", () => {
    expect(() => assertIsoDate("2026-12-31")).not.toThrow();
  });

  it("accepts leap-year Feb 29 (2024)", () => {
    expect(() => assertIsoDate("2024-02-29")).not.toThrow();
  });

  it("rejects non-leap Feb 29 (2025)", () => {
    expect(() => assertIsoDate("2025-02-29")).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects impossible day (Feb 30 round-trip)", () => {
    expect(() => assertIsoDate("2026-02-30")).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects month 13", () => {
    expect(() => assertIsoDate("2026-13-01")).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects month 0", () => {
    expect(() => assertIsoDate("2026-00-15")).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects day 0", () => {
    expect(() => assertIsoDate("2026-05-00")).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects missing leading zero on month (2026-5-22)", () => {
    expect(() => assertIsoDate("2026-5-22")).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects missing leading zero on day (2026-05-2)", () => {
    expect(() => assertIsoDate("2026-05-2")).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects wrong separator (slash)", () => {
    expect(() => assertIsoDate("2026/05/22")).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects empty string", () => {
    expect(() => assertIsoDate("")).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects undefined", () => {
    expect(() => assertIsoDate(undefined)).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects null", () => {
    expect(() => assertIsoDate(null)).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("rejects non-string (number)", () => {
    expect(() => assertIsoDate(12345)).toThrow(/INVALID_DATE_FORMAT/);
  });

  it("includes the supplied label in the error message", () => {
    expect(() => assertIsoDate("bad", "entries[3].date")).toThrow(
      /entries\[3\]\.date/,
    );
  });

  it("narrows type to string after assert (TS-compile check)", () => {
    // This test exists primarily to fail typecheck if the `asserts` predicate
    // ever loses its narrowing. At runtime it just confirms the parsed input
    // can be used as a string.
    const input: unknown = "2026-05-22";
    assertIsoDate(input);
    // `input` should now be narrowed to string here.
    const len: number = input.length;
    expect(len).toBe(10);
  });
});

describe("isIsoDate", () => {
  it("returns true for a valid date", () => {
    expect(isIsoDate("2026-05-22")).toBe(true);
  });

  it("returns true for leap-year Feb 29", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
  });

  it("returns false for a non-leap Feb 29", () => {
    expect(isIsoDate("2025-02-29")).toBe(false);
  });

  it("returns false for wrong separator", () => {
    expect(isIsoDate("2026/05/22")).toBe(false);
  });

  it("returns false for non-string input", () => {
    expect(isIsoDate(12345)).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });
});

describe("assertMondayStartedWeek", () => {
  const week = mondayWeek("2026-06-03"); // Wed 2026-06-03 → Mon 2026-06-01…Sun 06-07

  it("accepts a canonical Monday-started consecutive week", () => {
    expect(() => assertMondayStartedWeek(week)).not.toThrow();
    // sanity: element 0 really is a Monday
    expect(new Date(`${week[0]}T00:00:00.000Z`).getUTCDay()).toBe(1);
  });

  it("rejects a rotated week (day 0 no longer Monday) — the forge vector", () => {
    const rotated = [...week.slice(1), week[0]!];
    expect(() => assertMondayStartedWeek(rotated)).toThrow(/INVALID_WEEK/);
  });

  it("rejects a padded / non-consecutive length-7 array", () => {
    const padded = [week[0]!, "2026-07-01", ...week.slice(1, 6)];
    expect(() => assertMondayStartedWeek(padded)).toThrow(/INVALID_WEEK/);
  });

  it("rejects a duplicated date (breaks strict consecutiveness)", () => {
    const dup = [week[0]!, week[0]!, ...week.slice(1, 6)];
    expect(() => assertMondayStartedWeek(dup)).toThrow(/INVALID_WEEK/);
  });

  it("rejects a Sunday-started week", () => {
    const sunFirst = mondayWeek("2026-06-03");
    const sunday = [sunFirst[6]!, ...mondayWeek("2026-06-10").slice(0, 6)];
    expect(() => assertMondayStartedWeek(sunday)).toThrow(/must start on Monday/);
  });

  it("rejects wrong length", () => {
    expect(() => assertMondayStartedWeek(week.slice(0, 6))).toThrow(/INVALID_WEEK/);
    expect(() => assertMondayStartedWeek([...week, "2026-06-08"])).toThrow(/INVALID_WEEK/);
  });

  it("rejects an impossible date inside the week", () => {
    const bad = [...week];
    bad[3] = "2026-02-30";
    expect(() => assertMondayStartedWeek(bad)).toThrow(/INVALID_/);
  });

  it("rejects non-array input", () => {
    expect(() => assertMondayStartedWeek("2026-06-01")).toThrow(/INVALID_WEEK/);
    expect(() => assertMondayStartedWeek(null)).toThrow(/INVALID_WEEK/);
  });
});
