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
import { renderWithProviders, fireEvent, screen, waitFor } from "./test-utils";
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

  // Wave 8b — bulk-approve. Parent reviewing 5+ kids' weekly chores wants
  // to multi-select instead of clicking Approve once per row. Tests cover
  // the gating threshold (≥2 pending), the selection mechanics, the
  // sequential mutation loop, in-flight UX, the success toast, and the
  // partial-failure path.
  describe("Wave 8b — bulk-approve", () => {
    it("hides the select-all checkbox when only 1 pending instance", () => {
      renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [pendingInstance("inst-solo")],
          getChildById: () => CHILD_A,
        },
      });
      expect(
        screen.queryByTestId("approval-queue-select-all"),
      ).not.toBeInTheDocument();
      // Bulk bar is also hidden because nothing is selected (and could
      // not be — there's no checkbox to flip).
      expect(
        screen.queryByTestId("approval-queue-bulk-bar"),
      ).not.toBeInTheDocument();
    });

    it("shows select-all + per-card checkboxes when ≥2 pending", () => {
      renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [
            pendingInstance("inst-a"),
            pendingInstance("inst-b"),
            pendingInstance("inst-c"),
          ],
          getChildById: () => CHILD_A,
        },
      });
      expect(
        screen.getByTestId("approval-queue-select-all"),
      ).toBeInTheDocument();
      expect(screen.getAllByTestId("approval-card-checkbox")).toHaveLength(3);
    });

    it("select-all checkbox flips every card's checkbox", () => {
      renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [
            pendingInstance("inst-a"),
            pendingInstance("inst-b"),
            pendingInstance("inst-c"),
          ],
          getChildById: () => CHILD_A,
        },
      });
      fireEvent.click(screen.getByTestId("approval-queue-select-all-checkbox"));
      const boxes = screen.getAllByTestId(
        "approval-card-checkbox",
      ) as HTMLInputElement[];
      expect(boxes.every((b) => b.checked)).toBe(true);
      // Bulk bar now shows with the count.
      expect(
        screen.getByTestId("approval-queue-bulk-approve"),
      ).toHaveTextContent(/3 selected/);
    });

    it("toggling a single card's checkbox does NOT touch the others", () => {
      renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [
            pendingInstance("inst-a"),
            pendingInstance("inst-b"),
            pendingInstance("inst-c"),
          ],
          getChildById: () => CHILD_A,
        },
      });
      const boxes = screen.getAllByTestId(
        "approval-card-checkbox",
      ) as HTMLInputElement[];
      fireEvent.click(boxes[1]!);
      expect(boxes[0]!.checked).toBe(false);
      expect(boxes[1]!.checked).toBe(true);
      expect(boxes[2]!.checked).toBe(false);
      expect(
        screen.getByTestId("approval-queue-bulk-approve"),
      ).toHaveTextContent(/1 selected/);
    });

    it("clicking bulk-approve calls approveJob once per selected instance", async () => {
      const approveJob = vi.fn(() => Promise.resolve());
      renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [
            pendingInstance("inst-a"),
            pendingInstance("inst-b"),
            pendingInstance("inst-c"),
          ],
          getChildById: () => CHILD_A,
          approveJob,
        },
      });
      // Select-all then fire bulk.
      fireEvent.click(screen.getByTestId("approval-queue-select-all-checkbox"));
      fireEvent.click(screen.getByTestId("approval-queue-bulk-approve"));

      await waitFor(() => {
        expect(approveJob).toHaveBeenCalledTimes(3);
      });
      expect(approveJob).toHaveBeenNthCalledWith(1, "inst-a");
      expect(approveJob).toHaveBeenNthCalledWith(2, "inst-b");
      expect(approveJob).toHaveBeenNthCalledWith(3, "inst-c");
    });

    it("shows a success toast + clears selection when every approval succeeds", async () => {
      const approveJob = vi.fn(() => Promise.resolve());
      renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [
            pendingInstance("inst-a"),
            pendingInstance("inst-b"),
          ],
          getChildById: () => CHILD_A,
          approveJob,
        },
      });
      fireEvent.click(screen.getByTestId("approval-queue-select-all-checkbox"));
      fireEvent.click(screen.getByTestId("approval-queue-bulk-approve"));

      await waitFor(() => {
        expect(
          screen.getByTestId("approval-queue-bulk-result"),
        ).toBeInTheDocument();
      });
      const result = screen.getByTestId("approval-queue-bulk-result");
      expect(result).toHaveAttribute("data-failed-count", "0");
      // Two instances at ¥200 each → ¥400 total.
      expect(result).toHaveTextContent(/¥400/);

      // Selection cleared → bulk bar gone (no in-flight either).
      await waitFor(() => {
        expect(
          screen.queryByTestId("approval-queue-bulk-bar"),
        ).not.toBeInTheDocument();
      });
    });

    it("disables the bulk button + announces progress while in flight", async () => {
      // Hand-rolled deferred promise so we can pause the loop between
      // iterations and assert the UI mid-flight.
      let resolveFirst: () => void = () => {};
      const firstPromise = new Promise<void>((r) => {
        resolveFirst = r;
      });
      const approveJob = vi
        .fn()
        // First call blocks until we manually resolve it.
        .mockImplementationOnce(() => firstPromise)
        .mockImplementation(() => Promise.resolve());

      renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [
            pendingInstance("inst-a"),
            pendingInstance("inst-b"),
          ],
          getChildById: () => CHILD_A,
          approveJob,
        },
      });
      fireEvent.click(screen.getByTestId("approval-queue-select-all-checkbox"));
      const bulkBtn = screen.getByTestId(
        "approval-queue-bulk-approve",
      ) as HTMLButtonElement;
      fireEvent.click(bulkBtn);

      // Button disabled, progress copy visible.
      await waitFor(() => {
        expect(bulkBtn).toBeDisabled();
      });
      expect(bulkBtn).toHaveTextContent(/1 of 2/);
      // aria-live region announces the same.
      expect(screen.getByTestId("approval-queue-bulk-live")).toHaveTextContent(
        /1 of 2/,
      );

      // Let the loop finish.
      resolveFirst();
      await waitFor(() => {
        expect(
          screen.getByTestId("approval-queue-bulk-result"),
        ).toBeInTheDocument();
      });
    });

    it("partial failure: surfaces failed count + highlights failed card + keeps it selected", async () => {
      const approveJob = vi
        .fn()
        .mockImplementationOnce(() => Promise.resolve())
        // Second instance fails with a Convex-shaped error.
        .mockImplementationOnce(() =>
          Promise.reject(new Error("already approved")),
        )
        .mockImplementation(() => Promise.resolve());

      renderWithProviders(<ApprovalQueue />, {
        contextValue: {
          getPendingApprovals: () => [
            pendingInstance("inst-a"),
            pendingInstance("inst-b"),
            pendingInstance("inst-c"),
          ],
          getChildById: () => CHILD_A,
          approveJob,
        },
      });
      fireEvent.click(screen.getByTestId("approval-queue-select-all-checkbox"));
      fireEvent.click(screen.getByTestId("approval-queue-bulk-approve"));

      await waitFor(() => {
        expect(
          screen.getByTestId("approval-queue-bulk-result"),
        ).toBeInTheDocument();
      });
      const result = screen.getByTestId("approval-queue-bulk-result");
      expect(result).toHaveAttribute("data-failed-count", "1");
      expect(result).toHaveTextContent(/Approved 2 of 3/);

      // Failed card highlighted via data-failed attribute.
      const cards = screen.getAllByTestId("approval-card");
      const failedCard = cards.find(
        (c) => c.getAttribute("data-instance-id") === "inst-b",
      );
      expect(failedCard).toHaveAttribute("data-failed", "true");

      // Failed instance stays selected for retry; successful ones cleared.
      const boxesAfter = screen.getAllByTestId(
        "approval-card-checkbox",
      ) as HTMLInputElement[];
      const failedBox = cards
        .find((c) => c.getAttribute("data-instance-id") === "inst-b")
        ?.querySelector(
          '[data-testid="approval-card-checkbox"]',
        ) as HTMLInputElement;
      expect(failedBox.checked).toBe(true);
      expect(boxesAfter.filter((b) => b.checked)).toHaveLength(1);
    });
  });
});
