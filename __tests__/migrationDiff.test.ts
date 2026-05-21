import { describe, expect, it } from "vitest";
import {
  computeMigrationDelta,
  isDeltaZero,
  splitEarning,
  DEFAULT_SPLIT,
  type JarSplit,
} from "../convex/lib/migrationDiff";

/**
 * migrationDiff — additive / removal / mixed / no-change diff framing.
 *
 * Why pure: see `convex/lib/migrationDiff.ts` docstring. The mutation needs
 * `ctx`; the diff math doesn't.
 *
 * `__tests__/migration.test.ts` already covers the fresh / fully-migrated /
 * partially-migrated / negative-clamp / custom-split contracts. This file
 * pins the diff in the four classical-diff framings:
 *
 *   - **no-change**:  expected === actual (in aggregate, per-jar)
 *                     → delta all zeros, isDeltaZero === true.
 *   - **additive**:   actual < expected → delta credits the missing.
 *   - **removal**:    actual > expected → clamp (we NEVER issue
 *                     compensating debits — the ledger is immutable).
 *   - **mixed**:      one jar over-credited, one jar under-credited
 *                     → over clamps to 0, under credits the missing.
 *
 * These framings come from the F4 task ('compute exactly the missing
 * delta, never re-credit, never undo manual adjustments') and are a useful
 * reference for future debugging — a regression here would silently double-
 * credit children on migration re-runs, which is the worst-case bug class.
 */

// Helper to assert a result has the expected delta + expected `actual` echo.
function expectDelta(
  result: ReturnType<typeof computeMigrationDelta>,
  expectedDelta: JarSplit,
) {
  expect(result.delta).toEqual(expectedDelta);
}

describe("migrationDiff — no-change framing (expected === actual)", () => {
  it("no-change: every jar already credited to expected → all-zero delta", () => {
    const lifetime = 1_234;
    const split = splitEarning(lifetime, DEFAULT_SPLIT);

    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: split.spend,
      actualSave: split.save,
      actualGive: split.give,
    });

    expectDelta(result, { spend: 0, save: 0, give: 0 });
    expect(isDeltaZero(result.delta)).toBe(true);
    // expected/actual echo is also useful for callers that log diagnostics.
    expect(result.expected).toEqual(split);
    expect(result.actual).toEqual(split);
  });
});

describe("migrationDiff — additive framing (actual < expected on one or more jars)", () => {
  it("one jar pending (Save) → delta credits exactly that jar", () => {
    const lifetime = 1000;
    const split = splitEarning(lifetime, DEFAULT_SPLIT); // {700, 200, 100}

    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: split.spend, // done
      actualSave: 0, // pending — ADDITIVE
      actualGive: split.give, // done
    });

    expectDelta(result, { spend: 0, save: split.save, give: 0 });
    expect(isDeltaZero(result.delta)).toBe(false);
  });

  it("two jars pending (Save + Give) → delta credits both", () => {
    const lifetime = 1000;
    const split = splitEarning(lifetime, DEFAULT_SPLIT);

    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: split.spend,
      actualSave: 0,
      actualGive: 0,
    });

    expectDelta(result, { spend: 0, save: split.save, give: split.give });
  });
});

describe("migrationDiff — removal framing (actual > expected, immutable ledger)", () => {
  it("over-credited jar clamps to 0 — NEVER a compensating debit", () => {
    // This is the critical invariant: the immutable-ledger contract means
    // a removal in diff terms is REFUSED. A manual top-up that pushed Spend
    // past `expected` must NOT be reversed by a migration re-run.
    const lifetime = 1000;
    const split = splitEarning(lifetime, DEFAULT_SPLIT); // {700, 200, 100}

    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: split.spend + 500, // over-credited
      actualSave: split.save, // exactly
      actualGive: split.give, // exactly
    });

    expectDelta(result, { spend: 0, save: 0, give: 0 });
    expect(isDeltaZero(result.delta)).toBe(true);

    // Crucially: actual still reflects the over-credit, delta does NOT.
    // The mutation will issue no credit for Spend at all.
    expect(result.actual.spend).toBe(split.spend + 500);
    expect(result.delta.spend).toBe(0);
    expect(result.delta.spend).not.toBeLessThan(0); // never negative
  });
});

describe("migrationDiff — mixed framing (one jar over, one jar under)", () => {
  it("Spend over-credited + Save pending + Give pending → only Save+Give credited", () => {
    // The realistic recovery case: a prior partial run credited Spend
    // correctly, a parent then issued a manual Spend top-up, and the second
    // migration run kicks in. Save and Give are still pending. The diff
    // must credit ONLY the pending jars, leaving the over-credited jar
    // untouched (no debit).
    const lifetime = 1000;
    const split = splitEarning(lifetime, DEFAULT_SPLIT); // {700, 200, 100}

    const result = computeMigrationDelta({
      lifetimeEarnings: lifetime,
      actualSpend: split.spend + 250, // over-credited (manual top-up)
      actualSave: 0, // pending — credit
      actualGive: 0, // pending — credit
    });

    expectDelta(result, {
      spend: 0,
      save: split.save,
      give: split.give,
    });
    expect(isDeltaZero(result.delta)).toBe(false);

    // Defensive: every jar of delta must be non-negative.
    expect(result.delta.spend).toBeGreaterThanOrEqual(0);
    expect(result.delta.save).toBeGreaterThanOrEqual(0);
    expect(result.delta.give).toBeGreaterThanOrEqual(0);
  });
});
