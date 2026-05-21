import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

/**
 * Auth setup for Playwright.
 *
 * Strategy:
 *   1. Use Clerk's `+clerk_test` email pattern. In any Clerk dev instance
 *      with "Test mode" enabled, addresses matching `^[^+]+\+clerk_test@.*$`
 *      auto-verify on sign-up and accept any password.
 *      Docs: https://clerk.com/docs/testing/test-emails-and-phones
 *   2. Try sign-up first. If Clerk reports the user already exists, fall back
 *      to sign-in.
 *   3. Complete onboarding minimally (single child + single job) if redirected
 *      there. If onboarding is already complete, the flow lands on `/` instead.
 *   4. Save Clerk session cookies + localStorage to `e2e/.auth/parent.json`.
 *
 * Verification clue: success = the storageState file exists AND a subsequent
 * `page.goto('/parent')` doesn't redirect to `/sign-in` or `/landing`.
 */

const TEST_EMAIL =
  process.env.PLAYWRIGHT_TEST_EMAIL ?? "qa+clerk_test@pocketmoney.local";
const TEST_PASSWORD =
  process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Clerk-test-pw-9f7c4e2a!";

const AUTH_FILE = path.resolve(__dirname, ".auth/parent.json");

setup("authenticate as parent", async ({ page }) => {
  // Ensure the .auth directory exists.
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // -------------------------------------------------------------------------
  // 1. Try sign-up first.
  // -------------------------------------------------------------------------
  await page.goto("/sign-up");

  // Detect the "Clerk env vars required" fallback. The app renders a static
  // message instead of <SignUp /> when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is
  // not set in the dev process. Surface this as an actionable error rather
  // than a vague locator timeout.
  const clerkMissingMessage = page.getByText(
    /Clerk environment variables are required/i,
  );
  if (await clerkMissingMessage.isVisible().catch(() => false)) {
    throw new Error(
      "Sign-up page is rendering the 'Clerk environment variables are " +
        "required' fallback. The dev server (`npm run dev`) does not have " +
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY set. Add them " +
        "to `.env.local` (from Clerk Dashboard → API Keys), then re-run " +
        "`npx playwright test --project=setup`.",
    );
  }

  // Clerk's <SignUp /> renders an iframe-free form. The email input has
  // name="emailAddress" in the embedded component.
  const emailField = page.locator(
    'input[name="emailAddress"], input[type="email"]',
  );
  await expect(emailField.first()).toBeVisible({ timeout: 20_000 });

  await emailField.first().fill(TEST_EMAIL);

  // Password field — Clerk's default password sign-up renders it on the same
  // step.
  const passwordField = page.locator(
    'input[name="password"], input[type="password"]',
  );
  if ((await passwordField.count()) > 0) {
    await passwordField.first().fill(TEST_PASSWORD);
  }

  // Submit. Clerk's primary button has data attribute we can target; fall
  // back to role-based.
  const continueBtn = page
    .getByRole("button", { name: /continue|sign\s*up|create/i })
    .first();
  await continueBtn.click();

  // -------------------------------------------------------------------------
  // 2. Handle outcomes:
  //    a) Auto-verified → redirect to /onboarding
  //    b) "Email exists" → fall back to /sign-in
  //    c) Email verification screen → bail (test mode not enabled)
  // -------------------------------------------------------------------------
  let signedIn = false;
  try {
    await Promise.race([
      page.waitForURL(/\/onboarding/, { timeout: 15_000 }),
      page.waitForURL("/", { timeout: 15_000 }),
      page.waitForURL(/\/parent/, { timeout: 15_000 }),
    ]);
    signedIn = true;
  } catch {
    // Sign-up didn't auto-complete. Two cases:
    //   - User already exists → try sign-in.
    //   - Verification code prompt → Clerk test mode not enabled, surface it.
    const verificationVisible = await page
      .locator('input[name="code"], input[autocomplete="one-time-code"]')
      .isVisible()
      .catch(() => false);

    if (verificationVisible) {
      throw new Error(
        "Clerk verification code prompt appeared. Clerk Test mode is not " +
          "enabled on this dev instance, so +clerk_test@ emails do not auto-" +
          "verify. Enable Test mode in Clerk Dashboard → User & Authentication → " +
          "Restrictions, OR set PLAYWRIGHT_TEST_EMAIL/PASSWORD to a pre-created " +
          "test user.",
      );
    }

    // Try sign-in fallback.
    await page.goto("/sign-in");
    const siEmail = page.locator(
      'input[name="identifier"], input[name="emailAddress"], input[type="email"]',
    );
    await expect(siEmail.first()).toBeVisible({ timeout: 20_000 });
    await siEmail.first().fill(TEST_EMAIL);
    await page
      .getByRole("button", { name: /continue|sign\s*in/i })
      .first()
      .click();

    const siPassword = page.locator(
      'input[name="password"], input[type="password"]',
    );
    if (
      await siPassword
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false)
    ) {
      await siPassword.first().fill(TEST_PASSWORD);
      await page
        .getByRole("button", { name: /continue|sign\s*in/i })
        .first()
        .click();
    }

    await Promise.race([
      page.waitForURL(/\/onboarding/, { timeout: 20_000 }),
      page.waitForURL("/", { timeout: 20_000 }),
      page.waitForURL(/\/parent/, { timeout: 20_000 }),
    ]);
    signedIn = true;
  }

  if (!signedIn) {
    throw new Error("Could not authenticate via sign-up or sign-in.");
  }

  // -------------------------------------------------------------------------
  // 3. Complete onboarding if we landed there.
  // -------------------------------------------------------------------------
  if (page.url().includes("/onboarding")) {
    // Step 0: Welcome → "Get started"
    await page.getByRole("button").first().click();

    // Step 1: Add child. Look for the first text input + first icon button.
    const childNameInput = page.locator('input[type="text"]').first();
    await expect(childNameInput).toBeVisible({ timeout: 10_000 });
    await childNameInput.fill("QA Kid");

    // Click first available icon (the 4-column grid of icon buttons).
    const iconButtons = page.locator("button:has(span.text-3xl)");
    await iconButtons.first().click();

    // Next.
    await page.getByRole("button", { name: /next|続/i }).click();

    // Step 2: Add job. First text input is job title.
    const jobNameInput = page.locator('input[type="text"]').first();
    await expect(jobNameInput).toBeVisible({ timeout: 10_000 });
    await jobNameInput.fill("Tidy room");

    await page.getByRole("button", { name: /next|続/i }).click();

    // Step 3: Confirm → Start adventure.
    await page
      .getByRole("button", { name: /start|adventure|冒険|始/i })
      .click();

    // Land somewhere stable.
    await page.waitForURL((url) => !url.toString().includes("/onboarding"), {
      timeout: 30_000,
    });
  }

  // -------------------------------------------------------------------------
  // 4. Persist storageState.
  // -------------------------------------------------------------------------
  await page.context().storageState({ path: AUTH_FILE });
});
