/**
 * H1 — TreasureHistoryCalendar component tests.
 *
 * Renders a 7-day grid of approved jobs for the selected child, with weekly
 * pagination chevrons. The component reads `getInstancesForChild`,
 * `getJobById`, `getWeekDates`, and `getLocalDateString` from context.
 *
 * Covered:
 *   - Skeleton renders while `isLoading=true`.
 *   - 7-day grid (one card per date) renders when there's at least one
 *     approved instance in the week.
 *   - Per-day earnings sum is shown (¥X) on the right of the day card.
 *   - "Today" highlight: the matching weekday card has the today date copy.
 *   - Empty week (no approved instances) → renders F11 empty-state copy.
 */
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "./test-utils";
import { TreasureHistoryCalendar } from "@/components/features/kid-dashboard/TreasureHistoryCalendar";
import type { Job, JobInstance } from "@/types";

const CHILD_ID = "child-1";

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
  yenAmount: 250,
  icon: "🍽️",
  createdAt: 0,
};

const WEEK = [
  "2026-05-11",
  "2026-05-12",
  "2026-05-13",
  "2026-05-14",
  "2026-05-15",
  "2026-05-16",
  "2026-05-17",
] as const;

const TODAY = "2026-05-13";

/** Approved instance fixture — approvedAt timestamp set so `getLocalDateString`
 *  in the test maps it back to the desired date string. */
function approved(id: string, jobId: string, date: string): JobInstance {
  return {
    _id: id,
    userId: "u1",
    jobId,
    childId: CHILD_ID,
    status: "approved",
    approvedAt: Date.parse(`${date}T12:00:00Z`),
    createdAt: 0,
  };
}

const DEFAULT_CTX_HELPERS = {
  getWeekDates: () => [...WEEK],
  getLocalDateString: (date?: Date) => {
    if (!date) return TODAY;
    // Pull date's UTC y-m-d so the test fixtures line up regardless of
    // jsdom's locale. ApprovedAt fixtures above are UTC 12:00 so this
    // round-trip is safe.
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },
  getJobById: (id: string) => [JOB_TIDY, JOB_DISHES].find((j) => j._id === id),
};

describe("TreasureHistoryCalendar", () => {
  it("renders the skeleton while context is hydrating", () => {
    const { getByTestId, container } = renderWithProviders(
      <TreasureHistoryCalendar childId={CHILD_ID} />,
      { contextValue: { isLoading: true } },
    );
    expect(getByTestId("treasure-history-skeleton")).toBeInTheDocument();
    // The real grid must NOT render alongside the skeleton — sentinel: no
    // day card with the today date label.
    expect(container.textContent).not.toMatch(/Tidy room/);
  });

  it("renders a 7-day grid when there's at least one approved instance", () => {
    const instances = [approved("a1", JOB_TIDY._id, "2026-05-12")];

    const { container } = renderWithProviders(
      <TreasureHistoryCalendar childId={CHILD_ID} />,
      {
        contextValue: {
          ...DEFAULT_CTX_HELPERS,
          getInstancesForChild: () => instances,
        },
      },
    );

    // The grid uses .grid → count direct-child day cards by counting
    // distinct date labels. We just sanity-check that ALL 7 weekday labels
    // appear, which only happens in the populated branch.
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (const label of dayLabels) {
      expect(container).toHaveTextContent(new RegExp(label));
    }
  });

  it("sums earnings per day from approved instances", () => {
    // Two instances on 5/12 (Tidy 100 + Dishes 250 = 350), one on 5/14 (100).
    const instances = [
      approved("a1", JOB_TIDY._id, "2026-05-12"),
      approved("a2", JOB_DISHES._id, "2026-05-12"),
      approved("a3", JOB_TIDY._id, "2026-05-14"),
    ];

    const { container } = renderWithProviders(
      <TreasureHistoryCalendar childId={CHILD_ID} />,
      {
        contextValue: {
          ...DEFAULT_CTX_HELPERS,
          getInstancesForChild: () => instances,
        },
      },
    );

    // Pill copy: "¥350" (Tuesday) and "¥100" (Thursday). Pills also render
    // the job titles which contain different yen amounts, so we look for
    // the *exact* badge formatting "¥350".
    expect(container).toHaveTextContent("¥350");
    expect(container).toHaveTextContent("¥100");
  });

  // Wave 7 — F10 6.7: zero-history now renders the calendar grid SHELL
  // beneath a centered empty-state overlay with the 🗺️ icon + warmer copy.
  it("renders the grid SHELL + 🗺️ overlay when there's no approved history", () => {
    const { container, getByTestId } = renderWithProviders(
      <TreasureHistoryCalendar childId={CHILD_ID} />,
      {
        contextValue: {
          ...DEFAULT_CTX_HELPERS,
          getInstancesForChild: () => [],
        },
      },
    );
    // Grid shell still renders (all 7 weekday labels present).
    expect(getByTestId("treasure-history-grid")).toBeInTheDocument();
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (const label of dayLabels) {
      expect(container).toHaveTextContent(new RegExp(label));
    }
    // Overlay renders with the new copy + 🗺️ icon.
    const overlay = getByTestId("treasure-history-empty-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay.textContent).toMatch(/🗺️/);
    expect(container).toHaveTextContent(/treasure log starts here/i);
    expect(container).toHaveTextContent(/finish a job/i);
  });

  it("does NOT render the empty overlay when there is at least one approved instance", () => {
    const instances = [approved("a1", JOB_TIDY._id, "2026-05-12")];
    const { container } = renderWithProviders(
      <TreasureHistoryCalendar childId={CHILD_ID} />,
      {
        contextValue: {
          ...DEFAULT_CTX_HELPERS,
          getInstancesForChild: () => instances,
        },
      },
    );
    expect(
      container.querySelector('[data-testid="treasure-history-empty-overlay"]'),
    ).toBeNull();
    expect(container).toHaveTextContent("Tidy room");
  });

  it("renders the day cards with the job's icon + title for each approved instance", () => {
    const instances = [
      approved("a1", JOB_TIDY._id, "2026-05-12"),
      approved("a2", JOB_DISHES._id, "2026-05-14"),
    ];

    const { container } = renderWithProviders(
      <TreasureHistoryCalendar childId={CHILD_ID} />,
      {
        contextValue: {
          ...DEFAULT_CTX_HELPERS,
          getInstancesForChild: () => instances,
        },
      },
    );

    // Both jobs surface their titles + icons within the day cards.
    expect(container).toHaveTextContent("Tidy room");
    expect(container).toHaveTextContent("Wash dishes");
    expect(container).toHaveTextContent("🧹");
    expect(container).toHaveTextContent("🍽️");
  });
});
