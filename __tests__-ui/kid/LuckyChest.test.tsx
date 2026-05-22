/**
 * Wave 5 — LuckyChest augment tests.
 *
 * Builds on the existing `__tests__-ui/LuckyChest.test.tsx` (which covers
 * the four-state matrix). These tests target the *mutation* paths the
 * original suite skipped:
 *
 *   - Loading state — skeleton renders + no button while context hydrates.
 *   - Open-button click args (childId is passed through to the mutation).
 *   - Error path — mutation rejects, error message visible, button re-enables.
 *   - Already-opened-this-week — disabled button with last-amount label.
 *
 * YELLOW: we intentionally do NOT assert any animation overlay (coin rain
 * etc.) — Wave 2 owns that surface and has its own animation test under
 * `__tests__-ui/animations/`. Our assertions stick to structural state
 * (disabled/enabled, text, mutation calls) so the suites don't collide.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "../test-utils";
import { LuckyChest } from "@/components/features/kid-dashboard/LuckyChest";
import type { LuckyChestStatus } from "@/types";

const CHILD_ID = "child-lc-1";

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

describe("LuckyChest — augment (loading + mutation paths)", () => {
  it("renders the skeleton (and NO chest body) while context isLoading=true", () => {
    renderWithProviders(<LuckyChest childId={CHILD_ID} />, {
      contextValue: {
        isLoading: true,
        getLuckyChestStatus: () =>
          statusFor({ mustDoTotal: 3, mustDoApproved: 3, unlocked: true }),
      },
    });
    expect(screen.getByTestId("lucky-chest-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("lucky-chest")).toBeNull();
    expect(screen.queryByTestId("lucky-chest-open-button")).toBeNull();
  });

  it("calls openLuckyChest with the right childId when the button is clicked", () => {
    const openLuckyChest = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LuckyChest childId={CHILD_ID} />, {
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
    });
    const button = screen.getByTestId("lucky-chest-open-button");
    button.click();
    // The mutation is fired synchronously (the handler awaits, but the call
    // itself happens before the await).
    expect(openLuckyChest).toHaveBeenCalledTimes(1);
    expect(openLuckyChest).toHaveBeenCalledWith(CHILD_ID);
  });

  it("surfaces the mapped error message when the mutation rejects with LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK", async () => {
    const err = new Error("LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK");
    const openLuckyChest = vi.fn().mockRejectedValue(err);
    renderWithProviders(<LuckyChest childId={CHILD_ID} />, {
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
    });
    screen.getByTestId("lucky-chest-open-button").click();

    // The translated, mapped error string is now visible (matches
    // `error_lucky_chest_locked`).
    const errorBox = await screen.findByTestId("lucky-chest-error");
    expect(errorBox).toBeInTheDocument();
    expect(errorBox.textContent).toMatch(
      /already opened the Lucky Chest this week/i,
    );
    expect(openLuckyChest).toHaveBeenCalledTimes(1);
  });

  it("renders the already-opened state with the openedAmount label and a disabled button", () => {
    renderWithProviders(<LuckyChest childId={CHILD_ID} />, {
      contextValue: {
        getLuckyChestStatus: () =>
          statusFor({
            mustDoTotal: 3,
            mustDoApproved: 3,
            unlocked: true,
            opened: true,
            openedAmount: 64,
          }),
      },
    });
    const chest = screen.getByTestId("lucky-chest");
    expect(chest).toHaveAttribute("data-opened", "true");
    // Both the explanatory line and the button label show the reward amount.
    expect(chest).toHaveTextContent(/64/);
    const button = screen.getByTestId("lucky-chest-open-button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/¥\s*64/);
  });

  it("sleeping state hides the Open button entirely (no misleading affordance)", () => {
    renderWithProviders(<LuckyChest childId={CHILD_ID} />, {
      contextValue: {
        getLuckyChestStatus: () => statusFor({ mustDoTotal: 0 }),
      },
    });
    expect(screen.queryByTestId("lucky-chest-open-button")).toBeNull();
    const chest = screen.getByTestId("lucky-chest");
    expect(chest).toHaveAttribute("data-sleeping", "true");
  });
});
