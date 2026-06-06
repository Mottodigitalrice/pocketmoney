/**
 * H1 — KanbanBoard component tests.
 *
 * The board renders 3 columns (Available / Doing / Done) for a given child.
 * It drives them from `getTodayAvailableJobs`, `getInProgressJobs`, and
 * `getCompletedJobs` on the PocketMoneyContext.
 *
 * We don't mock anything at the convex layer beyond what the global setup
 * already does — we just feed the provider partial values.
 *
 * Covered:
 *   - Skeleton renders while `isLoading=true`.
 *   - Three columns render with their translated titles when data is present.
 *   - Cards are distributed into the correct column by status.
 *   - F10 6.4: empty columns render a soft "—" placeholder (not rich)
 *     when another column has content. Rich dashed block stays reserved
 *     for the board-level all-empty case (onboarding moment for a new
 *     kid).
 *   - Dot-indicator tablist has correct aria attributes (role="tab", aria-selected).
 *   - "No jobs today" empty state when all three columns are empty.
 */
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "./test-utils";
import { KanbanBoard } from "@/components/features/kanban/KanbanBoard";
import type { Job, JobInstanceWithJob, ScheduledJobWithJob } from "@/types";

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
  yenAmount: 200,
  icon: "🍽️",
  createdAt: 0,
};

const JOB_PLANTS: Job = {
  _id: "job-plants",
  userId: "u1",
  title: "Water plants",
  yenAmount: 50,
  icon: "🌱",
  createdAt: 0,
};

function scheduled(id: string, job: Job): ScheduledJobWithJob {
  return {
    _id: id,
    userId: "u1",
    jobId: job._id,
    childId: CHILD_ID,
    date: "2026-05-13",
    createdAt: 0,
    job,
  };
}

function instance(
  id: string,
  job: Job,
  status: "in_progress" | "completed",
): JobInstanceWithJob {
  return {
    _id: id,
    userId: "u1",
    jobId: job._id,
    childId: CHILD_ID,
    status,
    createdAt: 0,
    job,
  };
}

describe("KanbanBoard", () => {
  it("renders the skeleton while context is hydrating", () => {
    const { getByTestId, queryByText } = renderWithProviders(
      <KanbanBoard childId={CHILD_ID} />,
      { contextValue: { isLoading: true } },
    );
    expect(getByTestId("kanban-board-skeleton")).toBeInTheDocument();
    // No real column headers should render under the skeleton.
    expect(queryByText("Available Jobs")).toBeNull();
  });

  it("renders all three columns with translated headers when data is present", () => {
    const { getByText } = renderWithProviders(
      <KanbanBoard childId={CHILD_ID} />,
      {
        contextValue: {
          getTodayAvailableJobs: () => [scheduled("s1", JOB_TIDY)],
          getInProgressJobs: () => [instance("i1", JOB_DISHES, "in_progress")],
          getCompletedJobs: () => [instance("i2", JOB_PLANTS, "completed")],
          getInstancesForChild: () => [],
          getJobById: (id) =>
            [JOB_TIDY, JOB_DISHES, JOB_PLANTS].find((j) => j._id === id),
        },
      },
    );
    expect(getByText("Available Jobs")).toBeInTheDocument();
    expect(getByText("I'm Doing It!")).toBeInTheDocument();
    expect(getByText("Done!")).toBeInTheDocument();
  });

  it("distributes cards into the correct column based on status", () => {
    const { container } = renderWithProviders(
      <KanbanBoard childId={CHILD_ID} />,
      {
        contextValue: {
          getTodayAvailableJobs: () => [scheduled("s1", JOB_TIDY)],
          getInProgressJobs: () => [instance("i1", JOB_DISHES, "in_progress")],
          getCompletedJobs: () => [instance("i2", JOB_PLANTS, "completed")],
          getInstancesForChild: () => [],
          getJobById: (id) =>
            [JOB_TIDY, JOB_DISHES, JOB_PLANTS].find((j) => j._id === id),
        },
      },
    );

    const cards = container.querySelectorAll('[data-testid="job-card"]');
    // 1 in each of 3 columns = 3 cards total.
    expect(cards).toHaveLength(3);

    const statuses = Array.from(cards).map((c) =>
      c.getAttribute("data-status"),
    );
    expect(statuses).toContain("available");
    expect(statuses).toContain("in_progress");
    expect(statuses).toContain("completed");
  });

  // F10 6.4: when at least one column has content, the other (empty)
  // columns render a soft "—" placeholder — not the rich dashed block.
  // Three rich empties side-by-side reads as visual noise.
  it("renders soft '—' placeholders in empty columns when another column has content", () => {
    const { container, getByTestId, queryByTestId } = renderWithProviders(
      <KanbanBoard childId={CHILD_ID} />,
      {
        contextValue: {
          // Doing column has work — Available + Done are empty. This keeps
          // us out of the "no jobs today" board-level empty state.
          getTodayAvailableJobs: () => [],
          getInProgressJobs: () => [instance("i1", JOB_DISHES, "in_progress")],
          getCompletedJobs: () => [],
          getInstancesForChild: () => [],
          getJobById: () => JOB_DISHES,
        },
      },
    );
    // Rich empty-state copy must NOT render for the two empty columns.
    expect(container).not.toHaveTextContent(/All jobs taken/i);
    expect(container).not.toHaveTextContent(/Complete jobs to see/i);
    expect(container).not.toHaveTextContent(/Pick a job to start/i);
    // Soft placeholders render in the empty columns only.
    expect(
      getByTestId("kanban-column-soft-empty-available"),
    ).toBeInTheDocument();
    expect(getByTestId("kanban-column-soft-empty-done")).toBeInTheDocument();
    expect(queryByTestId("kanban-column-soft-empty-doing")).toBeNull();
  });

  // F10 6.4: even with two columns empty, the rich dashed-border block
  // should appear at most once across the whole board (the all-empty
  // board-level path handles that case separately). In the per-column
  // some-empty path it must appear zero times.
  it("renders no rich dashed empty blocks when one column has content", () => {
    const { container } = renderWithProviders(
      <KanbanBoard childId={CHILD_ID} />,
      {
        contextValue: {
          getTodayAvailableJobs: () => [scheduled("s1", JOB_TIDY)],
          getInProgressJobs: () => [],
          getCompletedJobs: () => [],
          getInstancesForChild: () => [],
          getJobById: () => JOB_TIDY,
        },
      },
    );
    // Rich empty blocks use the dashed border class — none of them should
    // appear in the some-empty case.
    const richEmpties = container.querySelectorAll(
      ".border-dashed.border-white\\/30",
    );
    expect(richEmpties).toHaveLength(0);
  });

  it("exposes the dot-indicator tablist with correct aria roles", () => {
    const { getAllByRole } = renderWithProviders(
      <KanbanBoard childId={CHILD_ID} />,
      {
        contextValue: {
          getTodayAvailableJobs: () => [scheduled("s1", JOB_TIDY)],
          getInProgressJobs: () => [],
          getCompletedJobs: () => [],
          getInstancesForChild: () => [],
          getJobById: () => JOB_TIDY,
        },
      },
    );
    // F19: three tab dots, one selected on mount.
    const tabs = getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    const selected = tabs.filter(
      (t) => t.getAttribute("aria-selected") === "true",
    );
    // Exactly one is selected at any time.
    expect(selected).toHaveLength(1);
  });

  it("renders the 'no jobs today' empty state when all columns are empty", () => {
    const { container } = renderWithProviders(
      <KanbanBoard childId={CHILD_ID} />,
      {
        contextValue: {
          getTodayAvailableJobs: () => [],
          getInProgressJobs: () => [],
          getCompletedJobs: () => [],
          getInstancesForChild: () => [],
        },
      },
    );
    // F11 empty state — distinctive copy.
    expect(container).toHaveTextContent(/All done for today/i);
    // Columns must NOT render in this state.
    expect(container.querySelector('[data-testid="job-card"]')).toBeNull();
  });

  // S3 (R4) — F10 6.3: empty-state surfaces the "tell a grown-up" nudge.
  it("includes the 'tell a grown-up' action line in the no-jobs-today empty state", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <KanbanBoard childId={CHILD_ID} />,
      {
        contextValue: {
          getTodayAvailableJobs: () => [],
          getInProgressJobs: () => [],
          getCompletedJobs: () => [],
          getInstancesForChild: () => [],
        },
      },
    );
    // Wrapped in a single empty-state container.
    const empty = getByTestId("kanban-empty-today");
    expect(empty).toBeInTheDocument();
    // S3 (R4) action nudge — parrot emoji + "Tell a grown-up" copy.
    expect(getByText(/Tell a grown-up if you want more/i)).toBeInTheDocument();
  });
});
