import { describe, it, expect } from "vitest";
import { assertIsoDate, isIsoDate } from "../../convex/lib/dateValidation";

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
