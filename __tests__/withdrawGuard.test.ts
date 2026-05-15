import { describe, expect, it } from "vitest";
import {
  overdraftErrorOrNull,
  OVERDRAFT_PREFIX,
} from "../convex/lib/withdrawGuard";

/**
 * Withdraw-guard contract tests (deep).
 *
 * Why pure: `withdrawGuard.ts` is a single predicate (no `ctx`, no DB). The
 * frontend pattern-matches the `OVERDRAFT:` prefix to localize the error
 * (i18n key `error_overdraft`), so the exact format is a wire contract.
 *
 * `__tests__/edge-cases.test.ts` already covers the basic shape (null on
 * pass, prefix on fail). This file adds:
 *   - Boundary classes (==, large numbers, zero)
 *   - Exact format invariants (prefix, ¥ marks, balance + amount in body)
 *   - Negative-amount + negative-balance behaviour (not a real-world case
 *     but worth pinning so a future signature change can't silently flip
 *     the semantics)
 *
 * The contract is intentionally minimal: `balance >= amount` is the ONLY
 * thing checked. There's no max-per-day rule in this lib — that belongs in
 * the mutation layer if it ever lands. Pin the current contract here.
 */

describe("overdraftErrorOrNull — exact boundary (balance === amount)", () => {
  it("amount equal to balance is OK (returns null)", () => {
    expect(overdraftErrorOrNull(1000, 1000)).toBeNull();
  });

  it("amount === balance, both zero → also OK", () => {
    // Withdrawing zero from a zero balance is a no-op, not an overdraft.
    expect(overdraftErrorOrNull(0, 0)).toBeNull();
  });

  it("amount one yen over balance fails (off-by-one tripwire)", () => {
    expect(overdraftErrorOrNull(1000, 1001)).not.toBeNull();
    expect(overdraftErrorOrNull(0, 1)).not.toBeNull();
  });
});

describe("overdraftErrorOrNull — large amounts (no integer overflow)", () => {
  it("¥1,000,000,000 balance covering ¥1,000,000,000 withdrawal → null", () => {
    expect(overdraftErrorOrNull(1_000_000_000, 1_000_000_000)).toBeNull();
  });

  it("formatting handles large numbers without scientific notation", () => {
    const msg = overdraftErrorOrNull(0, 1_000_000_000);
    // The format embeds the raw number; we don't want "1e9" to leak in.
    expect(msg).toContain("¥1000000000");
    expect(msg).not.toContain("e+");
    expect(msg).not.toContain("Infinity");
  });
});

describe("overdraftErrorOrNull — exact message format is a wire contract", () => {
  it("includes the OVERDRAFT_PREFIX at the start, no leading whitespace", () => {
    const msg = overdraftErrorOrNull(0, 100);
    expect(msg).not.toBeNull();
    expect(msg!.startsWith(OVERDRAFT_PREFIX)).toBe(true);
    // First char of message after the prefix should be a space.
    expect(msg![OVERDRAFT_PREFIX.length]).toBe(" ");
  });

  it("embeds both balance and amount with ¥ prefix in canonical order", () => {
    // Canonical order in the message: balance THEN amount.
    // The frontend pattern parses by position, so flipping these would
    // silently render the wrong number in the toast.
    const msg = overdraftErrorOrNull(7, 42);
    expect(msg).toBe("OVERDRAFT: balance ¥7 cannot cover withdrawal ¥42");
    expect(msg!.indexOf("¥7")).toBeLessThan(msg!.indexOf("¥42"));
  });
});

describe("overdraftErrorOrNull — non-positive inputs (defensive contract)", () => {
  it("zero amount is always OK regardless of balance", () => {
    // Withdrawing 0 should never overdraft, even from a zero or large balance.
    expect(overdraftErrorOrNull(0, 0)).toBeNull();
    expect(overdraftErrorOrNull(100, 0)).toBeNull();
    expect(overdraftErrorOrNull(1_000_000, 0)).toBeNull();
  });

  it("negative balance is treated as overdrawable surface (balance < amount)", () => {
    // A negative balance is not a normal state — Convex schema prevents it —
    // but if it ever happens, the predicate should still flag a positive
    // withdrawal as overdraft (negative-balance < positive-amount → true).
    const msg = overdraftErrorOrNull(-50, 1);
    expect(msg).not.toBeNull();
    expect(msg).toMatch(new RegExp(`^${OVERDRAFT_PREFIX}`));
  });
});
