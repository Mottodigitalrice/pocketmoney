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
import type { Child, Job, JobInstance, JobInstanceWithJob } from "@/types";

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
    // Wave 7 — F10 5.3: with NO approved-ever instances (default fixture has
    // `jobInstances: []`), we render the first-day variant which carries the
    // "first job" framing rather than the legacy "caught up" copy.
    expect(container).toHaveTextContent(/first job|caught up/i);
    expect(container.querySelector('[data-testid="approval-card"]')).toBeNull();
  });

  // Wave 7 — F10 5.3: ApprovalQueue distinguishes first-day from recurring
  // caught-up empty states. The branch reads `jobInstances` from context — a
  // family with ANY approved instance ever flips to the caught-up copy.
  describe("F10 5.3 — first-day vs caught-up empty states", () => {
    function approvedInstance(id: string): JobInstance {
      return {
        _id: id,
        userId: "u1",
        jobId: JOB_TIDY._id,
        childId: CHILD_A._id,
        status: "approved",
        approvedAt: Date.UTC(2026, 4, 10, 12, 0, 0),
        createdAt: 0,
      };
    }

    it("renders the FIRST-DAY empty state when no instance has ever been approved", () => {
      const { getByTestId, container } = renderWithProviders(
        <ApprovalQueue />,
        {
          contextValue: {
            getPendingApprovals: () => [],
            jobInstances: [], // no history at all → first-day branch
          },
        },
      );
      expect(getByTestId("approval-queue-empty-first-day")).toBeInTheDocument();
      expect(container).toHaveTextContent(/first job/i);
      expect(container).toHaveTextContent(/add a job/i);
      // Caught-up testid MUST NOT be present.
      expect(
        container.querySelector(
          '[data-testid="approval-queue-empty-caught-up"]',
        ),
      ).toBeNull();
    });

    it("renders the CAUGHT-UP empty state when at least one instance was approved historically", () => {
      const { getByTestId, container } = renderWithProviders(
        <ApprovalQueue />,
        {
          contextValue: {
            getPendingApprovals: () => [],
            jobInstances: [approvedInstance("hist-1")],
          },
        },
      );
      expect(getByTestId("approval-queue-empty-caught-up")).toBeInTheDocument();
      expect(container).toHaveTextContent(/all caught up/i);
      // First-day testid MUST NOT be present.
      expect(
        container.querySelector(
          '[data-testid="approval-queue-empty-first-day"]',
        ),
      ).toBeNull();
    });

    it("renders the queue (not any empty state) when pending approvals exist", () => {
      const { container } = renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [pendingInstance("inst-q1")],
          getChildById: () => CHILD_A,
          jobInstances: [approvedInstance("hist-1")],
        },
      });
      // Neither empty-state shell renders when there's at least one pending.
      expect(
        container.querySelector(
          '[data-testid="approval-queue-empty-first-day"]',
        ),
      ).toBeNull();
      expect(
        container.querySelector(
          '[data-testid="approval-queue-empty-caught-up"]',
        ),
      ).toBeNull();
      expect(
        container.querySelector('[data-testid="approval-card"]'),
      ).not.toBeNull();
    });
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
