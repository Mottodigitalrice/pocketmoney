/**
 * S3 (R4) — WeeklyTracker component tests.
 *
 * Covers F10 punchlist 6.5: when a kid hasn't earned anything yet this week
 * BUT there's something planned (potential > 0), surface a "Do your chores to
 * fill the chest!" nudge. Hidden on planning-only weeks (potential === 0) so
 * we don't shame a kid on a no-work week.
 *
 * Also pins the negative cases so the hint can't drift onto the wrong screen.
 */
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "./test-utils";
import { WeeklyTracker } from "@/components/features/kid-dashboard/WeeklyTracker";

const CHILD_ID = "child-test";

describe("WeeklyTracker — S3 (R4) zero-earnings nudge (F10 6.5)", () => {
  it("renders the zero-earnings hint when earned === 0 and potential > 0", () => {
    renderWithProviders(<WeeklyTracker childId={CHILD_ID} />, {
      contextValue: {
        getWeeklyEarnings: () => 0,
        getWeeklyPotential: () => 500,
        getWalletBalance: () => 0,
        getWalletTotal: () => 0,
      },
    });
    const hint = screen.getByTestId("weekly-tracker-zero-hint");
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveTextContent(/Do your chores to fill the chest/i);
  });

  it("does NOT render the hint on a planning-only week (potential === 0)", () => {
    renderWithProviders(<WeeklyTracker childId={CHILD_ID} />, {
      contextValue: {
        getWeeklyEarnings: () => 0,
        getWeeklyPotential: () => 0,
        getWalletBalance: () => 0,
        getWalletTotal: () => 0,
      },
    });
    // No earnings + no potential → no nudge. Don't shame a kid on a no-work
    // week (school holidays, vacation, etc.).
    expect(screen.queryByTestId("weekly-tracker-zero-hint")).toBeNull();
  });

  it("does NOT render the hint once the kid has earned something (earned > 0)", () => {
    renderWithProviders(<WeeklyTracker childId={CHILD_ID} />, {
      contextValue: {
        getWeeklyEarnings: () => 100,
        getWeeklyPotential: () => 500,
        getWalletBalance: () => 0,
        getWalletTotal: () => 100,
      },
    });
    // First credit in — nudge is gone, the progress bar carries the message.
    expect(screen.queryByTestId("weekly-tracker-zero-hint")).toBeNull();
  });

  it("renders the JP version of the zero-earnings hint", () => {
    renderWithProviders(<WeeklyTracker childId={CHILD_ID} />, {
      initialLang: "ja",
      contextValue: {
        getWeeklyEarnings: () => 0,
        getWeeklyPotential: () => 500,
        getWalletBalance: () => 0,
        getWalletTotal: () => 0,
      },
    });
    const hint = screen.getByTestId("weekly-tracker-zero-hint");
    expect(hint).toBeInTheDocument();
    // Distinctive JP phrase fragment.
    expect(hint).toHaveTextContent(/たからばこ/);
  });
});
