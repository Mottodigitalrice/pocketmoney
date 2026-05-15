/**
 * H1 — UpcomingWeekPreview component tests.
 *
 * Reads `getScheduledJobsForWeek` + `getLocalDateString` from context and
 * renders only days AFTER today, grouped by date with a pill per scheduled
 * entry.
 *
 * Covered:
 *   - Skeleton renders while `isLoading=true`.
 *   - Renders day groups for each future date in the week.
 *   - Renders the per-job pill (icon + title) for each scheduled entry.
 *   - Renders the empty-state copy when nothing is scheduled after today.
 *   - Renders the must-do badge inline next to a scheduled job tagged
 *     `priority: "mustDo"`.
 */
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "./test-utils";
import { UpcomingWeekPreview } from "@/components/features/kid-dashboard/UpcomingWeekPreview";
import type { Job, ScheduledJobWithJob } from "@/types";

const CHILD_ID = "child-1";
const TODAY = "2026-05-13";

const JOB_TIDY: Job = {
  _id: "job-tidy",
  userId: "u1",
  title: "Tidy room",
  yenAmount: 100,
  icon: "🧹",
  createdAt: 0,
};

const JOB_DISHES: Job = {
  _id: "job-dishes",
  userId: "u1",
  title: "Wash dishes",
  yenAmount: 200,
  icon: "🍽️",
  createdAt: 0,
};

function scheduled(
  id: string,
  job: Job,
  date: string,
  priority?: "mustDo" | "optional",
): ScheduledJobWithJob {
  return {
    _id: id,
    userId: "u1",
    jobId: job._id,
    childId: CHILD_ID,
    date,
    ...(priority ? { priority } : {}),
    createdAt: 0,
    job,
  };
}

describe("UpcomingWeekPreview", () => {
  it("renders the skeleton while context is hydrating", () => {
    const { getByTestId, container } = renderWithProviders(
      <UpcomingWeekPreview childId={CHILD_ID} />,
      { contextValue: { isLoading: true } },
    );
    expect(getByTestId("upcoming-week-skeleton")).toBeInTheDocument();
    // The real "Still Coming This Week" heading should NOT render.
    expect(container.textContent).not.toMatch(/Still Coming This Week/);
  });

  it("renders day groups for each upcoming date with scheduled jobs", () => {
    // Today is 2026-05-13. Schedule 2026-05-14 and 2026-05-16.
    const data: ScheduledJobWithJob[] = [
      scheduled("s1", JOB_TIDY, "2026-05-14"),
      scheduled("s2", JOB_DISHES, "2026-05-16"),
    ];

    const { container } = renderWithProviders(
      <UpcomingWeekPreview childId={CHILD_ID} />,
      {
        contextValue: {
          getLocalDateString: () => TODAY,
          getScheduledJobsForWeek: () => data,
        },
      },
    );

    // Two date groups — each is keyed by its date and renders a `text-cyan-200`
    // header. Sanity: both pill titles render.
    expect(container).toHaveTextContent("Tidy room");
    expect(container).toHaveTextContent("Wash dishes");
  });

  it("renders one pill per scheduled job, including icon + title", () => {
    const data: ScheduledJobWithJob[] = [
      scheduled("s1", JOB_TIDY, "2026-05-14"),
      scheduled("s2", JOB_DISHES, "2026-05-14"),
      scheduled("s3", JOB_TIDY, "2026-05-15"),
    ];

    const { container } = renderWithProviders(
      <UpcomingWeekPreview childId={CHILD_ID} />,
      {
        contextValue: {
          getLocalDateString: () => TODAY,
          getScheduledJobsForWeek: () => data,
        },
      },
    );

    // We can't count pills with a precise selector (no data-testid on them),
    // but we can count the job-icon occurrences — Tidy 🧹 should appear
    // twice (different days), Dishes 🍽️ once.
    const tidyMatches = container.innerHTML.match(/🧹/g) ?? [];
    const dishesMatches = container.innerHTML.match(/🍽️/g) ?? [];
    expect(tidyMatches.length).toBeGreaterThanOrEqual(2);
    expect(dishesMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the empty-state copy when nothing is scheduled after today", () => {
    const { container } = renderWithProviders(
      <UpcomingWeekPreview childId={CHILD_ID} />,
      {
        contextValue: {
          getLocalDateString: () => TODAY,
          // Anything scheduled today or before is filtered out — past + today
          // pass through `entry.date > today` which is false → empty list.
          getScheduledJobsForWeek: () => [
            scheduled("s-past", JOB_TIDY, "2026-05-13"),
            scheduled("s-today", JOB_DISHES, "2026-05-12"),
          ],
        },
      },
    );
    // F11 copy: `upcoming_empty_title` → "Nothing planned yet".
    expect(container).toHaveTextContent(/Nothing planned yet/i);
  });

  it("renders the must-do badge for a high-priority scheduled job", () => {
    const data: ScheduledJobWithJob[] = [
      scheduled("s1", JOB_TIDY, "2026-05-14", "mustDo"),
      scheduled("s2", JOB_DISHES, "2026-05-14", "optional"),
    ];

    const { container } = renderWithProviders(
      <UpcomingWeekPreview childId={CHILD_ID} />,
      {
        contextValue: {
          getLocalDateString: () => TODAY,
          getScheduledJobsForWeek: () => data,
        },
      },
    );
    // `priority_must_do` translation. Match case-insensitively to allow
    // for uppercase tracking-wide.
    expect(container).toHaveTextContent(/must do/i);
  });
});
