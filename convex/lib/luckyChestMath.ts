/**
 * Pure lucky chest math — NO Convex imports, NO `ctx`.
 *
 * Why pure: extracted from `convex/functions/luckyChests.ts` (mutation `open`)
 * so the RNG-driven payout formula is testable without spinning up a Convex
 * backend. The mutation continues to default the per-user cap at the call
 * site (`user.luckyChestMaxAmount ?? 100`); this helper assumes a resolved
 * integer cap and throws on garbage input.
 *
 * Range contract:
 *   pickLuckyChestAmount(maxAmount) → integer in [1, maxAmount]
 *
 * Why `[1, maxAmount]`: matches the previous inline formula
 *   Math.max(1, Math.floor(Math.random() * maxAmount) + 1)
 * `Math.floor(rand * N)` is `[0, N-1]`; the `+ 1` shifts to `[1, N]`. The
 * outer `Math.max(1, …)` was defensive belt-and-suspenders (a no-op when
 * `maxAmount >= 1`, which we now enforce by validation).
 *
 * RNG is injectable so tests can pin distribution behavior deterministically.
 * Production code passes nothing → defaults to `Math.random`.
 */

const MAX_LUCKY_CHEST_CAP = 10_000;

/**
 * Pick a random lucky-chest payout in `[1, maxAmount]`.
 *
 * @param maxAmount Upper bound (inclusive). Must be an integer in
 *   `[1, ${MAX_LUCKY_CHEST_CAP}]`.
 * @param rng `() => number` returning a value in `[0, 1)`. Defaults to
 *   `Math.random`. Tests inject a deterministic counter-RNG.
 * @throws if `maxAmount` is not a number, not an integer, < 1, or > the cap.
 */
export function pickLuckyChestAmount(
  maxAmount: number,
  rng: () => number = Math.random,
): number {
  if (typeof maxAmount !== "number" || !Number.isInteger(maxAmount)) {
    throw new Error(
      `pickLuckyChestAmount: maxAmount must be an integer, got ${String(maxAmount)}`,
    );
  }
  if (maxAmount < 1) {
    throw new Error(
      `pickLuckyChestAmount: maxAmount must be >= 1, got ${maxAmount}`,
    );
  }
  if (maxAmount > MAX_LUCKY_CHEST_CAP) {
    throw new Error(
      `pickLuckyChestAmount: maxAmount must be <= ${MAX_LUCKY_CHEST_CAP}, got ${maxAmount}`,
    );
  }
  return Math.floor(rng() * maxAmount) + 1;
}

/**
 * QA-2026-06-06 (F2 hardening): clamp a stored/read `luckyChestMaxAmount` into
 * the safe range so `pickLuckyChestAmount` can NEVER throw out-of-bounds — even
 * for a legacy value persisted before the setter enforced the cap.
 *
 * - non-finite / <= 0 → `0` (treated as "disabled / not set" by `open`)
 * - otherwise → `min(floor(value), MAX_LUCKY_CHEST_CAP)`
 *
 * Read-time defense in depth: the `setLuckyChestMaxAmount` mutation rejects
 * out-of-range NEW writes, but rows written before that guard shipped may still
 * hold e.g. 50000. `luckyChests.open` / `getStatusForFamily` pass the read
 * value through here so the kid never sees a raw error.
 */
export function clampLuckyChestMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.floor(value), MAX_LUCKY_CHEST_CAP);
}

export const __testing__ = { MAX_LUCKY_CHEST_CAP };
