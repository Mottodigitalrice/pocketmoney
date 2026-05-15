/**
 * G4 — JobCard component tests.
 *
 * JobCard's `status` prop selects which UI to render:
 *   - "available"  → Let's Do It! button (calls onStart).
 *   - "in_progress" → Complete button + optional photo-proof picker.
 *   - "completed"   → "Waiting for Mummy or Daddy" badge.
 *
 * Other statuses (approved/rejected) don't render a JobCard in the kanban —
 * those rows surface inside JobInstance-level UI (history, approval queue),
 * so we don't test them here.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "./test-utils";
import { JobCard } from "@/components/features/kanban/JobCard";
import type { Job } from "@/types";

function jobFixture(overrides: Partial<Job> = {}): Job {
  return {
    _id: "job-1",
    userId: "user-1",
    title: "Wash the dishes",
    yenAmount: 200,
    icon: "🧽",
    createdAt: 0,
    ...overrides,
  };
}

describe("JobCard", () => {
  it("renders the available state with a Start button", () => {
    const onStart = vi.fn();
    const { getByTestId, getByText } = renderWithProviders(
      <JobCard job={jobFixture()} status="available" onStart={onStart} />,
    );
    const card = getByTestId("job-card");
    expect(card).toHaveAttribute("data-status", "available");
    expect(getByText(/Let's Do It/)).toBeInTheDocument();
    // Amount + icon both present.
    expect(card).toHaveTextContent("¥200");
    expect(card).toHaveTextContent("Wash the dishes");
  });

  it("invokes onStart when the available-state Start button is clicked", () => {
    const onStart = vi.fn();
    const { getByText } = renderWithProviders(
      <JobCard job={jobFixture()} status="available" onStart={onStart} />,
    );
    getByText(/Let's Do It/).click();
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("renders the in_progress state with a Complete button", () => {
    const { getByTestId } = renderWithProviders(
      <JobCard
        job={jobFixture()}
        status="in_progress"
        instanceId="instance-1"
        onComplete={vi.fn()}
      />,
    );
    const card = getByTestId("job-card");
    expect(card).toHaveAttribute("data-status", "in_progress");
    expect(card).toHaveAttribute("data-instance-id", "instance-1");
    const completeBtn = getByTestId("job-card-complete");
    expect(completeBtn).not.toBeDisabled();
    expect(completeBtn).toHaveTextContent(/I Did It/);
  });

  it("disables Complete and shows the proof picker when requiresPhotoProof", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <JobCard
        job={jobFixture({ requiresPhotoProof: true })}
        status="in_progress"
        onComplete={vi.fn()}
      />,
    );
    // The proof picker is visible.
    expect(getByTestId("job-card-proof-input")).toBeInTheDocument();
    expect(getByText(/Photo proof needed/i)).toBeInTheDocument();
    // Complete is disabled until a file is picked.
    expect(getByTestId("job-card-complete")).toBeDisabled();
  });

  it("renders the completed (waiting-for-approval) state", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <JobCard job={jobFixture()} status="completed" />,
    );
    const card = getByTestId("job-card");
    expect(card).toHaveAttribute("data-status", "completed");
    expect(getByText(/Waiting for Mummy or Daddy/i)).toBeInTheDocument();
  });

  it("renders the must-do priority badge when priority === 'mustDo'", () => {
    const { container } = renderWithProviders(
      <JobCard
        job={jobFixture()}
        status="available"
        priority="mustDo"
        onStart={vi.fn()}
      />,
    );
    // The badge copy comes from priority_must_do translation key.
    expect(container).toHaveTextContent(/must do/i);
  });

  it("surfaces a rejection parentNote when re-offered as available", () => {
    const { container } = renderWithProviders(
      <JobCard
        job={jobFixture()}
        status="available"
        parentNote="Please re-fold the towels"
        onStart={vi.fn()}
      />,
    );
    expect(container).toHaveTextContent(/Please re-fold the towels/);
  });
});
