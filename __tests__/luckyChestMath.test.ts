import { describe, expect, it } from "vitest";
import {
  __testing__,
  pickLuckyChestAmount,
} from "../convex/lib/luckyChestMath";

/**
 * Lucky chest math contract tests.
 *
 * Range invariant: pickLuckyChestAmount(N) ∈ [1, N] for every valid N, and
 * with a deterministic RNG every value in [1, N] is reachable.
 */

/** Counter-based deterministic RNG that cycles 0.0, 0.1, 0.2, …, 0.9. */
function makeCycleRng(): () => number {
  let i = 0;
  return () => {
    const v = (i % 10) / 10;
    i += 1;
    return v;
  };
}

describe("pickLuckyChestAmount — range invariant", () => {
  it("maxAmount=1 always returns 1 regardless of RNG output", () => {
    // RNG values across [0, 1) all map to floor(x * 1) + 1 = 1
    for (const r of [0, 0.1, 0.5, 0.9, 0.9999999]) {
      expect(pickLuckyChestAmount(1, () => r)).toBe(1);
    }
  });

  it("maxAmount=10 over 1000 draws covers every value in [1,10]", () => {
    const rng = makeCycleRng();
    const draws = Array.from({ length: 1000 }, () =>
      pickLuckyChestAmount(10, rng),
    );
    const unique = new Set(draws);
    expect(unique.size).toBe(10);
    for (let v = 1; v <= 10; v += 1) {
      expect(unique.has(v)).toBe(true);
    }
    // All draws within range
    for (const d of draws) {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(10);
    }
  });
});

describe("pickLuckyChestAmount — validation", () => {
  it("throws on maxAmount=0 (must be >= 1)", () => {
    expect(() => pickLuckyChestAmount(0)).toThrow(/must be >= 1/);
  });

  it("throws on maxAmount=-5 (must be >= 1)", () => {
    expect(() => pickLuckyChestAmount(-5)).toThrow(/must be >= 1/);
  });

  it("throws on maxAmount=1.5 (must be an integer)", () => {
    expect(() => pickLuckyChestAmount(1.5)).toThrow(/must be an integer/);
  });

  it("throws on undefined (typeof !== number branch)", () => {
    expect(() => pickLuckyChestAmount(undefined as unknown as number)).toThrow(
      /must be an integer/,
    );
  });

  it(`throws on maxAmount=${__testing__.MAX_LUCKY_CHEST_CAP + 1} (over cap)`, () => {
    expect(() =>
      pickLuckyChestAmount(__testing__.MAX_LUCKY_CHEST_CAP + 1),
    ).toThrow(/must be <= 10000/);
  });
});

describe("pickLuckyChestAmount — default RNG", () => {
  it("default Math.random path returns integer in [1, maxAmount]", () => {
    for (let trial = 0; trial < 20; trial += 1) {
      const v = pickLuckyChestAmount(100);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
