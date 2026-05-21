/**
 * F20 — Mobile pass spec scaffold.
 *
 * Runs against the `mobile` Playwright project (iPhone 13, WebKit) defined
 * in `playwright.config.ts`. Three sub-tests:
 *
 *   1. Parent dashboard renders without horizontal scroll at 390px.
 *   2. BonusDialog with keyboard up: submit CTA stays visible.
 *   3. ApprovalCard proof image opens full-screen on tap.
 *
 * Status: AUTHORED, NOT YET EXECUTED.
 *
 * Blocker (F7): Clerk env vars missing from `.env.local`. `auth.setup.ts`
 * can't establish a parent session, so these tests are gated behind
 * `test.skip(true, ...)` until Clerk is wired in. To enable:
 *
 *   1. Populate NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY in
 *      `.env.local`
 *   2. Remove the `test.skip(true, ...)` line at the top of each block
 *   3. `npx playwright test e2e/mobile.spec.ts --project=mobile`
 *
 * Notes:
 *   - The iPhone 13 device profile uses 390×844 viewport which matches
 *     iPhone 13/14/15 — the kid/parent surface area F20 targets.
 *   - Test 2 simulates an iOS-keyboard-up scenario by shrinking the
 *     visual viewport via `page.setViewportSize`. Real keyboard events
 *     are not faked because WebKit Playwright doesn't expose the
 *     visualViewport API the same way iOS Safari does — the height
 *     check on the submit button is the load-bearing assertion.
 *   - Test 3 requires a pending-approval seed. We piggyback on the same
 *     `e2e:seedKidScenario` helper as a11y.spec.ts and parent-happy-path.
 */

import { test, expect } from "@playwright/test";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

test.describe("F20 mobile pass", () => {
  test("parent dashboard renders without horizontal scroll at 390px", async ({
    page,
  }) => {
    test.skip(true, "Awaiting Clerk keys in .env.local (F7 blocker)");

    await page.goto("/parent");
    await expect(page).toHaveURL(/\/parent/, { timeout: 15_000 });

    // Wait for the dashboard shell to settle.
    await page.waitForLoadState("networkidle");

    // Body should not be wider than the viewport. iOS Safari treats
    // horizontal overflow as a UX bug — it causes the page to feel
    // "broken" with two-finger pans.
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(
      scrollWidth,
      `Horizontal scroll detected: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`,
    ).toBeLessThanOrEqual(clientWidth);
  });

  test("BonusDialog keeps submit CTA visible with keyboard up", async ({
    page,
  }) => {
    test.skip(true, "Awaiting Clerk keys in .env.local (F7 blocker)");

    await page.goto("/parent");
    await expect(page).toHaveURL(/\/parent/, { timeout: 15_000 });

    // Need at least one child for BonusDialog to render — seed one.
    expect(CONVEX_URL, "NEXT_PUBLIC_CONVEX_URL must be set").toBeTruthy();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await page.evaluate(
      async ({ date, convexUrl }) => {
        const w = window as unknown as {
          Clerk?: { session?: { getToken?: () => Promise<string> } };
        };
        const token = (await w.Clerk?.session?.getToken?.()) ?? "";
        const res = await fetch(`${convexUrl}/api/mutation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            path: "functions/e2e:seedKidScenario",
            args: [
              {
                childName: "F20 Test",
                childIcon: "dolphin",
                childAge: 8,
                jobTitle: "Read 10 minutes",
                jobIcon: "📚",
                jobYenAmount: 100,
                jobRequiresPhotoProof: false,
                date,
                priority: "optional",
              },
            ],
            format: "convex_encoded_json",
          }),
        });
        if (!res.ok) throw new Error(`seedKidScenario: ${res.status}`);
      },
      { date: todayStr, convexUrl: CONVEX_URL },
    );

    // Navigate to the wallet tab where Bonus button lives.
    await page.goto("/parent#children");
    await page
      .getByRole("button", { name: /bonus|ボーナス/i })
      .first()
      .click();

    // Dialog should be visible.
    const dialog = page.locator('[data-slot="dialog-content"]');
    await expect(dialog).toBeVisible();

    // Submit button (the inner-form submit) should be visible BEFORE we
    // shrink the viewport.
    const submitBtn = dialog.getByRole("button", {
      name: /save|ok|あげる|送る/i,
    });
    await expect(submitBtn).toBeVisible();

    // Focus the first text input — on real iOS this would raise the
    // keyboard. We can't fire the iOS keyboard in WebKit Playwright, but
    // we can shrink the visual viewport to simulate the resulting
    // squeeze. iPhone 13 keyboard takes ~336px of 844px ≈ 508px usable.
    await dialog.locator('input[type="number"]').first().focus();
    await page.setViewportSize({ width: 390, height: 508 });

    // After the squeeze, the submit button MUST still be reachable.
    // It lives in DialogFooter which is fixed at the bottom of the
    // dialog with safe-area-inset-bottom padding (F20 Goal B).
    await expect(submitBtn).toBeVisible();

    // Verify the submit button's bounding box is within the viewport.
    const box = await submitBtn.boundingBox();
    expect(box, "submit button must have a bounding box").not.toBeNull();
    if (box) {
      expect(
        box.y + box.height,
        `submit CTA bottom (${box.y + box.height}) exceeds viewport (508)`,
      ).toBeLessThanOrEqual(508);
    }
  });

  test("ApprovalCard proof opens full-screen on tap", async ({ page }) => {
    test.skip(true, "Awaiting Clerk keys in .env.local (F7 blocker)");

    // Seed a pending-approval instance with a proof URL. The exact
    // seeding helper depends on whether `e2e:seedPendingApproval` exists;
    // we assume parent-happy-path's existing seeded flow can be reused.
    // If not, this test will need a dedicated convex seed helper.
    await page.goto("/parent#approvals");
    await expect(page).toHaveURL(/\/parent/, { timeout: 15_000 });

    // Wait for at least one approval card with a proof button.
    const proofBtn = page
      .locator('[data-testid="approval-card-proof-button"]')
      .first();
    await expect(
      proofBtn,
      "test requires a pending approval with proof — seed before running",
    ).toBeVisible({ timeout: 15_000 });

    // Preview overlay should NOT exist yet.
    await expect(
      page.locator('[data-testid="approval-card-proof-preview"]'),
    ).toHaveCount(0);

    // Tap to open.
    await proofBtn.click();

    const preview = page.locator('[data-testid="approval-card-proof-preview"]');
    await expect(preview).toBeVisible();
    // role=dialog + aria-modal — minimal a11y contract.
    await expect(preview).toHaveAttribute("role", "dialog");
    await expect(preview).toHaveAttribute("aria-modal", "true");

    // ESC dismisses.
    await page.keyboard.press("Escape");
    await expect(preview).toHaveCount(0);

    // Re-open and verify click-outside-image dismisses.
    await proofBtn.click();
    await expect(preview).toBeVisible();
    // Click the overlay backdrop (top-left corner is outside any image).
    await preview.click({ position: { x: 5, y: 5 } });
    await expect(preview).toHaveCount(0);

    // Re-open and verify the close button works.
    await proofBtn.click();
    await expect(preview).toBeVisible();
    await page
      .locator('[data-testid="approval-card-proof-preview-close"]')
      .click();
    await expect(preview).toHaveCount(0);
  });
});
