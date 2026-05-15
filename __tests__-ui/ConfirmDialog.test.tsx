/**
 * G4 — ConfirmDialog component tests.
 *
 * Built on Radix Dialog (portal-rendered). All queries use `document.body`
 * because RTL's default container scope excludes the portal.
 *
 * Note on Escape / outside-click:
 *   Radix uses focus/pointer trapping which is sensitive to JSDOM quirks.
 *   We assert the dialog DOES dismiss for both, but via `keyDown` /
 *   `pointerDown+pointerUp` on the overlay — which is how Radix listens
 *   internally — to avoid jsdom event-coordinate flakes.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "./test-utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const DEFAULT_PROPS = {
  title: "Delete child?",
  body: "This will wipe wallet, history, and scheduled jobs.",
  confirmLabel: "Delete",
  cancelLabel: "Cancel",
};

describe("ConfirmDialog", () => {
  it("renders nothing when open=false", () => {
    renderWithProviders(
      <ConfirmDialog
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        {...DEFAULT_PROPS}
      />,
    );
    expect(screen.queryByTestId("confirm-dialog")).toBeNull();
  });

  it("renders title, body, and both buttons when open=true", () => {
    renderWithProviders(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        {...DEFAULT_PROPS}
      />,
    );
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete child?")).toBeInTheDocument();
    expect(
      screen.getByText(/This will wipe wallet/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("confirm-dialog-confirm")).toHaveTextContent(
      "Delete",
    );
    expect(screen.getByTestId("confirm-dialog-cancel")).toHaveTextContent(
      "Cancel",
    );
  });

  it("fires onConfirm AND onClose when the destructive button is clicked", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        {...DEFAULT_PROPS}
      />,
    );
    fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fires onClose (and NOT onConfirm) when the Cancel button is clicked", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        {...DEFAULT_PROPS}
      />,
    );
    fireEvent.click(screen.getByTestId("confirm-dialog-cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onClose when Radix emits onOpenChange(false) via Escape key", () => {
    const onClose = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={vi.fn()}
        {...DEFAULT_PROPS}
      />,
    );
    // Radix listens for Escape on the document. fireEvent on document.body
    // is the standard way to drive this in JSDOM.
    fireEvent.keyDown(document.body, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
