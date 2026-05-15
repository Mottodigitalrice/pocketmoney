/**
 * F12 — Error-path Playwright spec.
 *
 * Verifies that the typed Convex error mapper (`src/lib/convex-errors.ts`)
 * surfaces user-facing strings instead of raw error codes for:
 *   1. Network failure (stubbed 503) on approve → friendly network toast.
 *   2. Overdraft on withdraw → friendly "not enough treasure" string.
 *   3. LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK on open → friendly weekly-lock
 *      string, NOT the raw code.
 *
 * Status: AUTHORED, SKIPPED.
 * Blocker: F7 — `.env.local` is missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
 * and `CLERK_SECRET_KEY`. The harness cannot run `auth.setup.ts` to produce
 * `e2e/.auth/parent.json`, so any test that depends on the chromium project
 * is gated. Once those keys land, remove `test.skip` on each case and run:
 *
 *   npx playwright test e2e/error-paths.spec.ts --project=chromium
 *
 * Strategy notes per case:
 *   - Network: use `page.route()` to intercept the Convex mutation HTTP call
 *     and respond with 503 once, then pass through.
 *   - Overdraft: seed a child with ¥0 balance, attempt withdraw ¥50, assert
 *     that the WithdrawalDialog error region shows the mapped friendly
 *     string. We assert text contains "treasure" / "つぼ" (the i18n key
 *     `error_overdraft`) rather than `"OVERDRAFT:"` (raw).
 *   - Lucky Chest: seed a child with the chest already opened this week
 *     via the e2e Convex helper (analogous to `setJobInstanceCompleted` in
 *     parent-happy-path.spec.ts), then tap open and assert the rendered
 *     error matches the friendly key, not the raw code.
 */

import { test, expect } from "@playwright/test";

test.describe("F12 — error paths", () => {
  test.skip(
    "approve fails with 503 → toast shows friendly network message",
    async ({ page }) => {
      // Stub the first Convex mutation request with a 503, then pass through.
      let stubbed = false;
      await page.route("**/api/mutation", async (route) => {
        if (!stubbed) {
          stubbed = true;
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ message: "Service Unavailable" }),
          });
          return;
        }
        await route.continue();
      });

      await page.goto("/parent#approvals");
      // Click any pending Approve button.
      const approveBtn = page
        .locator('[data-testid="approval-card"]')
        .first()
        .getByRole("button", { name: /Approve/i });
      await approveBtn.click();

      // Mapped network message — never the raw "503" or "Service Unavailable".
      const region = page.locator('[data-testid="approval-error"]').first();
      await expect(region).toContainText(/connection|reach the ship|つながら/i, {
        timeout: 5_000,
      });
      await expect(region).not.toContainText(/503|Service Unavailable/i);
    }
  );

  test.skip(
    "withdraw above balance → mapped overdraft message, not raw OVERDRAFT: code",
    async ({ page }) => {
      await page.goto("/parent#overview");
      const overview = page.locator('[data-testid="child-overview"]').first();
      await overview.getByRole("button", { name: /Withdraw/i }).click();

      // Type a large number.
      const amountField = page.getByPlaceholder("500");
      await amountField.fill("999999");
      await page.getByRole("button", { name: /Record Withdrawal/i }).click();

      // The error region should show the mapped string (contains "treasure"
      // or "つぼ"), NEVER the raw "OVERDRAFT:" prefix the backend throws.
      const err = page.locator('[data-testid="withdraw-error"]');
      await expect(err).toBeVisible({ timeout: 5_000 });
      await expect(err).not.toContainText(/OVERDRAFT:/);
      await expect(err).toContainText(/treasure|たからもの|enough/i);
    }
  );

  test.skip(
    "lucky chest second open → mapped already-opened message, not raw code",
    async ({ page }) => {
      // Pre-condition: open the chest once via the kid UI, then navigate to
      // a different child and back so we can attempt a second open. For the
      // simpler path, this test relies on a seed helper to set
      // openedAt to last Monday's timestamp (handled by an e2e helper
      // analogous to setJobInstanceCompleted — not yet implemented).
      await page.goto("/kid/CHILD_ID_PLACEHOLDER");
      const openBtn = page.locator('[data-testid="lucky-chest-open-button"]');
      await openBtn.click();

      const err = page.locator('[data-testid="lucky-chest-error"]');
      await expect(err).toBeVisible({ timeout: 5_000 });
      await expect(err).not.toContainText(/LUCKY_CHEST_ALREADY_OPENED/);
      await expect(err).toContainText(
        /already opened|Monday|月曜|今週はもう/i
      );
    }
  );
});
