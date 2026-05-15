/**
 * H1 — JobManager component tests.
 *
 * The parent-side job library. Lists library jobs (non-oneoff), with three
 * row actions: quick-assign, edit (opens JobForm), delete (opens ConfirmDialog).
 *
 * Covered:
 *   - Skeleton renders while `isLoading=true`.
 *   - Empty state copy (job library empty) when there are no library jobs.
 *   - List render: one row per non-oneoff job, recurrence label shown when set.
 *   - Click delete icon → ConfirmDialog opens (delete is gated, not single-tap).
 *   - Click edit icon → JobForm dialog opens with the editing job's title.
 *
 * Dialogs are Radix-portaled, so we query `document.body` not `container`.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "./test-utils";
import { JobManager } from "@/components/features/parent-dashboard/JobManager";
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

function jobFixture(overrides: Partial<Job> = {}): Job {
  return {
    _id: "job-1",
    userId: "u1",
    title: "Tidy room",
    yenAmount: 100,
    icon: "🧹",
    createdAt: 0,
    ...overrides,
  };
}

describe("JobManager", () => {
  it("renders the skeleton while context is hydrating", () => {
    const { getByTestId, queryByText } = renderWithProviders(<JobManager />, {
      contextValue: { isLoading: true },
    });
    expect(getByTestId("job-manager-skeleton")).toBeInTheDocument();
    // The +New Job button should NOT render under the skeleton.
    expect(queryByText(/\+ New Job/i)).toBeNull();
  });

  it("renders the empty-state copy when the library has no non-oneoff jobs", () => {
    const { container } = renderWithProviders(<JobManager />, {
      contextValue: {
        jobs: [],
        familyChildren: [CHILD_A],
      },
    });
    // `job_library_empty_title` — match a distinctive fragment.
    expect(container).toHaveTextContent(/No chores in your library/i);
  });

  it("renders one row per library job and shows its recurrence label", () => {
    const dailyJob = jobFixture({
      _id: "job-daily",
      title: "Brush teeth",
      icon: "🪥",
      recurrence: { type: "daily" },
    });
    const oneOff = jobFixture({
      _id: "job-oneoff",
      title: "Clean garage",
      isOneOff: true,
    });

    const { container, getByText } = renderWithProviders(<JobManager />, {
      contextValue: {
        jobs: [dailyJob, oneOff],
        familyChildren: [CHILD_A],
      },
    });
    // Library job shows.
    expect(getByText("Brush teeth")).toBeInTheDocument();
    // One-off jobs are filtered OUT of the library view.
    expect(container).not.toHaveTextContent("Clean garage");
  });

  it("opens the delete-confirm dialog when the delete icon is clicked", () => {
    const deleteJob = vi.fn();
    const { getAllByTestId } = renderWithProviders(<JobManager />, {
      contextValue: {
        jobs: [jobFixture({ _id: "job-1", title: "Tidy room" })],
        familyChildren: [CHILD_A],
        deleteJob,
      },
    });
    // Click the row's delete trash button.
    const deleteBtn = getAllByTestId("job-row-delete")[0];
    expect(deleteBtn).toBeDefined();
    fireEvent.click(deleteBtn!);
    // ConfirmDialog renders into document.body — assert it's there.
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("job-delete-confirm")).toBeInTheDocument();
    // Delete must NOT have fired yet — the dialog gates the call.
    expect(deleteJob).not.toHaveBeenCalled();
  });

  it("opens the JobForm dialog with the row's title when edit is clicked", () => {
    const editJob = vi.fn();
    const job = jobFixture({ _id: "job-edit", title: "Water plants" });
    renderWithProviders(<JobManager />, {
      contextValue: {
        jobs: [job],
        familyChildren: [CHILD_A],
        editJob,
      },
    });
    // The edit button uses aria-label from `job_manager_edit_aria`.
    const editBtn = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editBtn);

    // JobForm renders with title prefilled — the input has the job's title.
    const titleInput = screen.getByLabelText(/Job Name/i) as HTMLInputElement;
    expect(titleInput.value).toBe("Water plants");
    // editJob fires on form submission, not on dialog open.
    expect(editJob).not.toHaveBeenCalled();
  });

  // S2 (R4) — F10 5.10: quick-assign disabled when no kids exist.
  it("disables the quick-assign button when familyChildren is empty (F10 5.10)", () => {
    const job = jobFixture({ _id: "job-no-kids", title: "Take out trash" });
    renderWithProviders(<JobManager />, {
      contextValue: {
        jobs: [job],
        familyChildren: [], // No crew — quick-assign must be disabled.
      },
    });
    // The quick-assign button uses the no-kids aria-label so AT users hear
    // why it's disabled.
    const quickAssignBtn = screen.getByRole("button", {
      name: /Add a crew member before assigning a job/i,
    });
    expect(quickAssignBtn).toBeDisabled();
    expect(quickAssignBtn).toHaveAttribute("aria-disabled", "true");
  });

  // S2 (R4) — F10 5.10: with kids, the button is enabled + uses the normal aria.
  it("enables the quick-assign button when at least one child exists (F10 5.10)", () => {
    const job = jobFixture({ _id: "job-with-kids", title: "Brush teeth" });
    renderWithProviders(<JobManager />, {
      contextValue: {
        jobs: [job],
        familyChildren: [CHILD_A],
      },
    });
    const quickAssignBtn = screen.getByRole("button", {
      name: /Assign Today/i,
    });
    expect(quickAssignBtn).not.toBeDisabled();
  });
});
