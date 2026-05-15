import { describe, expect, it } from "vitest";
import {
  assertOwnedBy,
  assertOwnedByOrNull,
  getOwnedById,
} from "../convex/lib/auth";
import type { Id } from "../convex/_generated/dataModel";

/**
 * Ownership / auth helper contract tests.
 *
 * Why pure: `assertOwnedBy` and `assertOwnedByOrNull` are pure predicates
 * over a fetched doc + the current user's _id. They have no Convex
 * dependency. `getOwnedById` is a thin wrapper over `ctx.db.get` + the
 * pure assertion — we exercise it with a minimal `ctx` mock that exposes
 * just `db.get`.
 *
 * Core invariants enforced by these helpers (the audit surface is small
 * on purpose; cross-tenant leaks would route through here first):
 *   - Missing doc → throws "{Resource} not found"
 *   - Wrong owner → throws "Not your {resource}" (in assertOwnedBy)
 *   - Wrong owner → still throws in assertOwnedByOrNull (cross-tenant is
 *     never allowed; only soft-not-found is fine)
 *   - Missing doc → returns null in assertOwnedByOrNull
 *   - Happy path → returns the doc, narrowed to non-null + confirmed-owned
 */

// Cast helpers — these are Convex branded types at compile time; at runtime
// they're just opaque strings. Tests don't care about the brand.
const userA = "u_alice" as unknown as Id<"users">;
const userB = "u_bob" as unknown as Id<"users">;

interface OwnedTestDoc {
  _id: unknown;
  userId: Id<"users">;
  payload?: string;
}

// ──────────────────────────────────────────────────────────────────────
// assertOwnedBy
// ──────────────────────────────────────────────────────────────────────

describe("assertOwnedBy — happy path returns the narrowed doc", () => {
  it("returns the doc when userId matches", () => {
    const doc: OwnedTestDoc = {
      _id: "child_1",
      userId: userA,
      payload: "hello",
    };
    const result = assertOwnedBy(doc, userA, "child");
    // Same reference, no copy, no mutation.
    expect(result).toBe(doc);
    expect(result.payload).toBe("hello");
  });
});

describe("assertOwnedBy — wrong owner throws 'Not your {resource}'", () => {
  it("throws when the doc belongs to a different user (cross-tenant)", () => {
    const doc: OwnedTestDoc = { _id: "child_1", userId: userB };
    expect(() => assertOwnedBy(doc, userA, "child")).toThrow(/Not your child/);
  });
});

describe("assertOwnedBy — missing doc throws '{Resource} not found'", () => {
  it("throws NOT_FOUND-style error when doc is null", () => {
    expect(() => assertOwnedBy(null, userA, "child")).toThrow(
      /Child not found/
    );
  });

  it("capitalizes the resource label in the error message", () => {
    // The capitalize() helper lives in auth.ts. Confirm: "wallet" → "Wallet".
    expect(() => assertOwnedBy(null, userA, "wallet")).toThrow(
      /Wallet not found/
    );
  });
});

// ──────────────────────────────────────────────────────────────────────
// assertOwnedByOrNull
// ──────────────────────────────────────────────────────────────────────

describe("assertOwnedByOrNull — wrong owner still throws (cross-tenant)", () => {
  it("does NOT silently return null when owner mismatches (security contract)", () => {
    // Critical: a wrong-owner doc must NEVER soft-fail. Soft-not-found is
    // OK (idempotent delete pattern); cross-tenant is never OK.
    const doc: OwnedTestDoc = { _id: "child_1", userId: userB };
    expect(() => assertOwnedByOrNull(doc, userA, "child")).toThrow(
      /Not your child/
    );
  });
});

describe("assertOwnedByOrNull — missing doc returns null", () => {
  it("returns null without throwing (idempotent delete pattern)", () => {
    const result = assertOwnedByOrNull<OwnedTestDoc>(null, userA, "child");
    expect(result).toBeNull();
  });

  it("returns the doc on happy path (same shape as assertOwnedBy)", () => {
    const doc: OwnedTestDoc = { _id: "child_1", userId: userA };
    expect(assertOwnedByOrNull(doc, userA, "child")).toBe(doc);
  });
});

// ──────────────────────────────────────────────────────────────────────
// getOwnedById — wraps ctx.db.get + assertOwnedBy
// ──────────────────────────────────────────────────────────────────────

describe("getOwnedById — happy path fetches + asserts in one call", () => {
  it("returns the doc when ctx.db.get returns an owned doc", async () => {
    const doc: OwnedTestDoc = { _id: "child_1", userId: userA };
    const ctx = {
      db: {
        get: async () => doc,
      },
    };
    const result = await getOwnedById(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx as any,
      "child_1" as unknown as Id<"children">,
      userA,
      "child"
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(result as any).toBe(doc);
  });
});

describe("getOwnedById — wrong owner throws (via assertOwnedBy)", () => {
  it("throws 'Not your {resource}' when fetched doc belongs to another user", async () => {
    const doc: OwnedTestDoc = { _id: "child_1", userId: userB };
    const ctx = {
      db: {
        get: async () => doc,
      },
    };
    await expect(
      getOwnedById(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctx as any,
        "child_1" as unknown as Id<"children">,
        userA,
        "child"
      )
    ).rejects.toThrow(/Not your child/);
  });

  it("throws '{Resource} not found' when ctx.db.get returns null", async () => {
    const ctx = {
      db: {
        get: async () => null,
      },
    };
    await expect(
      getOwnedById(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctx as any,
        "missing_id" as unknown as Id<"children">,
        userA,
        "child"
      )
    ).rejects.toThrow(/Child not found/);
  });
});
