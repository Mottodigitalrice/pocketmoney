/**
 * Regression spec: fresh signup → onboarding → home loads.
 *
 * This is the EXACT flow that was broken (home page stuck on AppSkeleton / the
 * pirate error boundary / bouncing back to /onboarding after a brand-new
 * signup). It proves an end-to-end fresh account reaches the character-select
 * grid.
 *
 * ## How to run
 *
 *   npm run test:e2e -- signup-to-home
 *   # or, pin the project:
 *   npx playwright test e2e/signup-to-home.spec.ts --project=chromium
 *
 * ## Requirements
 *
 *   - Clerk TEST-MODE keys in `.env.local`:
 *       NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_test_…) + CLERK_SECRET_KEY (sk_test_…)
 *   - Clerk "Test mode" enabled so `+clerk_test@` emails auto-verify with the
 *     fixed OTP `424242` (Clerk docs: testing/test-emails-and-phones).
 *   - NEXT_PUBLIC_CONVEX_URL pointing at a dev Convex deployment.
 *
 * ## Why it does NOT reuse storageState
 *
 * Every other project in `playwright.config.ts` loads
 * `e2e/.auth/parent.json` (a pre-authed parent) and depends on the `setup`
 * project. This spec needs a genuinely UNAUTHENTICATED, brand-new browser
 * context so it can drive Clerk's real sign-up form. We override storageState
 * to empty below. (The `chromium`/`mobile` projects still list `setup` as a
 * dependency, so `setup` will run first — but its saved state is discarded for
 * THIS file by the `test.use` override, and the fresh signup creates its own
 * Clerk session.)
 *
 * Each run uses a UNIQUE `+clerk_test` email (timestamp + random suffix) so it
 * is a truly fresh signup with no pre-existing Convex user row — exercising the
 * provisioning handshake that the bug lived in. It depends on no real inbox.
 */

import { test, expect } from "@playwright/test";

// Brand-new, unauthenticated context — discard any saved parent storageState.
test.use({ storageState: { cookies: [], origins: [] } });

// Clerk test-mode fixed verification code. Matches auth.setup.ts's pattern of
// relying on Clerk Test mode for `+clerk_test` addresses.
const CLERK_TEST_OTP = "424242";

const TEST_PASSWORD =
  process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Clerk-test-pw-9f7c4e2a!";

/** A unique `+clerk_test` email so each run is a fresh, never-seen account. */
function uniqueTestEmail(): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `qa.signup.${suffix}+clerk_test@pocketmoney.local`;
}

test("fresh signup → onboarding → home renders the character-select grid (no skeleton / error / bounce)", async ({
  page,
}) => {
  const email = uniqueTestEmail();
  const crewName = "Captain Junior";

  // Pin the app to English BEFORE any page script runs. LanguageProvider reads
  // `localStorage["pocketmoney-lang"]` on first render and DEFAULTS TO JAPANESE
  // when it's unset (see src/components/providers/LanguageProvider.tsx). The
  // positive/negative assertions below are English-string-dependent ("Who are
  // you?", "Mummy & Daddy", "Try Again"); under the JA default the positives
  // fail for the wrong reason and the "Try Again" negative would silently
  // false-pass (the JA label never matches). Seeding the key here boots the app
  // in English so every text assertion is meaningful. (The locale-independent
  // `[data-testid="app-skeleton"]` negative assertion doesn't depend on this.)
  await page.addInitScript(() => {
    window.localStorage.setItem("pocketmoney-lang", "en");
  });

  await test.step("1. Open /sign-up (not the env-missing fallback)", async () => {
    await page.goto("/sign-up");

    // Surface the "Clerk env vars required" static fallback as an actionable
    // error instead of a vague locator timeout (mirrors auth.setup.ts).
    const clerkMissing = page.getByText(
      /Clerk environment variables are required/i,
    );
    if (await clerkMissing.isVisible().catch(() => false)) {
      throw new Error(
        "Sign-up page is rendering the 'Clerk environment variables are " +
          "required' fallback. The dev server lacks " +
          "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY. Add Clerk " +
          "TEST-MODE keys to .env.local and re-run.",
      );
    }
  });

  await test.step("2. Complete Clerk signup with a fresh +clerk_test email", async () => {
    // Clerk's <SignUp /> renders email as name="emailAddress".
    const emailField = page.locator(
      'input[name="emailAddress"], input[type="email"]',
    );
    await expect(emailField.first()).toBeVisible({ timeout: 20_000 });
    await emailField.first().fill(email);

    // Password is on the same step in Clerk's default password sign-up.
    const passwordField = page.locator(
      'input[name="password"], input[type="password"]',
    );
    if ((await passwordField.count()) > 0) {
      await passwordField.first().fill(TEST_PASSWORD);
    }

    await page
      .getByRole("button", { name: /continue|sign\s*up|create/i })
      .first()
      .click();
  });

  await test.step("3. Handle the verify-code step (Clerk test OTP 424242)", async () => {
    // In Clerk Test mode, `+clerk_test` addresses present an OTP screen that
    // accepts the fixed code 424242. Some configs auto-verify and skip
    // straight to /onboarding — so the code step is best-effort.
    const codeInput = page
      .locator('input[name="code"], input[autocomplete="one-time-code"]')
      .first();

    const codeVisible = await codeInput
      .isVisible({ timeout: 8_000 })
      .catch(() => false);

    if (codeVisible) {
      // Clerk may render one input or a split 6-box OTP. Try the single
      // input first; fall back to filling each segment.
      await codeInput.fill(CLERK_TEST_OTP).catch(async () => {
        const segments = page.locator('input[autocomplete="one-time-code"]');
        const n = await segments.count();
        for (let i = 0; i < n; i++) {
          await segments.nth(i).fill(CLERK_TEST_OTP[i] ?? "");
        }
      });

      // Some Clerk themes auto-submit on the last digit; click Continue if a
      // submit button is still present.
      const continueBtn = page
        .getByRole("button", { name: /continue|verify|sign\s*up/i })
        .first();
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click().catch(() => {});
      }
    }
  });

  await test.step("4. Land on /onboarding (the configured after-sign-up URL)", async () => {
    await page.waitForURL(/\/onboarding/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/onboarding/);
  });

  await test.step("5. Walk onboarding: add ONE crew member, then finish", async () => {
    // Step 0 — Welcome → "Get started" (first button on the welcome step).
    await page.getByRole("button").first().click();

    // Step 1 — Add child. The first text input is the crew-member name.
    const childNameInput = page.locator('input[type="text"]').first();
    await expect(childNameInput).toBeVisible({ timeout: 10_000 });
    await childNameInput.fill(crewName);

    // Pick the first available icon. IconPicker buttons each contain a
    // `<span class="text-3xl">` emoji (see onboarding/page.tsx IconPicker).
    await page.locator("button:has(span.text-3xl)").first().click();

    // Next → step 2 (Add Jobs).
    await page.getByRole("button", { name: /next|次|続/i }).click();

    // Step 2 — Skip custom jobs (seedDefaults() always runs on save). Uses the
    // stable testid from onboarding/page.tsx, then Next.
    await page.getByTestId("onboarding-skip-jobs").click();
    await page.getByTestId("onboarding-jobs-next").click();

    // Step 3 — Confirm → "Start adventure". Label varies by locale, so match
    // the start/adventure/冒険/始 family (same as auth.setup.ts).
    await page
      .getByRole("button", { name: /start|adventure|冒険|始/i })
      .click();
  });

  await test.step("6. Redirect off /onboarding to the home page (no bounce-back)", async () => {
    // handleComplete plays a ~2s celebration then router.push('/'). Allow
    // generous time, and assert we leave /onboarding for good.
    await page.waitForURL((url) => !url.pathname.includes("/onboarding"), {
      timeout: 30_000,
    });
    await expect(page).toHaveURL(/\/$|\/\?/, { timeout: 10_000 });
  });

  await test.step("7. Home renders the character-select grid (parent + crew member)", async () => {
    // Positive proof the home grid hydrated: the "Who are you?" prompt and the
    // parent card subtitle ("The Pirate Crew") plus the crew member's name.
    await expect(page.getByText(/Who are you\?/i)).toBeVisible({
      timeout: 20_000,
    });

    // Parent card — name "Mummy & Daddy" / subtitle "The Pirate Crew".
    await expect(
      page.getByRole("heading", { name: /Mummy & Daddy/i }),
    ).toBeVisible({ timeout: 15_000 });

    // The crew member we added must appear as its own character card.
    await expect(
      page.getByRole("heading", { name: new RegExp(crewName, "i") }),
    ).toBeVisible({ timeout: 15_000 });
  });

  await test.step("8. NEGATIVE: not skeleton, not error boundary, not bounced", async () => {
    // (a) AppSkeleton must NOT be on screen after load. It renders
    //     data-testid="app-skeleton" with role="status" aria-busy.
    await expect(page.locator('[data-testid="app-skeleton"]')).toHaveCount(0);

    // (b) The pirate error.tsx boundary must NOT be showing. Its single CTA is
    //     "Try Again" (error_page_cta). Assert that button is absent.
    await expect(
      page.getByRole("button", { name: /^Try Again$/i }),
    ).toHaveCount(0);

    // (c) We must NOT have bounced back to /onboarding (the original bug: a
    //     freshly-onboarded user with no children hydrated yet → redirect loop).
    await expect(page).not.toHaveURL(/\/onboarding/);
  });
});
