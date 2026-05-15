import { describe, expect, it } from "vitest";
import { findOrphansInList } from "../convex/lib/orphanSweep";

/**
 * Orphan-sweep contract tests (F5).
 *
 * Why pure: the audit query in `convex/functions/audit.ts` needs `ctx` to
 * read the `_storage` system table. The set-difference math itself has no
 * Convex dependency, so we extracted it to `convex/lib/orphanSweep.ts` and
 * prove the contract here.
 *
 * Core invariants:
 *   - Empty inputs → empty output (no crashes).
 *   - All referenced → no orphans.
 *   - None referenced → every unique entry surfaced.
 *   - Partial overlap → only the unreferenced ones surface.
 *   - Duplicates → output is de-duplicated AND idempotent under repeated
 *     calls (passing the same orphan list to `deleteOrphanedProofs` twice
 *     must not double-delete).
 *   - Output order matches input order of `all` (deterministic for the
 *     Convex dashboard).
 */

describe("findOrphansInList — empty inputs", () => {
  it("empty all → empty output", () => {
    expect(findOrphansInList([], [])).toEqual([]);
    expect(findOrphansInList([], ["ref-a", "ref-b"])).toEqual([]);
  });

  it("empty referenced → every unique entry from all", () => {
    expect(findOrphansInList(["a", "b", "c"], [])).toEqual(["a", "b", "c"]);
  });
});

describe("findOrphansInList — no orphans (everything referenced)", () => {
  it("all referenced → empty output", () => {
    expect(
      findOrphansInList(["a", "b", "c"], ["a", "b", "c"])
    ).toEqual([]);
  });

  it("referenced is a superset of all → empty output (extra refs ignored)", () => {
    // It's legal for the family's jobInstances to reference an ID that's no
    // longer in _storage (e.g. already manually deleted). That extra ref
    // shouldn't somehow re-introduce an orphan.
    expect(
      findOrphansInList(["a", "b"], ["a", "b", "c", "d"])
    ).toEqual([]);
  });
});

describe("findOrphansInList — all orphans (no references)", () => {
  it("nothing referenced → every entry is an orphan", () => {
    expect(findOrphansInList(["x", "y", "z"], [])).toEqual(["x", "y", "z"]);
  });

  it("referenced contains unrelated IDs → still every entry of all is an orphan", () => {
    expect(
      findOrphansInList(["x", "y"], ["unrelated-1", "unrelated-2"])
    ).toEqual(["x", "y"]);
  });
});

describe("findOrphansInList — partial overlap", () => {
  it("returns only the unreferenced storage IDs", () => {
    const all = ["s1", "s2", "s3", "s4", "s5"];
    const referenced = ["s2", "s4"];
    expect(findOrphansInList(all, referenced)).toEqual(["s1", "s3", "s5"]);
  });

  it("preserves input order of `all` (deterministic for dashboard)", () => {
    const all = ["z", "a", "m", "b"];
    const referenced = ["a"];
    // Output keeps z-m-b in their original positions; ordering is NOT sorted.
    expect(findOrphansInList(all, referenced)).toEqual(["z", "m", "b"]);
  });
});

describe("findOrphansInList — duplicate handling (idempotent)", () => {
  it("duplicate entries in `all` are de-duplicated in the output", () => {
    // Convex never returns duplicate _storage rows, but the helper should
    // still tolerate it so the deletion mutation can safely receive the
    // same orphan list twice (re-run after a partial failure).
    expect(
      findOrphansInList(["a", "a", "b", "b", "b"], [])
    ).toEqual(["a", "b"]);
  });

  it("duplicate entries in `referenced` don't affect membership", () => {
    expect(
      findOrphansInList(["a", "b", "c"], ["b", "b", "b", "b"])
    ).toEqual(["a", "c"]);
  });

  it("idempotent: calling on prior output yields the same output", () => {
    const first = findOrphansInList(["a", "b", "c"], ["b"]);
    const second = findOrphansInList(first, ["b"]);
    expect(first).toEqual(["a", "c"]);
    expect(second).toEqual(["a", "c"]);
  });
});
