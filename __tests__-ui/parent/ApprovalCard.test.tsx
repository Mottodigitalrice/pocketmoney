/**
 * Wave 5 — ApprovalCard component tests.
 *
 * Covers F20 Goal D — the tap-to-enlarge proof image overlay:
 *   - ESC key dismisses the preview.
 *   - Overlay backdrop click dismisses (the overlay listens for its own click).
 *   - Body scroll-lock applied while the overlay is up, restored on close.
 *   - The proof <img> only renders when `instance.proofUrl` is non-null.
 *   - Approve button → onApprove() is called.
 *   - Reject button → onReject() is called.
 *
 * YELLOW design choice: the component's `onApprove` / `onReject` props are
 * void-arg callbacks (the parent already closes over the instance id), so we
 * assert they fire as `toHaveBeenCalledTimes(1)` rather than checking an id
 * argument.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "../test-utils";
import { ApprovalCard } from "@/components/features/parent-dashboard/ApprovalCard";
import type { Job, JobInstance, Child } from "@/types";

const baseJob: Job = {
  _id: "job-1",
  userId: "user-1",
  title: "Walk the dog",
  yenAmount: 200,
  icon: "🐕",
  createdAt: 0,
};

const baseInstance: JobInstance & { job: Job } = {
  _id: "instance-1",
  userId: "user-1",
  jobId: "job-1",
  childId: "child-1",
  status: "completed",
  completedAt: Date.parse("2026-05-22T10:30:00Z"),
  createdAt: 0,
  job: baseJob,
};

const baseChild: Child = {
  _id: "child-1",
  userId: "user-1",
  name: "Alex",
  icon: "shark",
  createdAt: 0,
};

function renderCard(
  opts: {
    instance?: JobInstance & { job: Job };
    onApprove?: () => void;
    onReject?: () => void;
    child?: Child | undefined;
  } = {},
) {
  const onApprove = opts.onApprove ?? vi.fn();
  const onReject = opts.onReject ?? vi.fn();
  const child = "child" in opts ? opts.child : baseChild;
  const result = renderWithProviders(
    <ApprovalCard
      instance={opts.instance ?? baseInstance}
      onApprove={onApprove}
      onReject={onReject}
    />,
    {
      contextValue: {
        getChildById: () => child,
      },
    },
  );
  return { ...result, onApprove, onReject };
}

describe("ApprovalCard — proof preview overlay (F20 Goal D)", () => {
  it("does NOT render a proof image when proofUrl is absent", () => {
    // baseInstance has no `proofUrl` key already; pass it as-is so we exercise
    // the absent-key branch (tsconfig has exactOptionalPropertyTypes — we can't
    // assign `proofUrl: undefined` explicitly to a `string | null` optional).
    renderCard({ instance: baseInstance });
    expect(screen.queryByTestId("approval-card-proof-button")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders the proof image button when proofUrl is non-null", () => {
    renderCard({
      instance: {
        ...baseInstance,
        proofUrl: "https://example.com/proof.jpg",
      },
    });
    const btn = screen.getByTestId("approval-card-proof-button");
    expect(btn).toBeInTheDocument();
    const img = btn.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/proof.jpg");
  });

  it("locks body scroll while the preview overlay is open and restores it on close", () => {
    // Seed a known scroll-overflow so we can assert the restore path.
    document.body.style.overflow = "auto";
    renderCard({
      instance: {
        ...baseInstance,
        proofUrl: "https://example.com/proof.jpg",
      },
    });

    expect(document.body.style.overflow).toBe("auto");

    // Open the preview.
    fireEvent.click(screen.getByTestId("approval-card-proof-button"));
    expect(
      screen.getByTestId("approval-card-proof-preview"),
    ).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // Dismiss via ESC.
    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
    expect(screen.queryByTestId("approval-card-proof-preview")).toBeNull();
    // Body overflow restored to the value it had before the overlay opened.
    expect(document.body.style.overflow).toBe("auto");
  });

  it("clicking the overlay backdrop dismisses the preview", () => {
    renderCard({
      instance: {
        ...baseInstance,
        proofUrl: "https://example.com/proof.jpg",
      },
    });
    fireEvent.click(screen.getByTestId("approval-card-proof-button"));
    const overlay = screen.getByTestId("approval-card-proof-preview");
    expect(overlay).toBeInTheDocument();

    fireEvent.click(overlay);
    expect(screen.queryByTestId("approval-card-proof-preview")).toBeNull();
  });

  it("clicking the explicit close (X) button dismisses the preview", () => {
    renderCard({
      instance: {
        ...baseInstance,
        proofUrl: "https://example.com/proof.jpg",
      },
    });
    fireEvent.click(screen.getByTestId("approval-card-proof-button"));
    expect(
      screen.getByTestId("approval-card-proof-preview"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("approval-card-proof-preview-close"));
    expect(screen.queryByTestId("approval-card-proof-preview")).toBeNull();
  });
});

describe("ApprovalCard — action buttons", () => {
  it("clicking Approve fires the onApprove callback", () => {
    const { onApprove, onReject } = renderCard();
    // Approve button copy reads "Approve ✅" (translation `approval_approve`).
    fireEvent.click(screen.getByRole("button", { name: /Approve/i }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).not.toHaveBeenCalled();
  });

  it("clicking the reject CTA fires the onReject callback", () => {
    const { onApprove, onReject } = renderCard();
    // The reject button copy is "Try Again 🔄" — the do-over phrasing was
    // chosen so kids don't read "Rejected" as a final-state shame label.
    fireEvent.click(screen.getByRole("button", { name: /Try Again/i }));
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("falls back to 'Unknown (👤)' when getChildById returns undefined", () => {
    renderCard({ child: undefined });
    // Both the fallback name AND the fallback emoji are present.
    expect(screen.getByText(/Unknown/i)).toBeInTheDocument();
    expect(screen.getByText(/👤/)).toBeInTheDocument();
  });
});
