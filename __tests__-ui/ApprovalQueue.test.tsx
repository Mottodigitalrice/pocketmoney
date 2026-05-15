/**
 * H1 — ApprovalQueue component tests.
 *
 * The queue is parent-side: it pulls pending approvals from context via
 * `getPendingApprovals()` and renders one ApprovalCard per item. We mock the
 * context so we don't need a real Convex client.
 *
 * Covers:
 *   - Skeleton renders while `isLoading=true`.
 *   - Empty state (no pending) shows the F11 onboarding copy.
 *   - Single pending row renders an ApprovalCard with both action buttons.
 *   - Clicking Approve fires the `approveJob` mutation with the instance id.
 *   - Clicking Reject opens the styled dialog (S6, R4 — previously
 *     window.prompt) and calls `rejectJob` with the trimmed note on submit.
 *     Cancel + empty submits MUST NOT call rejectJob.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, fireEvent, screen } from "./test-utils";
import { ApprovalQueue } from "@/components/features/parent-dashboard/ApprovalQueue";
import type { Child, Job, JobInstanceWithJob } from "@/types";

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
  yenAmount: 200,
  icon: "🧹",
  createdAt: 0,
};

function pendingInstance(
  id: string,
  childId: string = CHILD_A._id,
): JobInstanceWithJob {
  return {
    _id: id,
    userId: "u1",
    jobId: JOB_TIDY._id,
    childId,
    status: "completed",
    completedAt: Date.UTC(2026, 4, 13, 12, 0, 0),
    createdAt: 0,
    job: JOB_TIDY,
  };
}

describe("ApprovalQueue", () => {
  it("renders the skeleton while context is hydrating", () => {
    const { getByTestId, container } = renderWithProviders(<ApprovalQueue />, {
      contextValue: { isLoading: true },
    });
    expect(getByTestId("approval-queue-skeleton")).toBeInTheDocument();
    // The real list should NOT render alongside the skeleton.
    expect(container.querySelector('[data-testid="approval-card"]')).toBeNull();
  });

  it("shows the empty-state copy when no approvals are pending", () => {
    const { container } = renderWithProviders(<ApprovalQueue />, {
      contextValue: {
        getPendingApprovals: () => [],
      },
    });
    // F11 empty title comes from the approvals_empty_title key — match a
    // distinctive fragment so we're not bound to exact punctuation.
    expect(container).toHaveTextContent(/nothing waiting|caught up/i);
    expect(container.querySelector('[data-testid="approval-card"]')).toBeNull();
  });

  it("renders an ApprovalCard for a single pending instance and wires approve", () => {
    const approveJob = vi.fn();
    const { getByTestId, getAllByTestId } = renderWithProviders(
      <ApprovalQueue />,
      {
        contextValue: {
          getPendingApprovals: () => [pendingInstance("inst-1")],
          getChildById: () => CHILD_A,
          approveJob,
        },
      },
    );

    const cards = getAllByTestId("approval-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute("data-instance-id", "inst-1");

    // Approve button copy comes from `approval_approve` translation.
    const approveBtn = getByTestId("approval-card").querySelector("button");
    // Two buttons: approve (first) + reject. We just click the first.
    expect(approveBtn).not.toBeNull();
    fireEvent.click(approveBtn!);
    expect(approveJob).toHaveBeenCalledTimes(1);
    expect(approveJob).toHaveBeenCalledWith("inst-1");
  });

  describe("reject flow (S6, R4 — styled dialog replaces window.prompt)", () => {
    it("opens the reject-note dialog when the reject button is clicked", () => {
      const rejectJob = vi.fn();
      const { getByTestId } = renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [pendingInstance("inst-2")],
          getChildById: () => CHILD_A,
          rejectJob,
        },
      });
      // Dialog hidden before click.
      expect(screen.queryByTestId("reject-note-dialog")).toBeNull();

      const buttons = getByTestId("approval-card").querySelectorAll("button");
      const rejectBtn = buttons[buttons.length - 1];
      fireEvent.click(rejectBtn!);

      // Dialog renders into document.body via Radix portal.
      expect(screen.getByTestId("reject-note-dialog")).toBeInTheDocument();
      // rejectJob NOT called yet — the parent still has to type + submit.
      expect(rejectJob).not.toHaveBeenCalled();
    });

    it("fires rejectJob with the trimmed note when the dialog submit fires", () => {
      const rejectJob = vi.fn();
      const { getByTestId } = renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [pendingInstance("inst-2")],
          getChildById: () => CHILD_A,
          rejectJob,
        },
      });
      const buttons = getByTestId("approval-card").querySelectorAll("button");
      const rejectBtn = buttons[buttons.length - 1];
      fireEvent.click(rejectBtn!);

      // Type into the textarea with padding to verify trim() runs.
      const textarea = screen.getByTestId("reject-note-textarea");
      fireEvent.change(textarea, { target: { value: "  Please redo it  " } });
      // Submit.
      const submitBtn = screen.getByTestId("reject-note-submit");
      fireEvent.click(submitBtn);

      expect(rejectJob).toHaveBeenCalledTimes(1);
      expect(rejectJob).toHaveBeenCalledWith("inst-2", "Please redo it");
    });

    it("blocks the submit + shows the empty-error when the textarea is blank", () => {
      const rejectJob = vi.fn();
      const { getByTestId } = renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [pendingInstance("inst-3")],
          getChildById: () => CHILD_A,
          rejectJob,
        },
      });
      const buttons = getByTestId("approval-card").querySelectorAll("button");
      const rejectBtn = buttons[buttons.length - 1];
      fireEvent.click(rejectBtn!);

      // Submit with empty textarea.
      fireEvent.click(screen.getByTestId("reject-note-submit"));

      // Inline error appears, rejectJob never fires.
      expect(screen.getByTestId("reject-note-empty-error")).toBeInTheDocument();
      expect(rejectJob).not.toHaveBeenCalled();
    });

    it("does NOT call rejectJob when the parent cancels the dialog", () => {
      const rejectJob = vi.fn();
      const { getByTestId } = renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [pendingInstance("inst-4")],
          getChildById: () => CHILD_A,
          rejectJob,
        },
      });
      const buttons = getByTestId("approval-card").querySelectorAll("button");
      const rejectBtn = buttons[buttons.length - 1];
      fireEvent.click(rejectBtn!);

      // Type something then bail.
      const textarea = screen.getByTestId("reject-note-textarea");
      fireEvent.change(textarea, { target: { value: "Never mind" } });
      fireEvent.click(screen.getByTestId("reject-note-cancel"));

      expect(rejectJob).not.toHaveBeenCalled();
    });
  });
});
