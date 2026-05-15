/**
 * H1 — JobForm component tests.
 *
 * Radix-portaled dialog form. Mounts only when `open=true`. We render the
 * form open and drive it via fireEvent to exercise validation + submit paths.
 *
 * Covered:
 *   - Empty title prevents submission (onSave NOT fired).
 *   - Valid title + yen submits with the correct payload shape.
 *   - photo-proof Switch toggles `requiresPhotoProof` on the saved payload.
 *   - Yen number input round-trips via the controlled state and reflects
 *     into the payload.
 *   - Cancel button fires onClose (and NOT onSave).
 *
 * Dialog body queries route through `screen` because Radix portals the content
 * outside the test container.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "./test-utils";
import { JobForm } from "@/components/features/parent-dashboard/JobForm";

describe("JobForm", () => {
  it("does not call onSave when the title is empty (whitespace only)", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <JobForm open onClose={onClose} onSave={onSave} />,
    );
    // Title default is "" for add-new. Submit immediately.
    const form = screen.getByLabelText(/Job Name/i).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onSave with the form values when title + yen are valid", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <JobForm open onClose={onClose} onSave={onSave} />,
    );

    const titleInput = screen.getByLabelText(/Job Name/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Walk the dog" } });

    const yenInput = screen.getByLabelText(/Yen Amount/i) as HTMLInputElement;
    fireEvent.change(yenInput, { target: { value: "250" } });

    fireEvent.submit(titleInput.closest("form")!);

    // Microtask: onSave fires inside an async handler — flush queue.
    await Promise.resolve();
    await Promise.resolve();

    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0]?.[0];
    expect(payload).toBeDefined();
    expect(payload.title).toBe("Walk the dog");
    expect(payload.yenAmount).toBe(250);
    expect(payload.icon).toBe("👕"); // default icon
    expect(payload.requiresPhotoProof).toBe(false);
    expect(payload.recurrence).toEqual({
      type: "none",
      priority: "optional",
    });
    // After save, the form auto-closes.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("submits with requiresPhotoProof=true when the photo-proof Switch is toggled on", async () => {
    const onSave = vi.fn();
    renderWithProviders(
      <JobForm open onClose={vi.fn()} onSave={onSave} />,
    );

    const titleInput = screen.getByLabelText(/Job Name/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Make bed" } });

    // Radix Switch renders as a button with role=switch.
    const photoSwitch = screen.getByRole("switch");
    fireEvent.click(photoSwitch);

    fireEvent.submit(titleInput.closest("form")!);
    await Promise.resolve();
    await Promise.resolve();

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]?.[0]?.requiresPhotoProof).toBe(true);
  });

  it("submits the yen value the user typed (controlled number input)", async () => {
    const onSave = vi.fn();
    renderWithProviders(
      <JobForm open onClose={vi.fn()} onSave={onSave} />,
    );

    const titleInput = screen.getByLabelText(/Job Name/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Tidy" } });

    const yenInput = screen.getByLabelText(/Yen Amount/i) as HTMLInputElement;
    fireEvent.change(yenInput, { target: { value: "30" } });
    expect(yenInput.value).toBe("30");

    fireEvent.submit(titleInput.closest("form")!);
    await Promise.resolve();
    await Promise.resolve();

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]?.[0]?.yenAmount).toBe(30);
  });

  it("calls onClose (and NOT onSave) when the Cancel button is clicked", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <JobForm open onClose={onClose} onSave={onSave} />,
    );

    // `job_form_cancel` → "Cancel".
    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
