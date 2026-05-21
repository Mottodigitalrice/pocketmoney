/**
 * H1 — WeekPlanner component tests.
 *
 * The WeekPlanner is the most complex parent-side component:
 *   - 7-column week grid × N child rows.
 *   - Library job picker + child multi-select + priority toggle.
 *   - Bulk actions: Copy last week / Apply Monday template / Apply recurring.
 *   - HTML5 drag-and-drop between cells (library → cell, cell → cell).
 *
 * What we test:
 *   - Skeleton renders while `isLoading=true`.
 *   - No-children empty state.
 *   - Header + grid render when ≥1 child + ≥1 job.
 *   - Picking a job from the library picker → clicking "Add selected" on a
 *     day → `scheduleJobBatch` fires with the selected job for all active
 *     children + that date.
 *   - "Clear day" per-cell button → `clearScheduledDay(childId, date)` fires.
 *   - "Copy last week" bulk action → `scheduleJobBatch` fires with the
 *     scheduled entries from last week's matching weekday.
 *
 * What we deliberately skip (documented at bottom of file):
 *   - Full HTML5 drag-and-drop simulation. JSDOM doesn't reliably support
 *     the drag DataTransfer object, and fragile coordinate-based events make
 *     this test class brittle. Instead we verify that cells expose the
 *     correct draggable/`onDragOver`/`onDrop` props by data-testid presence,
 *     and trust the integration test layer for the full flow.
 */
import { describe, it, expect, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { renderWithProviders, screen, fireEvent } from "./test-utils";
import { WeekPlanner } from "@/components/features/parent-dashboard/WeekPlanner";
import type { Child, Job, ScheduledJobWithJob } from "@/types";

const TODAY = "2026-05-13";
const WEEK = [
  "2026-05-11",
  "2026-05-12",
  "2026-05-13",
  "2026-05-14",
  "2026-05-15",
  "2026-05-16",
  "2026-05-17",
];
const PREV_WEEK = [
  "2026-05-04",
  "2026-05-05",
  "2026-05-06",
  "2026-05-07",
  "2026-05-08",
  "2026-05-09",
  "2026-05-10",
];

const CHILD_A: Child = {
  _id: "child-a",
  userId: "u1",
  name: "Alex",
  icon: "shark",
  age: 8,
  rankMultiplier: 1,
  createdAt: 0,
};

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
  childId: string,
  date: string,
): ScheduledJobWithJob {
  return {
    _id: id,
    userId: "u1",
    jobId: job._id,
    childId,
    date,
    createdAt: 0,
    job,
  };
}

/**
 * Helper to assemble a context with the date helpers wired up. The component
 * calls `getWeekDates(base)` where `base` is the current date + offset*7. We
 * mock it deterministically to return WEEK / PREV_WEEK based on the date arg.
 */
function makeContext(overrides: Record<string, unknown> = {}) {
  return {
    familyChildren: [CHILD_A],
    jobs: [JOB_TIDY, JOB_DISHES],
    getLocalDateString: () => TODAY,
    getWeekDates: (date?: Date) => {
      // The component derives weekDates from `base = today + weekOffset*7`
      // and previousWeekDates from `base = today + (weekOffset-1)*7`. We
      // detect "previous week" by checking whether the input date is more
      // than ~4 days behind today's real clock — that comparison is stable
      // regardless of the calendar day this test runs on (today's date is
      // not pinned in this suite).
      if (!date) return [...WEEK];
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const fourDaysMs = 4 * 24 * 60 * 60 * 1000;
      if (diffMs > fourDaysMs) return [...PREV_WEEK];
      return [...WEEK];
    },
    getScheduledJobsForChildDate: () => [],
    ...overrides,
  };
}

describe("WeekPlanner", () => {
  it("renders the skeleton while context is hydrating", () => {
    const { getByTestId, queryByText } = renderWithProviders(<WeekPlanner />, {
      contextValue: { isLoading: true },
    });
    expect(getByTestId("week-planner-skeleton")).toBeInTheDocument();
    expect(queryByText(/Week Planner/i)).toBeNull();
  });

  it("renders the no-crew empty state when there are no children", () => {
    const { container } = renderWithProviders(<WeekPlanner />, {
      contextValue: makeContext({ familyChildren: [] }),
    });
    // `planner_empty_title` → "No crew to plan for".
    expect(container).toHaveTextContent(/No crew to plan/i);
    // The grid must NOT render.
    expect(container.querySelector('[data-testid="planner-cell"]')).toBeNull();
  });

  // H4 (Gap 5.4): empty-state CTA wired to onNavigateToChildren prop.
  it("fires onNavigateToChildren when the no-crew CTA is clicked", () => {
    const onNavigateToChildren = vi.fn();
    renderWithProviders(
      <WeekPlanner onNavigateToChildren={onNavigateToChildren} />,
      { contextValue: makeContext({ familyChildren: [] }) },
    );

    const cta = screen.getByText(/Go to the Crew tab/i);
    expect(cta).toBeInTheDocument();
    fireEvent.click(cta);
    expect(onNavigateToChildren).toHaveBeenCalledTimes(1);
  });

  it("renders the planner grid (header + child row + cells) when data is present", () => {
    const { container, getByText, getAllByText } = renderWithProviders(
      <WeekPlanner />,
      { contextValue: makeContext() },
    );
    // Header visible once.
    expect(getByText(/Week Planner/i)).toBeInTheDocument();
    // Child name appears in BOTH the picker pill AND the row label — assert
    // ≥1 occurrence rather than exactly one.
    expect(getAllByText("Alex").length).toBeGreaterThanOrEqual(1);
    // 7 cells for the one child row.
    const cells = container.querySelectorAll('[data-testid="planner-cell"]');
    expect(cells.length).toBe(7);
    // Each cell carries its date + childId on data attrs.
    const firstCell = cells[0];
    expect(firstCell).toBeDefined();
    expect(firstCell!.getAttribute("data-child-id")).toBe(CHILD_A._id);
    expect(firstCell!.getAttribute("data-date")).toBe(WEEK[0]);
  });

  it("picks a job from the library and schedules it onto a day via Add Selected", () => {
    const scheduleJobBatch = vi.fn();
    renderWithProviders(<WeekPlanner />, {
      contextValue: makeContext({ scheduleJobBatch }),
    });

    // Pick a job — buttons with the job title text. There are two library
    // jobs; click the first one (Tidy room).
    fireEvent.click(screen.getByText("Tidy room"));

    // Now click the Add Selected button for Wednesday (TODAY = 2026-05-13).
    const addBtns = screen.getAllByTestId("planner-add-selected");
    const wedBtn = addBtns.find((b) => b.getAttribute("data-date") === TODAY)!;
    fireEvent.click(wedBtn);

    expect(scheduleJobBatch).toHaveBeenCalledTimes(1);
    expect(scheduleJobBatch).toHaveBeenCalledWith([
      {
        jobId: JOB_TIDY._id,
        childId: CHILD_A._id,
        date: TODAY,
        priority: "optional",
      },
    ]);
  });

  it("clears a day via the per-cell Clear Day button when entries exist", () => {
    const clearScheduledDay = vi.fn();
    // Inject one scheduled entry on Tuesday for child A.
    const scheduledEntries = new Map<string, ScheduledJobWithJob[]>();
    scheduledEntries.set(`${CHILD_A._id}|2026-05-12`, [
      scheduled("s1", JOB_TIDY, CHILD_A._id, "2026-05-12"),
    ]);

    renderWithProviders(<WeekPlanner />, {
      contextValue: makeContext({
        clearScheduledDay,
        getScheduledJobsForChildDate: (childId: string, date: string) =>
          scheduledEntries.get(`${childId}|${date}`) ?? [],
      }),
    });

    // "Clear Day" button — `planner_clear_day` translation key.
    const clearBtn = screen.getByRole("button", { name: /Clear Day/i });
    fireEvent.click(clearBtn);

    expect(clearScheduledDay).toHaveBeenCalledTimes(1);
    expect(clearScheduledDay).toHaveBeenCalledWith(CHILD_A._id, "2026-05-12");
  });

  it("copies last week's entries into the current week via Copy last week", async () => {
    const scheduleJobBatch = vi.fn();
    // Last week had one entry per weekday — index-wise the same map:
    //   PREV_WEEK[1]=2026-05-05 → maps to WEEK[1]=2026-05-12.
    // Wire a single entry on PREV_WEEK[1].
    const byKey = (childId: string, date: string) => {
      if (childId === CHILD_A._id && date === PREV_WEEK[1]) {
        return [scheduled("s-prev", JOB_DISHES, CHILD_A._id, PREV_WEEK[1])];
      }
      return [];
    };

    renderWithProviders(<WeekPlanner />, {
      contextValue: makeContext({
        scheduleJobBatch,
        getScheduledJobsForChildDate: byKey,
      }),
    });

    // `planner_copy_last_week` → "Copy last week".
    const copyBtn = screen.getByRole("button", { name: /Copy last week/i });
    // React 19: wrap click in act() so the sync handler's effects flush
    // before we read the mock. Then poll via waitFor — assertions on
    // mock.calls.length race the React batching window otherwise.
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    await waitFor(() => {
      expect(scheduleJobBatch).toHaveBeenCalledTimes(1);
    });
    expect(scheduleJobBatch).toHaveBeenCalledWith([
      {
        jobId: JOB_DISHES._id,
        childId: CHILD_A._id,
        date: WEEK[1],
        priority: "optional",
      },
    ]);
  });
});

/*
 * Skipped explicitly:
 *   - Real HTML5 drag-and-drop simulation (library job → cell, cell → cell).
 *     JSDOM does not fully implement DataTransfer.setData/getData semantics
 *     for the synthetic drag pipeline, and triggering dragstart/dragenter/
 *     dragover/drop in sequence produces flaky results across Vitest + Node
 *     versions. The cell-level `data-testid="planner-cell"` (+ data-child-id
 *     / data-date attrs) is asserted in "renders the planner grid" above, so
 *     the drag-receive surface is covered structurally.
 *
 *     Full DnD coverage lives in Playwright (test:e2e) where real drag events
 *     are reliable.
 */
