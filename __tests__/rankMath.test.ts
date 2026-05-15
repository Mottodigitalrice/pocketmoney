import { describe, expect, it } from "vitest";
import { calculateRank, RANK_THRESHOLDS } from "../convex/lib/rankMath";

/**
 * Rank math tier-boundary tests.
 *
 * Tier thresholds (score = floor(lifetime * multiplier)):
 *   Noob    [0,     500)
 *   Normal  [500,   2000)
 *   Pro     [2000,  5000)
 *   Master  [5000,  10000)
 *   Hacker  [10000, ∞)
 */

describe("RANK_THRESHOLDS table", () => {
  it("has 5 tiers in order", () => {
    expect(RANK_THRESHOLDS.map((t) => t.rank)).toEqual([
      "Noob",
      "Normal",
      "Pro",
      "Master",
      "Hacker",
    ]);
  });
  it("scores are monotonically increasing", () => {
    for (let i = 1; i < RANK_THRESHOLDS.length; i++) {
      expect(RANK_THRESHOLDS[i].score).toBeGreaterThan(RANK_THRESHOLDS[i - 1].score);
    }
  });
});

describe("calculateRank — multiplier = 1.0 (oldest sibling, no boost)", () => {
  it("¥0 → Noob, 0% progress", () => {
    const r = calculateRank(0, 1);
    expect(r.tier).toBe("Noob");
    expect(r.nextRank).toBe("Normal");
    expect(r.nextTierAt).toBe(500);
    expect(r.progressToNext).toBe(0);
    expect(r.score).toBe(0);
  });

  it("¥499 → Noob, 100% (last ¥ before Normal)", () => {
    const r = calculateRank(499, 1);
    expect(r.tier).toBe("Noob");
    // 499/500 = 99.8% → rounds to 100 in the legacy formula
    expect(r.progressToNext).toBe(100);
  });

  it("¥500 → Normal (first ¥ of Normal)", () => {
    const r = calculateRank(500, 1);
    expect(r.tier).toBe("Normal");
    expect(r.nextRank).toBe("Pro");
    expect(r.nextTierAt).toBe(2000);
    expect(r.progressToNext).toBe(0);
  });

  it("¥1999 → Normal, just under Pro", () => {
    const r = calculateRank(1999, 1);
    expect(r.tier).toBe("Normal");
    // (1999-500)/(2000-500) = 1499/1500 → ~99.93% → 100
    expect(r.progressToNext).toBe(100);
  });

  it("¥2000 → Pro (first ¥)", () => {
    const r = calculateRank(2000, 1);
    expect(r.tier).toBe("Pro");
    expect(r.nextTierAt).toBe(5000);
    expect(r.progressToNext).toBe(0);
  });

  it("¥4999 → Pro", () => {
    const r = calculateRank(4999, 1);
    expect(r.tier).toBe("Pro");
  });

  it("¥5000 → Master (first ¥)", () => {
    const r = calculateRank(5000, 1);
    expect(r.tier).toBe("Master");
    expect(r.nextTierAt).toBe(10000);
    expect(r.progressToNext).toBe(0);
  });

  it("¥9999 → Master", () => {
    const r = calculateRank(9999, 1);
    expect(r.tier).toBe("Master");
  });

  it("¥10000 → Hacker (top tier — no next)", () => {
    const r = calculateRank(10000, 1);
    expect(r.tier).toBe("Hacker");
    expect(r.nextRank).toBeNull();
    expect(r.nextTierAt).toBeNull();
    expect(r.progressToNext).toBe(100);
  });

  it("¥50000 → still Hacker (well beyond top)", () => {
    const r = calculateRank(50000, 1);
    expect(r.tier).toBe("Hacker");
    expect(r.nextTierAt).toBeNull();
  });
});

describe("calculateRank — multiplier = 2.0 (younger sibling, double speed)", () => {
  it("¥0 × 2 = score 0 → Noob", () => {
    expect(calculateRank(0, 2).tier).toBe("Noob");
  });

  it("¥249 × 2 = score 498 → still Noob (last ¥ before threshold flips)", () => {
    const r = calculateRank(249, 2);
    expect(r.score).toBe(498);
    expect(r.tier).toBe("Noob");
  });

  it("¥250 × 2 = score 500 → Normal (half the yen of multiplier=1 sibling)", () => {
    const r = calculateRank(250, 2);
    expect(r.score).toBe(500);
    expect(r.tier).toBe("Normal");
  });

  it("¥1000 × 2 = score 2000 → Pro (oldest sibling needs ¥2000, youngest needs ¥1000)", () => {
    const r = calculateRank(1000, 2);
    expect(r.score).toBe(2000);
    expect(r.tier).toBe("Pro");
  });

  it("¥2500 × 2 = score 5000 → Master", () => {
    const r = calculateRank(2500, 2);
    expect(r.score).toBe(5000);
    expect(r.tier).toBe("Master");
  });

  it("¥5000 × 2 = score 10000 → Hacker", () => {
    const r = calculateRank(5000, 2);
    expect(r.score).toBe(10000);
    expect(r.tier).toBe("Hacker");
    expect(r.nextTierAt).toBeNull();
  });

  it("multiplier echoed back in result", () => {
    expect(calculateRank(100, 2).multiplier).toBe(2);
    expect(calculateRank(100, 1.5).multiplier).toBe(1.5);
  });
});

describe("calculateRank — multiplier edge cases (defensive defaults)", () => {
  it("multiplier 0 falls back to 1 (defensive)", () => {
    // Legacy provider: `child?.rankMultiplier ?? 1` — 0 is falsy in the
    // `||` sense but `??` only nulls. Our lib treats `<= 0` as "use default".
    const r = calculateRank(500, 0);
    expect(r.multiplier).toBe(1);
    expect(r.tier).toBe("Normal");
  });

  it("negative multiplier falls back to 1", () => {
    expect(calculateRank(500, -2).multiplier).toBe(1);
  });

  it("NaN multiplier falls back to 1", () => {
    expect(calculateRank(500, NaN).multiplier).toBe(1);
  });

  it("negative lifetime treated as 0", () => {
    const r = calculateRank(-100, 1);
    expect(r.score).toBe(0);
    expect(r.tier).toBe("Noob");
  });

  it("NaN lifetime treated as 0", () => {
    const r = calculateRank(NaN, 1);
    expect(r.score).toBe(0);
    expect(r.tier).toBe("Noob");
  });

  it("fractional lifetime is floored after multiplier", () => {
    // 99.7 * 1 = 99.7 → floor 99
    expect(calculateRank(99.7, 1).score).toBe(99);
    // 100 * 1.5 = 150 → exact
    expect(calculateRank(100, 1.5).score).toBe(150);
    // 33 * 1.5 = 49.5 → floor 49
    expect(calculateRank(33, 1.5).score).toBe(49);
  });
});

describe("calculateRank — progress percentage", () => {
  it("midway through a tier reports ~50%", () => {
    // Normal range is [500, 2000) → midpoint 1250 → 50%
    const r = calculateRank(1250, 1);
    expect(r.tier).toBe("Normal");
    expect(r.progressToNext).toBe(50);
  });

  it("quarter through Pro reports 25%", () => {
    // Pro range is [2000, 5000), span 3000. 2000 + 750 = 2750 → 25%
    const r = calculateRank(2750, 1);
    expect(r.tier).toBe("Pro");
    expect(r.progressToNext).toBe(25);
  });

  it("progress is clamped to [0, 100]", () => {
    for (const lifetime of [0, 100, 499, 500, 1000, 1999, 2000, 5000, 9999, 10000, 99999]) {
      const r = calculateRank(lifetime, 1);
      expect(r.progressToNext).toBeGreaterThanOrEqual(0);
      expect(r.progressToNext).toBeLessThanOrEqual(100);
    }
  });
});
