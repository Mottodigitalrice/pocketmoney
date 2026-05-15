/**
 * F19 — Accessibility spec.
 *
 * Scans the four top-level surfaces with axe-core and fails on any
 * Critical or Serious WCAG 2.1 AA violation.
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
 *   3. `npx playwright test e2e/a11y.spec.ts --project=chromium`
 *
 * Surfaces scanned:
 *   - /onboarding         (parent first-run flow)
 *   - /parent             (default tab — Quick Add)
 *   - /parent#planner     (WeekPlanner — drag/drop surface)
 *   - /kid/[childId]      (seeded via the e2e:seedKidScenario helper)
 *
 * Acceptance: zero critical/serious violations. We deliberately allow
 * "moderate" and "minor" through — the Pirate Money colour vocabulary has
 * a few decorative-text-on-image patches that don't impact AT users.
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

interface AxeViolation {
  id: string;
  impact: string | null;
  description: string;
  helpUrl: string;
  nodes: { target: string[] }[];
}

function isBlocking(violation: AxeViolation): boolean {
  return violation.impact === "critical" || violation.impact === "serious";
}

function formatViolations(violations: AxeViolation[]): string {
  return violations
    .map(
      (v) =>
        `  - [${v.impact}] ${v.id}: ${v.description}\n    ${v.helpUrl}\n    nodes: ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join(" | ")}`
    )
    .join("\n");
}

test.describe("F19 a11y scan", () => {
  test("scans /onboarding for critical/serious violations", async ({
    page,
  }) => {
    test.skip(true, "Awaiting Clerk keys in .env.local (F7 blocker)");

    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });

    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = (result.violations as AxeViolation[]).filter(isBlocking);
    expect(
      blocking,
      `Found ${blocking.length} critical/serious axe violations on /onboarding:\n${formatViolations(blocking)}`
    ).toHaveLength(0);
  });

  test("scans /parent (Quick Add tab) for critical/serious violations", async ({
    page,
  }) => {
    test.skip(true, "Awaiting Clerk keys in .env.local (F7 blocker)");

    await page.goto("/parent");
    await expect(page).toHaveURL(/\/parent/, { timeout: 15_000 });

    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = (result.violations as AxeViolation[]).filter(isBlocking);
    expect(
      blocking,
      `Found ${blocking.length} critical/serious axe violations on /parent:\n${formatViolations(blocking)}`
    ).toHaveLength(0);
  });

  test("scans /parent#planner (WeekPlanner) for critical/serious violations", async ({
    page,
  }) => {
    test.skip(true, "Awaiting Clerk keys in .env.local (F7 blocker)");

    await page.goto("/parent#planner");
    // Wait for the planner tab to be selected (hash routing flips active tab).
    await expect(
      page.locator('[role="tab"][aria-selected="true"]')
    ).toContainText(/Planner|よてい/, { timeout: 15_000 });

    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = (result.violations as AxeViolation[]).filter(isBlocking);
    expect(
      blocking,
      `Found ${blocking.length} critical/serious axe violations on /parent#planner:\n${formatViolations(blocking)}`
    ).toHaveLength(0);
  });

  test("scans /kid/[childId] for critical/serious violations", async ({
    page,
  }) => {
    test.skip(true, "Awaiting Clerk keys in .env.local (F7 blocker)");

    // Seed a child + job via the DEV-ONLY Convex helper, same pattern as
    // kid-happy-path.spec.ts.
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await page.goto("/parent");
    await expect(page).toHaveURL(/\/parent/, { timeout: 15_000 });
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
                childName: "A11y Test",
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
        if (!res.ok) {
          throw new Error(
            `seedKidScenario failed: ${res.status} ${await res.text()}`
          );
        }
        const json = (await res.json()) as {
          status: string;
          value: { childId: string; jobId: string; scheduledJobId: string };
        };
        return json.value;
      },
      { date: todayStr, convexUrl: CONVEX_URL }
    );

    await page.goto(`/kid/${result.childId}`);
    await expect(
      page.locator('[data-testid="job-card"]').first()
    ).toBeVisible({ timeout: 15_000 });

    const axeResult = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = (axeResult.violations as AxeViolation[]).filter(isBlocking);
    expect(
      blocking,
      `Found ${blocking.length} critical/serious axe violations on /kid/[childId]:\n${formatViolations(blocking)}`
    ).toHaveLength(0);
  });
});
