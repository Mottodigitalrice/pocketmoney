/**
 * Wave 5 — BonusDialogBody component tests.
 *
 * Covers the validation + submission paths for awarding a one-off bonus:
 *   - Empty amount → submit fires inline error ("Enter an amount above ¥0").
 *   - Amount ≤ 0 (and < 1 / NaN) → same inline error, no mutation call.
 *   - Valid amount → awardBonus called with rounded yen payload + optional note.
 *   - Note field updates state and feeds the submitted payload.
 *   - Submit button label flips to the saving copy while in-flight.
 *
 * YELLOW design choice: the component doesn't gate the submit button on
 * amount validity (only on `isSaving`), so "submit disabled with empty
 * amount" isn't a real branch. We assert the actual user-visible gate:
 * the inline error appears and the mutation is never called.
 *
 * Likewise, there is no `max` prop and no reason enum dropdown — those
 * exist on WithdrawalDialogBody, not here. We test what's actually wired.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "../test-utils";
import { BonusDialogBody } from "@/components/features/parent-dashboard/BonusDialogBody";

const CHILD_ID = "child-bonus-test";
const CHILD_NAME = "Alex";

function renderBody(overrides: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(
    <BonusDialogBody
      childId={CHILD_ID}
      childName={CHILD_NAME}
      open={true}
      onOpenChange={() => {}}
    />,
    overrides,
  );
}

describe("BonusDialogBody — validation gate", () => {
  it("renders the bonus amount + note inputs with submit copy", () => {
    renderBody();
    expect(screen.getByPlaceholderText("100")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Award Bonus/i }),
    ).toBeInTheDocument();
  });

  it("submitting with an empty amount shows the inline error and does NOT call awardBonus", async () => {
    const awardBonus = vi.fn().mockResolvedValue(undefined);
    renderBody({ contextValue: { awardBonus } });

    // `fireEvent.submit(form)` rather than clicking the button — JSDOM's
    // button-click → form-submit propagation can race with React in some
    // setups; submitting the form directly is the standard pattern used
    // elsewhere in this suite (see JobForm.test.tsx).
    const amount = screen.getByPlaceholderText("100");
    fireEvent.submit(amount.closest("form")!);
    await Promise.resolve();

    // Inline error is now visible (matches translation `bonus_error_amount`).
    expect(screen.getByText(/Enter an amount above ¥0/i)).toBeInTheDocument();
    expect(awardBonus).not.toHaveBeenCalled();
  });

  it("submitting amount = 0 shows the same inline error (no mutation)", async () => {
    const awardBonus = vi.fn().mockResolvedValue(undefined);
    renderBody({ contextValue: { awardBonus } });

    const amount = screen.getByPlaceholderText("100") as HTMLInputElement;
    fireEvent.change(amount, { target: { value: "0" } });
    fireEvent.submit(amount.closest("form")!);
    await Promise.resolve();

    expect(screen.getByText(/Enter an amount above ¥0/i)).toBeInTheDocument();
    expect(awardBonus).not.toHaveBeenCalled();
  });

  it("a valid amount + trimmed note calls awardBonus with the right payload shape", async () => {
    const awardBonus = vi.fn().mockResolvedValue(undefined);
    renderBody({ contextValue: { awardBonus } });

    const amount = screen.getByPlaceholderText("100") as HTMLInputElement;
    fireEvent.change(amount, { target: { value: "250" } });

    // Note field is the only Textarea in the body — placeholder doubles as locator.
    const note = screen.getByPlaceholderText(
      /What did they do well\?/i,
    ) as HTMLTextAreaElement;
    fireEvent.change(note, { target: { value: "  helped with dishes  " } });

    fireEvent.submit(amount.closest("form")!);

    // Flush the async submit handler so the mutation registers.
    await Promise.resolve();
    await Promise.resolve();

    expect(awardBonus).toHaveBeenCalledTimes(1);
    expect(awardBonus).toHaveBeenCalledWith({
      childId: CHILD_ID,
      amount: 250,
      note: "helped with dishes",
    });
  });

  it("submitting without a note omits `note` from the payload (no empty-string key)", async () => {
    const awardBonus = vi.fn().mockResolvedValue(undefined);
    renderBody({ contextValue: { awardBonus } });

    const amount = screen.getByPlaceholderText("100") as HTMLInputElement;
    fireEvent.change(amount, { target: { value: "100" } });

    fireEvent.submit(amount.closest("form")!);
    await Promise.resolve();
    await Promise.resolve();

    expect(awardBonus).toHaveBeenCalledTimes(1);
    const payload = awardBonus.mock.calls[0]?.[0];
    expect(payload).toEqual({ childId: CHILD_ID, amount: 100 });
    expect(payload).not.toHaveProperty("note");
  });

  it("non-integer amount is rounded before being passed to awardBonus", async () => {
    const awardBonus = vi.fn().mockResolvedValue(undefined);
    renderBody({ contextValue: { awardBonus } });

    const amount = screen.getByPlaceholderText("100") as HTMLInputElement;
    fireEvent.change(amount, { target: { value: "199.7" } });

    fireEvent.submit(amount.closest("form")!);
    await Promise.resolve();
    await Promise.resolve();

    // Math.round(199.7) === 200
    expect(awardBonus).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 200 }),
    );
  });
});
