import { describe, expect, it } from "vitest";
import { __testing__, computeWeeklyDelta } from "../convex/lib/rankWeekly";

/**
 * Weekly-delta contract tests.
 *
 * The contract: given thisWeek + last4Weeks yen earnings, classify the kid's
 * pace as one of {no_history, above_avg, at_avg, below_avg} and report a
 * signed integer percent delta. See `convex/lib/rankWeekly.ts` for the full
 * threshold + edge-case spec.
 */

describe("computeWeeklyDelta — no-history branch", () => {
  it("returns no_history kind when history list is empty", () => {
    const result = computeWeeklyDelta([100, 50], []);
    expect(result.kind).toBe("no_history");
    expect(result.ratio).toBe(0);
    expect(result.percentDelta).toBe(0);
    expect(result.rolling4WeekAvg).toBe(0);
    // thisWeekTotal still computed even when we can't compare.
    expect(result.thisWeekTotal).toBe(150);
  });

  it("returns no_history when BOTH lists empty", () => {
    const result = computeWeeklyDelta([], []);
    expect(result.kind).toBe("no_history");
    expect(result.ratio).toBe(0);
    expect(result.percentDelta).toBe(0);
    expect(result.thisWeekTotal).toBe(0);
  });
});

describe("computeWeeklyDelta — above_avg branch", () => {
  it("ratio 3.0 (300 vs avg 100) → above_avg, +200%", () => {
    const result = computeWeeklyDelta([300], [100, 100, 100, 100]);
    expect(result.kind).toBe("above_avg");
    expect(result.ratio).toBe(3);
    expect(result.rolling4WeekAvg).toBe(100);
    expect(result.percentDelta).toBe(200);
    expect(result.thisWeekTotal).toBe(300);
  });

  it("boundary: ratio exactly 1.20 classifies as above_avg (>=)", () => {
    // avg 100, this-week 120 → ratio exactly 1.20
    const result = computeWeeklyDelta([120], [100, 100, 100, 100]);
    expect(result.kind).toBe("above_avg");
    expect(result.ratio).toBeCloseTo(1.2, 10);
    expect(result.percentDelta).toBe(20);
  });
});

describe("computeWeeklyDelta — at_avg branch", () => {
  it("ratio 1.0 (100 vs avg 100) → at_avg, 0%", () => {
    const result = computeWeeklyDelta([100], [100, 100, 100, 100]);
    expect(result.kind).toBe("at_avg");
    expect(result.ratio).toBe(1);
    expect(result.percentDelta).toBe(0);
  });

  it("ratio 1.10 (just inside the band) → at_avg", () => {
    // avg 100, this-week 110 → ratio 1.10 — inside (0.80, 1.20)
    const result = computeWeeklyDelta([110], [100, 100, 100, 100]);
    expect(result.kind).toBe("at_avg");
    expect(result.percentDelta).toBe(10);
  });
});

describe("computeWeeklyDelta — below_avg branch", () => {
  it("ratio 0.2 (20 vs avg 100) → below_avg, -80%", () => {
    const result = computeWeeklyDelta([20], [100, 100, 100, 100]);
    expect(result.kind).toBe("below_avg");
    expect(result.ratio).toBeCloseTo(0.2, 10);
    expect(result.percentDelta).toBe(-80);
  });

  it("zero this-week + non-empty history → below_avg, -100%", () => {
    const result = computeWeeklyDelta([], [100, 100, 100, 100]);
    expect(result.kind).toBe("below_avg");
    expect(result.ratio).toBe(0);
    expect(result.percentDelta).toBe(-100);
    expect(result.thisWeekTotal).toBe(0);
  });

  it("boundary: ratio exactly 0.80 classifies as below_avg (<=)", () => {
    // avg 100, this-week 80 → ratio exactly 0.80
    const result = computeWeeklyDelta([80], [100, 100, 100, 100]);
    expect(result.kind).toBe("below_avg");
    expect(result.ratio).toBeCloseTo(0.8, 10);
    expect(result.percentDelta).toBe(-20);
  });
});

describe("computeWeeklyDelta — defensive filtering", () => {
  it("filters out non-positive amounts in both lists", () => {
    // -50, 0, NaN, Infinity should all be dropped from both inputs.
    // Result: this-week = [200] = 200, history = [100, 100] = 200, avg = 200/4 = 50.
    // Ratio = 200 / 50 = 4.0 → above_avg, +300%.
    const result = computeWeeklyDelta(
      [200, -50, 0, Number.NaN, Number.POSITIVE_INFINITY],
      [100, 100, -999, 0, Number.NaN],
    );
    expect(result.thisWeekTotal).toBe(200);
    expect(result.rolling4WeekAvg).toBe(50); // 200 / 4
    expect(result.ratio).toBe(4);
    expect(result.kind).toBe("above_avg");
    expect(result.percentDelta).toBe(300);
  });

  it("history divisor is always 4 (not non-zero entry count)", () => {
    // Single 400-yen week in history → avg should be 400/4 = 100 (NOT 400/1).
    // Bench: thisWeek 100, avg 100 → ratio 1.0 → at_avg.
    const result = computeWeeklyDelta([100], [400]);
    expect(result.rolling4WeekAvg).toBe(100);
    expect(result.kind).toBe("at_avg");
    expect(__testing__.HISTORY_WEEKS).toBe(4);
  });
});
