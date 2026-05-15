import { describe, expect, it } from "vitest";
import {
  CHILD_CASCADE_TABLES,
  getChildCascadeTables,
  type ChildCascadeTable,
} from "../convex/lib/childCascade";

/**
 * Child-cascade table-list contract tests (deep).
 *
 * Why pure: `childCascade.ts` exports a `const` array of table names. The
 * delete loop in `convex/functions/children.ts` walks each one via the
 * `by_child` index. The CONTENT of the array (which tables) is the
 * tripwire that catches missing cascade branches when a new per-child
 * table is added to the schema.
 *
 * `__tests__/edge-cases.test.ts` already covers the F6 invariants (the
 * specific table names + stable ordering). This file adds:
 *   - Shape invariants (no duplicates, all strings, non-empty list)
 *   - Reference stability across calls (the getter MUST return the same
 *     constant — callers cache the result)
 *   - Pinned set of tables (any addition is a deliberate change)
 *   - Explicit absence of jobInstances / scheduledJobs (per the file's
 *     docstring: those need non-trivial cleanup and live in their own
 *     loop, not this list)
 */

describe("CHILD_CASCADE_TABLES — shape invariants", () => {
  it("is a non-empty list", () => {
    expect(CHILD_CASCADE_TABLES.length).toBeGreaterThan(0);
  });

  it("contains no duplicate table names", () => {
    const seen = new Set<string>(CHILD_CASCADE_TABLES);
    expect(seen.size).toBe(CHILD_CASCADE_TABLES.length);
  });

  it("every entry is a non-empty string", () => {
    for (const t of CHILD_CASCADE_TABLES) {
      expect(typeof t).toBe("string");
      expect((t as string).length).toBeGreaterThan(0);
    }
  });
});

describe("CHILD_CASCADE_TABLES — pinned table set (tripwire for schema drift)", () => {
  it("matches the exact expected set (Track-B per-child tables)", () => {
    // The cascade walks: wallets, transactions, goals, luckyChests.
    // Adding a new per-child table requires:
    //   1. Appending it to CHILD_CASCADE_TABLES in childCascade.ts.
    //   2. Adding a matching branch in `cascadeOneTable` in
    //      convex/functions/children.ts (the exhaustiveness check there
    //      compile-fails until step 2 is done).
    // This assertion catches step 1 being skipped.
    const sorted = [...CHILD_CASCADE_TABLES].sort();
    expect(sorted).toEqual(["goals", "luckyChests", "transactions", "wallets"]);
  });

  it("does NOT include jobInstances or scheduledJobs (those have custom cleanup)", () => {
    // Per the docstring in childCascade.ts: jobInstances + scheduledJobs
    // need proof-storage cleanup + by_user index walks. They live in their
    // own loop in children.ts, not in the simple-cascade list.
    expect(CHILD_CASCADE_TABLES).not.toContain("jobInstances");
    expect(CHILD_CASCADE_TABLES).not.toContain("scheduledJobs");
  });
});

describe("getChildCascadeTables — getter contract", () => {
  it("returns the same reference across calls (callers may cache)", () => {
    // The getter is a thin wrapper around the constant. Returning a fresh
    // copy each call would be wasteful and would also break reference
    // equality, which downstream code is allowed to rely on.
    expect(getChildCascadeTables()).toBe(getChildCascadeTables());
    expect(getChildCascadeTables()).toBe(CHILD_CASCADE_TABLES);
  });

  it("returns the table list in the same order as CHILD_CASCADE_TABLES", () => {
    // Order is a soft contract — children.remove iterates in this order,
    // and changing the order changes the delete sequence (which can matter
    // for FK-like read-after-write timing within the mutation).
    expect([...getChildCascadeTables()]).toEqual([...CHILD_CASCADE_TABLES]);
  });

  it("the ChildCascadeTable type union matches the array entries at runtime", () => {
    // ChildCascadeTable is `(typeof CHILD_CASCADE_TABLES)[number]`. We can't
    // assert type equivalence at runtime, but we CAN verify that picking
    // an arbitrary entry round-trips as a valid table name.
    const first: ChildCascadeTable = CHILD_CASCADE_TABLES[0]!;
    expect(CHILD_CASCADE_TABLES).toContain(first);
  });
});
