/**
 * F9 — Kid happy-path + photo-proof spec.
 *
 * Drives a kid's daily flow: start a photo-proof job, fail to complete
 * without proof, upload proof, complete, get approved, jars credit,
 * then unlock + open the weekly Lucky Chest. Final step verifies the
 * `LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK` error surfaces.
 *
 * Status: AUTHORED, NOT YET EXECUTED.
 * Blocker (F7): Clerk env vars missing — see parent-happy-path.spec.ts
 * header for the unblock command.
 *
 * Setup strategy: instead of driving the parent UI to create the child
 * and job, we use the DEV-ONLY Convex helper `seedKidScenario` that
 * creates all three rows (child, job, scheduledJob) in one transaction.
 * Helper is guarded by `CONVEX_DEPLOYMENT.startsWith("dev:")`.
 *
 * To run once Clerk env is configured:
 *
 *   npx playwright test e2e/kid-happy-path.spec.ts --project=chromium
 */

import { test, expect } from "@playwright/test";
import path from "path";

const PROOF_FIXTURE = path.resolve(__dirname, "fixtures/proof.png");
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

test("kid: photo-proof happy-path → approval → lucky chest unlock", async ({
  page,
}) => {
  let bobbyId = "";
  let tidyDeskJobId = "";

  await test.step("1. Seed: create Bobby + Tidy desk job (with photo proof) + schedule today", async () => {
    // Today as YYYY-MM-DD.
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Land on /parent so a) auth is established b) Clerk JS is loaded c)
    // window.__NEXT_PUBLIC_CONVEX_URL__ exists.
    await page.goto("/parent");
    await expect(page).toHaveURL(/\/parent/, { timeout: 15_000 });

    // Call the DEV-ONLY seedKidScenario helper via Convex.
    expect(CONVEX_URL, "NEXT_PUBLIC_CONVEX_URL must be set").toBeTruthy();
    const result = await page.evaluate(
      async ({ date, convexUrl }) => {
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
            path: "functions/e2e:seedKidScenario",
            args: [
              {
                childName: "Bobby",
                childIcon: "dolphin",
                childAge: 8,
                jobTitle: "Tidy desk",
                jobIcon: "🧹",
                jobYenAmount: 200,
                jobRequiresPhotoProof: true,
                date,
                priority: "mustDo",
              },
            ],
            format: "convex_encoded_json",
          }),
        });
        if (!res.ok) {
          throw new Error(
            `seedKidScenario failed: ${res.status} ${await res.text()}`,
          );
        }
        const json = (await res.json()) as {
          status: string;
          value: {
            childId: string;
            jobId: string;
            scheduledJobId: string;
          };
        };
        return json.value;
      },
      { date: todayStr, convexUrl: CONVEX_URL },
    );
    bobbyId = result.childId;
    tidyDeskJobId = result.jobId;
    expect(bobbyId).toBeTruthy();
    expect(tidyDeskJobId).toBeTruthy();
  });

  await test.step("2. Navigate to /kid/[bobbyId] — kid dashboard renders", async () => {
    await page.goto(`/kid/${bobbyId}`);
    // Wait for the kanban board to render with the available job.
    await expect(
      page.locator('[data-testid="job-card"][data-status="available"]'),
    ).toBeVisible({ timeout: 15_000 });
  });

  await test.step("3. Start the job — moves to In Progress", async () => {
    const availableCard = page
      .locator('[data-testid="job-card"][data-status="available"]')
      .first();
    await availableCard
      .getByRole("button", { name: /Let's Do It|💪|Start/i })
      .click();

    // Card should now appear in in_progress.
    await expect(
      page.locator('[data-testid="job-card"][data-status="in_progress"]'),
    ).toBeVisible({ timeout: 10_000 });
  });

  await test.step("4. Complete without proof is rejected (photo proof required)", async () => {
    const inProgress = page
      .locator('[data-testid="job-card"][data-status="in_progress"]')
      .first();

    // The "I Did It" button is disabled when photo-proof is required and
    // no file is attached. Verify the disabled state — that's how the
    // UI prevents completion. Asserting "disabled" is a robust contract.
    const completeBtn = inProgress.getByRole("button", {
      name: /I Did It|Complete|✅/i,
    });
    await expect(completeBtn).toBeDisabled();

    // Card must still be in_progress.
    await expect(inProgress).toBeVisible();
  });

  await test.step("5. Upload proof + complete — moves to Pending Approval", async () => {
    const inProgress = page
      .locator('[data-testid="job-card"][data-status="in_progress"]')
      .first();

    // Attach the 8×8 fixture PNG via the hidden file input.
    await inProgress
      .locator('[data-testid="job-card-proof-input"]')
      .setInputFiles(PROOF_FIXTURE);

    // Now the complete button should enable.
    const completeBtn = inProgress.getByRole("button", {
      name: /I Did It|Complete|✅/i,
    });
    await expect(completeBtn).toBeEnabled({ timeout: 5_000 });
    await completeBtn.click();

    // Card should drop out of in_progress (now status=completed, which on
    // the kid kanban shows in the "Done!" column with "Waiting for
    // Mummy or Daddy" label — see JobCard `status === "completed"` branch).
    await expect(
      page.locator('[data-testid="job-card"][data-status="completed"]'),
    ).toBeVisible({ timeout: 10_000 });
  });

  await test.step("6. Parent approves — proof image renders, then click Approve", async () => {
    await page.goto("/parent#approvals");
    await expect(page).toHaveURL(/#approvals/);

    // Find Bobby's approval card by job-id.
    const card = page.locator(
      `[data-testid="approval-card"][data-job-id="${tidyDeskJobId}"]`,
    );
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Proof image renders with alt text from t('approval_photo_proof_alt').
    // Asserting via partial alt match makes this resilient to copy changes.
    await expect(
      card.locator('img[alt*="proof" i], img[alt*="Photo proof" i]').first(),
    ).toBeVisible({ timeout: 10_000 });

    // Approve.
    await card.getByRole("button", { name: /Approve/i }).click();

    // Card should disappear from queue.
    await expect(card).toHaveCount(0, { timeout: 10_000 });
  });

  await test.step("7. Jars update — Spend ¥140 / Save ¥40 / Give ¥20", async () => {
    // Per splitEarning(200): save=40, give=20, spend=140.
    await page.goto(`/kid/${bobbyId}`);

    // WeeklyTracker / KidHeader render wallet info — but we need direct
    // wallet jar testids. The parent's ChildOverview definitely has them.
    // Easiest: assert from the parent overview, since that's where the
    // shared WalletJarBalances component is mounted in a stable layout.
    await page.goto("/parent#overview");
    const bobbyOverview = page.locator(
      `[data-testid="child-overview"][data-child-id="${bobbyId}"]`,
    );
    await expect(bobbyOverview).toBeVisible({ timeout: 10_000 });
    await expect(
      bobbyOverview.locator('[data-testid="wallet-jar"][data-jar="spend"]'),
    ).toHaveAttribute("data-balance", "140", { timeout: 10_000 });
    await expect(
      bobbyOverview.locator('[data-testid="wallet-jar"][data-jar="save"]'),
    ).toHaveAttribute("data-balance", "40");
    await expect(
      bobbyOverview.locator('[data-testid="wallet-jar"][data-jar="give"]'),
    ).toHaveAttribute("data-balance", "20");
  });

  await test.step("8. Lucky Chest is unlocked → open it", async () => {
    await page.goto(`/kid/${bobbyId}`);

    const chest = page.locator('[data-testid="lucky-chest"]');
    await expect(chest).toBeVisible({ timeout: 10_000 });
    // All mustDo jobs this week are approved (we only created one and it's
    // approved), so the chest should be unlocked.
    await expect(chest).toHaveAttribute("data-unlocked", "true");
    await expect(chest).toHaveAttribute("data-opened", "false");

    const openBtn = chest.locator('[data-testid="lucky-chest-open-button"]');
    await expect(openBtn).toBeEnabled();
    await openBtn.click();

    // After open: data-opened flips to true, and a yen amount renders
    // inside the button (e.g. "¥42" — the random amount). Assert the
    // chest reports opened.
    await expect(chest).toHaveAttribute("data-opened", "true", {
      timeout: 10_000,
    });
  });

  await test.step("9. Second open same week is rejected", async () => {
    // The chest's open button is now disabled (status.opened === true
    // disables it in LuckyChest.tsx). Verify the disabled state.
    const chest = page.locator('[data-testid="lucky-chest"]');
    const openBtn = chest.locator('[data-testid="lucky-chest-open-button"]');
    await expect(openBtn).toBeDisabled();

    // Programmatic second-open attempt: hit the mutation directly to
    // confirm the backend error surfaces. The frontend "natural" path
    // here can't fire because the button is disabled — but if the user
    // somehow forced the mutation (multi-tab, stale state), they would
    // hit this error.
    const errorMsg = await page.evaluate(
      async ({ convexUrl, childId }) => {
        const w = window as unknown as {
          Clerk?: { session?: { getToken?: () => Promise<string> } };
        };
        const token = (await w.Clerk?.session?.getToken?.()) ?? "";
        const today = new Date();
        const week: string[] = [];
        const monday = new Date(today);
        const day = monday.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        monday.setDate(monday.getDate() + diff);
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          week.push(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
              d.getDate(),
            ).padStart(2, "0")}`,
          );
        }
        const res = await fetch(convexUrl + "/api/mutation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            path: "functions/luckyChests:open",
            args: [{ childId, weekDates: week }],
            format: "convex_encoded_json",
          }),
        });
        const json = await res.json();
        return JSON.stringify(json);
      },
      { convexUrl: CONVEX_URL, childId: bobbyId },
    );

    // Backend throws "LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK". The Convex
    // HTTP response wraps the error message. Assert it contains the
    // contract string.
    expect(errorMsg).toContain("LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK");

    // UX gap surfaced for F12/F20: LuckyChest.tsx renders the raw error
    // string via `err.message` (see LuckyChest.tsx line 30) — for a real
    // user that hits this error (via stale tab / network retry), they
    // would see literally "LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK" rather
    // than a friendly localised message. Note in work-log for F12/F20.
  });
});
