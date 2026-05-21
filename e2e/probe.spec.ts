import { test, expect } from "@playwright/test";

/**
 * Probe test — proves the saved Clerk session works end-to-end.
 *
 * If this passes, F7's harness is healthy:
 *   - storageState was successfully written by auth.setup.ts
 *   - Clerk recognises the cookie
 *   - Middleware doesn't redirect to /sign-in or /landing
 *   - The parent dashboard renders authenticated UI
 */
test("authenticated parent can reach /parent without redirect", async ({
  page,
}) => {
  await page.goto("/parent");

  // Critical: we must NOT have been bounced to /sign-in or /landing.
  await expect(page).toHaveURL(/\/parent/, { timeout: 10_000 });

  // Robust assertion: the parent tab bar always renders one of the tab buttons.
  // Use a flexible matcher so this is resilient to copy changes.
  const anyParentTab = page
    .getByRole("button")
    .filter({
      hasText:
        /quick|approv|plan|job|overview|child|追加|承認|計画|仕事|概要|子供/i,
    });

  await expect(anyParentTab.first()).toBeVisible({ timeout: 15_000 });
});
