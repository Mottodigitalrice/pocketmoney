import { describe, expect, it } from "vitest";
import {
  DEFAULT_SPLIT,
  splitEarning,
  type JarSplit,
} from "../convex/lib/walletMath";

/**
 * Wallet math contract tests.
 *
 * The CORE invariant: `spend + save + give === amount` for every non-negative
 * integer amount and every split summing to 100.
 */

describe("splitEarning — sum invariant (default 70/20/10)", () => {
  const cases = [0, 1, 3, 7, 10, 99, 100, 101, 999, 10_000];
  for (const amount of cases) {
    it(`¥${amount} → spend+save+give === ${amount}`, () => {
      const result = splitEarning(amount);
      expect(result.spend + result.save + result.give).toBe(amount);
      // jars never negative
      expect(result.spend).toBeGreaterThanOrEqual(0);
      expect(result.save).toBeGreaterThanOrEqual(0);
      expect(result.give).toBeGreaterThanOrEqual(0);
      // jars are integers
      expect(Number.isInteger(result.spend)).toBe(true);
      expect(Number.isInteger(result.save)).toBe(true);
      expect(Number.isInteger(result.give)).toBe(true);
    });
  }
});

describe("splitEarning — exact rounding cases (default split)", () => {
  it("¥0 → 0/0/0", () => {
    expect(splitEarning(0)).toEqual({ spend: 0, save: 0, give: 0 });
  });

  it("¥1 → 1/0/0 (everything to spend; floor of 0.2 and 0.1 is 0)", () => {
    expect(splitEarning(1)).toEqual({ spend: 1, save: 0, give: 0 });
  });

  it("¥3 → 3/0/0 (floor of 0.6 and 0.3 is 0)", () => {
    expect(splitEarning(3)).toEqual({ spend: 3, save: 0, give: 0 });
  });

  it("¥7 → 6/1/0 (save=floor(1.4)=1, give=floor(0.7)=0, spend=remainder)", () => {
    expect(splitEarning(7)).toEqual({ spend: 6, save: 1, give: 0 });
  });

  it("¥10 → 7/2/1 (clean split)", () => {
    expect(splitEarning(10)).toEqual({ spend: 7, save: 2, give: 1 });
  });

  it("¥99 → 71/19/9 (save=floor(19.8)=19, give=floor(9.9)=9, spend=99-19-9=71)", () => {
    expect(splitEarning(99)).toEqual({ spend: 71, save: 19, give: 9 });
  });

  it("¥100 → 70/20/10 (clean split)", () => {
    expect(splitEarning(100)).toEqual({ spend: 70, save: 20, give: 10 });
  });

  it("¥101 → 71/20/10 (remainder ¥1 to spend)", () => {
    expect(splitEarning(101)).toEqual({ spend: 71, save: 20, give: 10 });
  });

  it("¥999 → 701/199/99 (save=floor(199.8)=199, give=floor(99.9)=99, spend=999-199-99=701)", () => {
    expect(splitEarning(999)).toEqual({ spend: 701, save: 199, give: 99 });
  });

  it("¥10000 → 7000/2000/1000 (clean split)", () => {
    expect(splitEarning(10_000)).toEqual({ spend: 7_000, save: 2_000, give: 1_000 });
  });
});

describe("splitEarning — input validation", () => {
  it("throws on negative amount", () => {
    expect(() => splitEarning(-1)).toThrow(/non-negative/);
    expect(() => splitEarning(-100)).toThrow(/non-negative/);
  });

  it("throws on non-integer amount (yen has no cents)", () => {
    expect(() => splitEarning(1.5)).toThrow(/integer/);
    expect(() => splitEarning(0.1)).toThrow(/integer/);
    expect(() => splitEarning(99.99)).toThrow(/integer/);
  });

  it("throws on NaN / Infinity", () => {
    expect(() => splitEarning(NaN)).toThrow(/finite/);
    expect(() => splitEarning(Infinity)).toThrow(/finite/);
    expect(() => splitEarning(-Infinity)).toThrow(/finite/);
  });
});

describe("splitEarning — custom splits", () => {
  it("accepts 50/30/20 split", () => {
    const split: JarSplit = { spend: 50, save: 30, give: 20 };
    const result = splitEarning(100, split);
    expect(result).toEqual({ spend: 50, save: 30, give: 20 });
    expect(result.spend + result.save + result.give).toBe(100);
  });

  it("accepts 100/0/0 split (all to spend)", () => {
    const result = splitEarning(50, { spend: 100, save: 0, give: 0 });
    expect(result).toEqual({ spend: 50, save: 0, give: 0 });
  });

  it("accepts 0/100/0 split (all to save)", () => {
    const result = splitEarning(50, { spend: 0, save: 100, give: 0 });
    expect(result).toEqual({ spend: 0, save: 50, give: 0 });
  });

  it("throws when split does not sum to 100", () => {
    expect(() => splitEarning(100, { spend: 50, save: 30, give: 10 })).toThrow(
      /sum to 100/
    );
    expect(() => splitEarning(100, { spend: 60, save: 30, give: 20 })).toThrow(
      /sum to 100/
    );
    expect(() => splitEarning(100, { spend: 0, save: 0, give: 0 })).toThrow(
      /sum to 100/
    );
  });

  it("throws when any split is negative", () => {
    expect(() => splitEarning(100, { spend: 110, save: -5, give: -5 })).toThrow(
      /non-negative/
    );
  });

  it("sum-invariant holds for custom 50/30/20 across all canonical amounts", () => {
    const split: JarSplit = { spend: 50, save: 30, give: 20 };
    for (const amount of [0, 1, 3, 7, 10, 99, 100, 101, 999, 10_000]) {
      const r = splitEarning(amount, split);
      expect(r.spend + r.save + r.give).toBe(amount);
    }
  });
});

describe("splitEarning — DEFAULT_SPLIT export", () => {
  it("DEFAULT_SPLIT is 70/20/10", () => {
    expect(DEFAULT_SPLIT).toEqual({ spend: 70, save: 20, give: 10 });
  });

  it("default param equals DEFAULT_SPLIT", () => {
    expect(splitEarning(100)).toEqual(splitEarning(100, DEFAULT_SPLIT));
  });
});
