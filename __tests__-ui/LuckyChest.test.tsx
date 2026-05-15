/**
 * G4 — LuckyChest component tests.
 *
 * Covers the four-state matrix:
 *   - Sleeping  (mustDoTotal === 0)
 *   - Locked    (0 < mustDoApproved < mustDoTotal)
 *   - Unlocked  (mustDoApproved === mustDoTotal && !opened)
 *   - Opened    (opened === true)
 *
 * Plus: clicking the Open button invokes the openLuckyChest mutation.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "./test-utils";
import { LuckyChest } from "@/components/features/kid-dashboard/LuckyChest";
import type { LuckyChestStatus } from "@/types";

const CHILD_ID = "child-1";

function statusFor(overrides: Partial<LuckyChestStatus>): LuckyChestStatus {
  return {
    childId: CHILD_ID,
    weekStart: "2026-05-11",
    unlocked: false,
    opened: false,
    maxAmount: 100,
    mustDoTotal: 0,
    mustDoApproved: 0,
    ...overrides,
  };
}

describe("LuckyChest", () => {
  it("renders the sleeping state when no must-do jobs exist", () => {
    const { getByTestId, queryByTestId, getByText } = renderWithProviders(
      <LuckyChest childId={CHILD_ID} />,
      {
        contextValue: {
          getLuckyChestStatus: () => statusFor({ mustDoTotal: 0 }),
        },
      },
    );
    const chest = getByTestId("lucky-chest");
    expect(chest).toHaveAttribute("data-sleeping", "true");
    expect(chest).toHaveAttribute("data-unlocked", "false");
    expect(chest).toHaveAttribute("data-opened", "false");
    // Sleeping state has no Open button — would be misleading.
    expect(queryByTestId("lucky-chest-open-button")).toBeNull();
    // Sleeping-specific copy.
    expect(getByText(/sleeping/i)).toBeInTheDocument();
  });

  it("renders the locked state with progress when some must-dos are done", () => {
    const { getByTestId } = renderWithProviders(
      <LuckyChest childId={CHILD_ID} />,
      {
        contextValue: {
          getLuckyChestStatus: () =>
            statusFor({ mustDoTotal: 5, mustDoApproved: 2, unlocked: false }),
        },
      },
    );
    const chest = getByTestId("lucky-chest");
    expect(chest).toHaveAttribute("data-unlocked", "false");
    expect(chest).toHaveAttribute("data-opened", "false");
    // Locked copy interpolates "2 / 5 must-do jobs".
    expect(chest).toHaveTextContent(/2.*\/.*5/);
    const button = getByTestId("lucky-chest-open-button");
    expect(button).toBeDisabled();
  });

  it("renders the unlocked state with an enabled Open button", () => {
    const { getByTestId, queryByText } = renderWithProviders(
      <LuckyChest childId={CHILD_ID} />,
      {
        contextValue: {
          getLuckyChestStatus: () =>
            statusFor({
              mustDoTotal: 3,
              mustDoApproved: 3,
              unlocked: true,
              opened: false,
              maxAmount: 200,
            }),
        },
      },
    );
    const chest = getByTestId("lucky-chest");
    expect(chest).toHaveAttribute("data-unlocked", "true");
    expect(chest).toHaveAttribute("data-opened", "false");
    const button = getByTestId("lucky-chest-open-button");
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent(/open/i);
    // Unlocked copy mentions the max payout.
    expect(queryByText(/200/)).toBeInTheDocument();
  });

  it("renders the opened state with the reward amount and disabled button", () => {
    const { getByTestId } = renderWithProviders(
      <LuckyChest childId={CHILD_ID} />,
      {
        contextValue: {
          getLuckyChestStatus: () =>
            statusFor({
              mustDoTotal: 3,
              mustDoApproved: 3,
              unlocked: true,
              opened: true,
              openedAmount: 87,
              maxAmount: 100,
            }),
        },
      },
    );
    const chest = getByTestId("lucky-chest");
    expect(chest).toHaveAttribute("data-opened", "true");
    expect(chest).toHaveTextContent(/87/);
    const button = getByTestId("lucky-chest-open-button");
    expect(button).toBeDisabled();
    // Button shows the reward, not "Open" copy.
    expect(button).toHaveTextContent(/¥\s*87/);
  });

  it("invokes openLuckyChest with the childId when the button is clicked", async () => {
    const openLuckyChest = vi.fn().mockResolvedValue(undefined);
    const { getByTestId, findByTestId } = renderWithProviders(
      <LuckyChest childId={CHILD_ID} />,
      {
        contextValue: {
          openLuckyChest,
          getLuckyChestStatus: () =>
            statusFor({
              mustDoTotal: 3,
              mustDoApproved: 3,
              unlocked: true,
              opened: false,
            }),
        },
      },
    );

    // Use a plain click — userEvent's pointerEvents check can be flaky with
    // motion-wrapped buttons. fireEvent stays sturdy here.
    const button = getByTestId("lucky-chest-open-button");
    button.click();

    // After the click resolves, the mutation has been called with the childId.
    // We assert via the spy synchronously because the handler awaits the
    // promise but the call itself is synchronous.
    expect(openLuckyChest).toHaveBeenCalledTimes(1);
    expect(openLuckyChest).toHaveBeenCalledWith(CHILD_ID);

    // Re-query to ensure rendering didn't crash post-click.
    expect(await findByTestId("lucky-chest")).toBeInTheDocument();
  });
});
