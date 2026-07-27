import { describe, it, expect } from "vitest";
import { api, internal } from "../convex/_generated/api";

/**
 * SEC-2026-07-18 — API-surface lock.
 *
 * Ops-only functions must live on `internal` (dashboard / `npx convex run`
 * only), NEVER on the public `api` where any authenticated client could call
 * them. Convex types `api` as the PUBLIC slice and `internal` as the internal
 * slice, so these are COMPILE-TIME guards: if any function is reverted to a
 * public `mutation`/`query`, its `@ts-expect-error` below becomes unused and
 * `npm run typecheck` fails. The runtime body is a trivial reference sanity
 * check (convex-test does not enforce the public/internal boundary at runtime,
 * so the type layer is the real guarantee).
 *
 * Locks:
 *   - audit.deleteOrphanedProofs  (cross-tenant proof-blob deletion)
 *   - audit.findOrphanedProofs    (cross-tenant storage inventory disclosure)
 *   - wallets.migrateLegacyEarnings (double-credits a normal family)
 */
describe("internal API surface (SEC-2026-07-18)", () => {
  it("exposes the ops functions on `internal`", () => {
    expect(internal.functions.audit.deleteOrphanedProofs).toBeDefined();
    expect(internal.functions.audit.findOrphanedProofs).toBeDefined();
    expect(internal.functions.wallets.migrateLegacyEarnings).toBeDefined();
  });

  it("keeps the ops functions OFF the public `api` (compile-time)", () => {
    // @ts-expect-error — must NOT be publicly callable
    void api.functions.audit.deleteOrphanedProofs;
    // @ts-expect-error — must NOT be publicly callable
    void api.functions.audit.findOrphanedProofs;
    // @ts-expect-error — must NOT be publicly callable
    void api.functions.wallets.migrateLegacyEarnings;

    // Sanity: a genuinely-public function IS still on the public api.
    expect(api.functions.luckyChests.open).toBeDefined();
  });
});
