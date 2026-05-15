import { describe, expect, it } from "vitest";
import {
  computeMigrationDelta,
  isDeltaZero,
  DEFAULT_SPLIT,
} from "../convex/lib/migrationDiff";
import { splitEarning } from "../convex/lib/walletMath";

/**
 * Migration diff contract tests.
 *
 * Why pure: the mutation in `convex/functions/wallets.ts` needs `ctx`, so we
 * extracted the per-jar diff math to `convex/lib/migrationDiff.ts` and prove
 * the contract here.
 *
 * Core invariants:
 *   - Fresh child (no prior migration) → delta === expected split
 *   - Already-migrated child → delta is all zeros (idempotency)
 *   - Partially-migrated child → delta = exactly the missing jars
 *   - Negative delta (manual over-credit) → clamped to 0, never negative
 */

describe("computeMigrationDelta — fresh child (no prior migration)", () => {
  it("¥1000 lifetime, nothing credited → delta === full 70/20/10 split", () => {
    const result = computeMigrationDelta({
      lifetimeEarnings: 1000,
      actualSpend: 0,
      actualSave: 0,
      actualGive: 0,
    });
    expect(result.expected).toEqual({ spend: 700, save: 200, give: 100 });
    expect(result.actual).toEqual({ spend: 0, save: 0, give: 0 });
    expect(result.delta).toEqual({ spend: 700, save: 200, give: 100 });
    expect(isDeltaZero(result.delta)).toBe(false);
  });

  it("¥0 lifetime, nothing credited → delta all zeros", () => {
    const result = computeMigrationDelta({
      lifetimeEarnings: 0,
      actualSpend: 0,
      actualSave: 0,
      actualGive: 0,
    });
    expect(result.delta).toEqual({ spend: 0, save: 0, give: 0 });
    expect(isDeltaZero(result.delta)).toBe(true);
  });

  it("delta matches splitEarning(lifetime) exactly for fresh state", () => {
    for (const amount of [7, 101, 999, 10_000]) {
      const expected = splitEarning(amount);
      const result = computeMigrationDelta({
        lifetimeEarnings: amount,
        actualSpend: 0,
        actualSave: 0,
        actualGive: 0,
      });
      expect(result.delta).toEqual(expected);
    }
  });
});

describe("computeMigrationDelta — already-migrated child (idempotency)", () => {
  it("full migration already applied → delta all zeros", () => {
    const lifetime = 1000;
    const expected = splitEarning(lifetime); // {spend:700, save:200, give:100}
    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: expected.spend,
      actualSave: expected.save,
      actualGive: expected.give,
    });
    expect(result.delta).toEqual({ spend: 0, save: 0, give: 0 });
    expect(isDeltaZero(result.delta)).toBe(true);
  });

  it("calling twice on a fully-migrated child stays a no-op (idempotent)", () => {
    const lifetime = 555;
    const expected = splitEarning(lifetime);

    // First call result drives "actual" for second call.
    const second = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: expected.spend,
      actualSave: expected.save,
      actualGive: expected.give,
    });

    expect(second.delta).toEqual({ spend: 0, save: 0, give: 0 });
    expect(isDeltaZero(second.delta)).toBe(true);
  });
});

describe("computeMigrationDelta — partially-migrated child (partial-run recovery)", () => {
  it("only Spend was credited in prior run → delta = {spend:0, save:expected.save, give:expected.give}", () => {
    // This is the F4 partial-run recovery proof: crash happened after Spend
    // was written but before Save+Give. Second call must finish ONLY Save+Give.
    const lifetime = 1000;
    const expected = splitEarning(lifetime); // {700, 200, 100}
    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: expected.spend, // 700 — done
      actualSave: 0,                // 200 — pending
      actualGive: 0,                // 100 — pending
    });
    expect(result.delta).toEqual({
      spend: 0,
      save: expected.save,
      give: expected.give,
    });
    expect(isDeltaZero(result.delta)).toBe(false);
  });

  it("Spend + Save done, Give pending → delta credits only Give", () => {
    const lifetime = 1000;
    const expected = splitEarning(lifetime);
    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: expected.spend,
      actualSave: expected.save,
      actualGive: 0,
    });
    expect(result.delta).toEqual({ spend: 0, save: 0, give: expected.give });
  });

  it("only Save was credited (mid-loop crash mid-jar) → delta finishes Spend + Give", () => {
    const lifetime = 1000;
    const expected = splitEarning(lifetime);
    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: 0,
      actualSave: expected.save,
      actualGive: 0,
    });
    expect(result.delta).toEqual({
      spend: expected.spend,
      save: 0,
      give: expected.give,
    });
  });
});

describe("computeMigrationDelta — negative delta clamping (manual adjustment exceeded expected)", () => {
  it("jar over-credited beyond expected → delta clamps to 0, NOT negative", () => {
    const lifetime = 1000;
    const expected = splitEarning(lifetime); // spend=700
    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: expected.spend + 500, // manual top-up
      actualSave: 0,
      actualGive: 0,
    });
    // spend delta clamped, save+give still pending.
    expect(result.delta.spend).toBe(0);
    expect(result.delta.save).toBe(expected.save);
    expect(result.delta.give).toBe(expected.give);
    // Crucially: no negative number anywhere.
    expect(result.delta.spend).toBeGreaterThanOrEqual(0);
    expect(result.delta.save).toBeGreaterThanOrEqual(0);
    expect(result.delta.give).toBeGreaterThanOrEqual(0);
  });

  it("every jar over-credited → all deltas clamp to 0 (no compensating debits)", () => {
    const lifetime = 100;
    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: 9999,
      actualSave: 9999,
      actualGive: 9999,
    });
    expect(result.delta).toEqual({ spend: 0, save: 0, give: 0 });
    expect(isDeltaZero(result.delta)).toBe(true);
  });
});

describe("computeMigrationDelta — custom split percentages", () => {
  it("respects non-default split when passed", () => {
    const customSplit = { spend: 50, save: 30, give: 20 };
    const result = computeMigrationDelta(
      {
        lifetimeEarnings: 1000,
        actualSpend: 0,
        actualSave: 0,
        actualGive: 0,
      },
      customSplit
    );
    expect(result.expected).toEqual({ spend: 500, save: 300, give: 200 });
    expect(result.delta).toEqual({ spend: 500, save: 300, give: 200 });
  });

  it("DEFAULT_SPLIT is the 70/20/10 contract", () => {
    expect(DEFAULT_SPLIT).toEqual({ spend: 70, save: 20, give: 10 });
  });
});

describe("isDeltaZero — predicate", () => {
  it("returns true only when all three jars are zero", () => {
    expect(isDeltaZero({ spend: 0, save: 0, give: 0 })).toBe(true);
    expect(isDeltaZero({ spend: 1, save: 0, give: 0 })).toBe(false);
    expect(isDeltaZero({ spend: 0, save: 1, give: 0 })).toBe(false);
    expect(isDeltaZero({ spend: 0, save: 0, give: 1 })).toBe(false);
  });
});
