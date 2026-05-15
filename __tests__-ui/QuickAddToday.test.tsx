/**
 * H4 — QuickAddToday component tests.
 *
 * Targets the empty-state copy gaps from the F10 first-run reality check:
 *   - Gap 5.1: dedicated zero-jobs headline (`quick_add_empty_jobs_title`)
 *     instead of the count-shaped `job_manager_title` recycle.
 *   - Gap 5.2: zero-children empty state surfaces a "Go to Crew tab" CTA
 *     that fires the `onNavigateToChildren` callback from ParentPage.
 *
 * We deliberately don't test the happy path (jobs+children present) here —
 * the assignment flow has its own coverage in __tests__/ and adding it
 * would duplicate context wiring. This file is scoped to the H4 deltas.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "./test-utils";
import { QuickAddToday } from "@/components/features/parent-dashboard/QuickAddToday";
import type { Child, Job } from "@/types";

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

describe("QuickAddToday — H4 empty-state copy & CTA", () => {
  it("renders the dedicated empty-jobs headline when the library is empty (Gap 5.1)", () => {
    // At least one child present so we hit the no-jobs branch, not the
    // no-children one.
    const { container } = renderWithProviders(<QuickAddToday />, {
      contextValue: {
        familyChildren: [CHILD_A],
        jobs: [],
      },
    });

    // `quick_add_empty_jobs_title` → "No chores in your library yet".
    // Distinct from `job_manager_title` (which would have rendered as
    // "📜 Jobs (0)" before the fix).
    expect(container).toHaveTextContent(/No chores in your library yet/i);
    // Negative: the count-shaped headline must not appear.
    expect(container).not.toHaveTextContent(/Jobs \(0\)/i);
  });

  it("renders the zero-children empty state without a CTA when no navigator prop is supplied", () => {
    const { container, queryByText } = renderWithProviders(
      <QuickAddToday />,
      {
        contextValue: {
          familyChildren: [],
          jobs: [JOB_TIDY],
        },
      },
    );

    // Empty-state copy still renders.
    expect(container).toHaveTextContent(/No crew aboard/i);
    // No CTA when the page hasn't wired up navigation — keeps the component
    // safe to mount in isolation (tests, embedded contexts).
    expect(queryByText(/Go to the Crew tab/i)).toBeNull();
  });

  it("renders the 'Go to Crew tab' CTA and fires onNavigateToChildren on click (Gap 5.2)", () => {
    const onNavigateToChildren = vi.fn();
    renderWithProviders(
      <QuickAddToday onNavigateToChildren={onNavigateToChildren} />,
      {
        contextValue: {
          familyChildren: [],
          jobs: [JOB_TIDY],
        },
      },
    );

    const cta = screen.getByText(/Go to the Crew tab/i);
    expect(cta).toBeInTheDocument();

    fireEvent.click(cta);
    expect(onNavigateToChildren).toHaveBeenCalledTimes(1);
  });
});
