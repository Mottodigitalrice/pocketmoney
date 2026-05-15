/**
 * F8 — Parent happy-path spec.
 *
 * Drives the full parent flow end-to-end as a single test broken into
 * `test.step()` sub-steps. Reuses the Clerk session storageState saved by
 * `auth.setup.ts`.
 *
 * Status: AUTHORED, NOT YET EXECUTED.
 * Blocker (F7): `.env.local` is missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
 * and `CLERK_SECRET_KEY`. The harness can't run auth.setup.ts until those
 * are added and Clerk Test mode is enabled. To run once those land:
 *
 *   npx playwright test e2e/parent-happy-path.spec.ts --project=chromium
 *
 * ## Strategy
 *
 * The parent dashboard tab-routes via URL hash (`/parent#approvals`,
 * `/parent#planner`, etc.). We drive tabs by clicking the tab buttons in
 * the top bar — that's what real parents do, and it exercises the full
 * routing path.
 *
 * Step 5 ("mark complete") uses a DEV-ONLY Convex helper —
 * `api.functions.e2e.setJobInstanceCompleted` — to flip an in-progress
 * jobInstance to "completed" without going through the kid-side UI. The
 * helper is guarded by an env check (`CONVEX_DEPLOYMENT` must start with
 * `dev:`) so this is impossible in prod. This avoids spawning a second
 * BrowserContext just to drive a kid dashboard for one mutation.
 */

import { test, expect, type Page } from "@playwright/test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

/**
 * Helper: read the in-progress jobInstance id for a given child by querying
 * Convex directly via cookie-passed identity. Falls back to scraping the DOM
 * if the Convex query path doesn't have the right auth claim shape.
 *
 * In practice, the simpler path is: scrape `data-instance-id` from the
 * `[data-testid="job-card"][data-status="in_progress"]` element on the kid
 * dashboard. But this spec is parent-side, so we read it via Convex.
 */
async function getInProgressInstanceIdViaDom(
  page: Page,
  childId: string
): Promise<string> {
  // Navigate to kid dashboard briefly to scrape the instance id.
  await page.goto(`/kid/${childId}`);
  const card = page
    .locator('[data-testid="job-card"][data-status="in_progress"]')
    .first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  const id = await card.getAttribute("data-instance-id");
  expect(id, "in-progress job card must expose data-instance-id").toBeTruthy();
  return id!;
}

test("parent: full happy-path (create child → job → schedule → approve → wallet ops → delete)", async ({
  page,
}) => {
  // Identifiers we'll capture for later steps.
  const childName = "Zoe";
  const jobName = "Make bed";
  let zoeId = "";
  let jobInstanceId = "";

  await test.step("1. Land on /parent already onboarded", async () => {
    await page.goto("/parent");
    await expect(page).toHaveURL(/\/parent/);
    // Tab bar should be visible — proves auth + onboarding complete.
    await expect(
      page.getByRole("button", { name: /Crew|👥|crew/i }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  await test.step("2. Create child 'Zoe' (age 7, icon shark)", async () => {
    // Open Children tab.
    await page
      .getByRole("button", { name: /Crew|crew/i })
      .first()
      .click();

    // Click "Add Child" button (or "+ Add Crew Member" if list empty).
    const addBtn = page
      .getByRole("button", { name: /\+\s*Add\s*(Child|Crew\s*Member)/i })
      .first();
    await expect(addBtn).toBeVisible({ timeout: 5_000 });
    await addBtn.click();

    // Fill name in the ChildForm dialog.
    const nameField = page.getByPlaceholder(/Enter their name/i);
    await expect(nameField).toBeVisible({ timeout: 5_000 });
    await nameField.fill(childName);

    // Shark is the first icon in CHILD_ICON_CONFIG and is selected by
    // default, but click it explicitly to be deterministic. The label
    // "Shark" comes from CHILD_ICON_CONFIG.shark.label.
    const sharkBtn = page.getByRole("button", { name: /shark/i }).first();
    if (await sharkBtn.isVisible().catch(() => false)) {
      await sharkBtn.click();
    }

    // Submit.
    await page
      .getByRole("button", { name: /Add to Crew|Save Changes/i })
      .click();

    // Assert Zoe row appears.
    const zoeRow = page.locator(
      `[data-testid="child-row"][data-child-name="${childName}"]`
    );
    await expect(zoeRow).toBeVisible({ timeout: 10_000 });
    zoeId = (await zoeRow.getAttribute("data-child-id")) ?? "";
    expect(zoeId).toBeTruthy();
  });

  await test.step("3. Create job 'Make bed' worth ¥100", async () => {
    // Switch to Jobs tab.
    await page.getByRole("button", { name: /Jobs/i }).first().click();

    // New Job button.
    await page.getByRole("button", { name: /\+\s*New Job/i }).click();

    // Fill job name.
    const titleField = page
      .locator('input[type="text"]')
      .first();
    await expect(titleField).toBeVisible({ timeout: 5_000 });
    await titleField.fill(jobName);

    // Set yen to 100 (default is 100, but be explicit).
    const yenField = page.locator('input[type="number"]').first();
    await yenField.fill("100");

    // Submit — button label is from t('job_form_add') = "Add Job" in en.
    await page
      .getByRole("button", { name: /^(Add Job|Save Job)$/i })
      .click();

    // Assert job appears in the list (title text "Make bed").
    await expect(page.getByText(jobName, { exact: false }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  await test.step("4. Assign Make bed to Zoe today as mustDo via WeekPlanner", async () => {
    // Switch to Planner tab.
    await page.getByRole("button", { name: /Planner/i }).first().click();

    // Wait for planner grid to render — look for any planner cell.
    await expect(
      page.locator('[data-testid="planner-cell"]').first()
    ).toBeVisible({ timeout: 10_000 });

    // Select the "Make bed" job in the bulk-job picker.
    await page
      .getByRole("button", { name: new RegExp(jobName, "i") })
      .first()
      .click();

    // Set priority to "Must do".
    await page.getByRole("button", { name: /Must do/i }).first().click();

    // Today's date as YYYY-MM-DD (matches getLocalDateString format).
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Click the "Add selected" button for today's column.
    await page
      .locator(
        `[data-testid="planner-add-selected"][data-date="${todayStr}"]`
      )
      .click();

    // Assert: Zoe's row × today's column contains "Make bed".
    const zoeTodayCell = page.locator(
      `[data-testid="planner-cell"][data-child-id="${zoeId}"][data-date="${todayStr}"]`
    );
    await expect(zoeTodayCell.getByText(jobName, { exact: false })).toBeVisible(
      { timeout: 5_000 }
    );
  });

  await test.step("5. Mark complete via DEV-ONLY Convex helper", async () => {
    // The parent dashboard doesn't have a "mark this kid's job complete"
    // surface — that's a kid action. We have three options:
    //   (a) Spawn a second BrowserContext, navigate to /kid/[id], click
    //       Start then Complete. Cost: ~10s + two requests + duplicate
    //       JobCard/Kanban code paths.
    //   (b) Use a DEV-ONLY Convex helper to set status=completed directly.
    //       Cost: one mutation call.
    //   (c) Hit the kid dashboard in the SAME context (parent is already
    //       authed, the page is parent-gated only by Clerk session not by
    //       URL ownership) and drive the kanban.
    //
    // We pick (c) for the realistic UI path AND (b) as a fallback if the
    // kid dashboard kanban isn't rendering — net result is the spec proves
    // the full pipeline. The contract for F8 is "wallet credits and
    // approvals work end-to-end", not "kid UI works" (that's F9).

    // First start the job via kid dashboard.
    await page.goto(`/kid/${zoeId}`);

    // Wait for kanban to render with the available job.
    const startBtn = page
      .locator('[data-testid="job-card"][data-status="available"]')
      .first()
      .getByRole("button", { name: /Let's Do It|Start|💪/i });
    await expect(startBtn).toBeVisible({ timeout: 15_000 });
    await startBtn.click();

    // Wait for it to move to "in_progress".
    const inProgressCard = page
      .locator('[data-testid="job-card"][data-status="in_progress"]')
      .first();
    await expect(inProgressCard).toBeVisible({ timeout: 10_000 });
    jobInstanceId =
      (await inProgressCard.getAttribute("data-instance-id")) ?? "";
    expect(jobInstanceId, "instance id must be captured").toBeTruthy();

    // Use the DEV-ONLY helper to flip to completed without going through
    // the JobCard "I Did It" button (skips photo-proof code path and any
    // celebration overlay race conditions).
    //
    // We POST to the Convex HTTP API directly with the Clerk JWT pulled
    // from window.Clerk.session.getToken(). The page is already authed
    // (storageState was loaded), so Clerk's window object is hydrated.
    // CONVEX_URL is passed in from test scope — `process.env.NEXT_PUBLIC_*`
    // is inlined at Next.js build time, so it's not readable from
    // page.evaluate without explicit injection.
    expect(CONVEX_URL, "NEXT_PUBLIC_CONVEX_URL must be set").toBeTruthy();
    await page.evaluate(
      async ({ instanceId, convexUrl }) => {
        const w = window as unknown as {
          Clerk?: { session?: { getToken?: () => Promise<string> } };
        };
        const token = (await w.Clerk?.session?.getToken?.()) ?? "";
        const url = convexUrl + "/api/mutation";
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            path: "functions/e2e:setJobInstanceCompleted",
            args: [{ instanceId }],
            format: "convex_encoded_json",
          }),
        });
        if (!res.ok) {
          throw new Error(
            `setJobInstanceCompleted failed: ${res.status} ${await res.text()}`
          );
        }
      },
      { instanceId: jobInstanceId, convexUrl: CONVEX_URL }
    );

    // The kid dashboard subscribes via Convex reactivity — wait for the
    // card to drop out of "in_progress" (it now shows in the "Done!"
    // column on the kid side, which from the parent's perspective is the
    // approval queue).
    await expect(
      page.locator(
        `[data-testid="job-card"][data-status="in_progress"][data-instance-id="${jobInstanceId}"]`
      )
    ).toHaveCount(0, { timeout: 10_000 });
  });

  await test.step("6. Approve via ApprovalQueue", async () => {
    await page.goto("/parent#approvals");
    await expect(page).toHaveURL(/#approvals/);

    // Find Zoe's "Make bed" approval card and click Approve.
    const card = page.locator(
      `[data-testid="approval-card"][data-instance-id="${jobInstanceId}"]`
    );
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.getByRole("button", { name: /Approve/i }).click();

    // Card should disappear from the queue.
    await expect(card).toHaveCount(0, { timeout: 10_000 });
  });

  await test.step("7. Assert jar credits: Spend ¥70 / Save ¥20 / Give ¥10", async () => {
    // Navigate to Overview tab (which renders ChildOverview cards with
    // WalletJarBalances inside).
    await page.goto("/parent#overview");

    const zoeOverview = page.locator(
      `[data-testid="child-overview"][data-child-id="${zoeId}"]`
    );
    await expect(zoeOverview).toBeVisible({ timeout: 10_000 });

    // Read balance from each jar's data-balance attr.
    const spend = zoeOverview.locator(
      '[data-testid="wallet-jar"][data-jar="spend"]'
    );
    const save = zoeOverview.locator(
      '[data-testid="wallet-jar"][data-jar="save"]'
    );
    const give = zoeOverview.locator(
      '[data-testid="wallet-jar"][data-jar="give"]'
    );
    await expect(spend).toHaveAttribute("data-balance", "70", {
      timeout: 10_000,
    });
    await expect(save).toHaveAttribute("data-balance", "20");
    await expect(give).toHaveAttribute("data-balance", "10");
  });

  await test.step("8. Withdraw ¥30 from Spend (cashOut)", async () => {
    const zoeOverview = page.locator(
      `[data-testid="child-overview"][data-child-id="${zoeId}"]`
    );
    // WithdrawalDialog renders a "Withdraw" trigger button.
    await zoeOverview.getByRole("button", { name: /Withdraw/i }).click();

    // Dialog: jar=Spend is default. Amount=30.
    const amountField = page.getByPlaceholder("500"); // placeholder is "500"
    await expect(amountField).toBeVisible({ timeout: 5_000 });
    await amountField.fill("30");

    // Reason "cashOut" is default. Leave note empty.

    // Submit — button label "Record Withdrawal".
    await page
      .getByRole("button", { name: /Record Withdrawal/i })
      .click();

    // Assert spend balance drops to 40.
    const spend = zoeOverview.locator(
      '[data-testid="wallet-jar"][data-jar="spend"]'
    );
    await expect(spend).toHaveAttribute("data-balance", "40", {
      timeout: 10_000,
    });
  });

  await test.step("9. Bonus ¥50 (note: kept room clean)", async () => {
    const zoeOverview = page.locator(
      `[data-testid="child-overview"][data-child-id="${zoeId}"]`
    );
    // BonusDialog trigger.
    await zoeOverview.getByRole("button", { name: /Bonus/i }).click();

    // Bonus dialog: amount + note. Placeholder for amount is "100".
    const amountField = page.getByPlaceholder("100");
    await expect(amountField).toBeVisible({ timeout: 5_000 });
    await amountField.fill("50");

    // Optional note. Use the textarea via placeholder lookup.
    const noteField = page.locator('textarea').first();
    await noteField.fill("kept room clean");

    // Submit — button label is "Award Bonus".
    await page.getByRole("button", { name: /Award Bonus/i }).click();

    // Per `creditBonus` in convex/functions/wallets.ts: a bonus uses the
    // same splitEarning function as a normal earning. ¥50 splits:
    //   save = floor(50 * 20/100) = 10
    //   give = floor(50 * 10/100) =  5
    //   spend = 50 - 10 - 5      = 35
    // Previous balances after step 8: spend=40, save=20, give=10.
    // After ¥50 bonus: spend=75, save=30, give=15. Total = 120.
    const total = zoeOverview.locator('[data-testid="wallet-total"]');
    await expect(total).toHaveAttribute("data-balance", "120", {
      timeout: 10_000,
    });
    await expect(
      zoeOverview.locator('[data-testid="wallet-jar"][data-jar="spend"]')
    ).toHaveAttribute("data-balance", "75");
    await expect(
      zoeOverview.locator('[data-testid="wallet-jar"][data-jar="save"]')
    ).toHaveAttribute("data-balance", "30");
    await expect(
      zoeOverview.locator('[data-testid="wallet-jar"][data-jar="give"]')
    ).toHaveAttribute("data-balance", "15");
  });

  await test.step("10. Delete Zoe — cascade via ChildManager", async () => {
    // Switch to Children tab.
    await page.goto("/parent#children");

    const zoeRow = page.locator(
      `[data-testid="child-row"][data-child-id="${zoeId}"]`
    );
    await expect(zoeRow).toBeVisible({ timeout: 10_000 });

    // Click the trash icon button. Note: ChildManager currently calls
    // onDelete directly without a confirmation dialog (UX gap surfaced for
    // F12 — see work-log).
    await zoeRow.getByTestId("child-row-delete").click();

    // Zoe row should disappear.
    await expect(zoeRow).toHaveCount(0, { timeout: 10_000 });
  });
});

/**
 * Reference: alternative paths that the F8 spec considered but did NOT
 * adopt. Kept inline as documentation.
 *
 * 1. ConvexHttpClient route for step 5 — instantiate outside the page
 *    context:
 *
 *      const convex = new ConvexHttpClient(CONVEX_URL);
 *      // Requires Clerk JWT — not trivial to extract from storageState
 *      // outside the browser. Hence we run the mutation inside
 *      // page.evaluate where window.Clerk.session.getToken() works.
 *
 *    Left as a future option if the page.evaluate path becomes flaky.
 *
 * 2. Spawning a second BrowserContext for the kid view — works but adds
 *    ~5s setup and duplicates the kid-side coverage that F9 already owns.
 */
void ConvexHttpClient; // satisfy linter — import retained for future use
void api; // ditto
void CONVEX_URL;
type _ChildId = Id<"children">; // satisfy isolatedModules
