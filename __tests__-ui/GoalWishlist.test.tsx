/**
 * G4 — GoalWishlist component tests.
 *
 * Covers:
 *   - Empty state (no active goal) renders F11 onboarding copy.
 *   - Active goal: progress reflects saveBalance / targetAmount.
 *   - F14a "big dream" hint renders when remaining > saveBalance * 10.
 *   - Completed state: saveBalance >= targetAmount → 100% funded + "Ready!".
 *   - Skeleton variant renders when isLoading=true.
 */
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "./test-utils";
import { GoalWishlist } from "@/components/features/kid-dashboard/GoalWishlist";
import type { Goal } from "@/types";

const CHILD_ID = "child-1";

function goalFixture(overrides: Partial<Goal> = {}): Goal {
  return {
    _id: "goal-1",
    userId: "user-1",
    childId: CHILD_ID,
    title: "New skateboard",
    targetAmount: 5000,
    emoji: "🛹",
    status: "active",
    createdAt: 0,
    updatedAt: 1,
    ...overrides,
  };
}

describe("GoalWishlist", () => {
  it("shows the empty-state copy when there is no active goal", () => {
    const { container } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: {
          getActiveGoalForChild: () => undefined,
          getGoalsForChild: () => [],
          getWalletBalance: () => 0,
        },
      },
    );
    // F11 empty state — title + hint copy.
    expect(container).toHaveTextContent(/no goal yet|set your first goal|goal/i);
    // No emoji-tile + name should render for a non-existent goal.
    expect(container.querySelector("h3")).toBeNull();
  });

  it("renders an active goal with the correct progress percentage", () => {
    const { container } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: {
          getActiveGoalForChild: () => goalFixture({ targetAmount: 1000 }),
          getGoalsForChild: () => [goalFixture({ targetAmount: 1000 })],
          getWalletBalance: () => 250, // 25%
        },
      },
    );
    expect(container).toHaveTextContent("New skateboard");
    expect(container).toHaveTextContent("25%");
    // Remaining = 750
    expect(container).toHaveTextContent("750");
    // Progress bar inline style reflects the percentage.
    const bar = container.querySelector(
      ".bg-gradient-to-r.from-sky-300",
    ) as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar!.style.width).toBe("25%");
  });

  it("shows the big-dream hint when the goal is more than 10x what's saved", () => {
    const { getByTestId } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: {
          getActiveGoalForChild: () => goalFixture({ targetAmount: 5000 }),
          getGoalsForChild: () => [goalFixture({ targetAmount: 5000 })],
          // remaining = 4900, saveBalance * 10 = 1000, so 4900 > 1000 → hint fires.
          getWalletBalance: () => 100,
        },
      },
    );
    expect(getByTestId("goal-big-dream-hint")).toBeInTheDocument();
  });

  it("renders the completed state when saveBalance >= targetAmount", () => {
    const { container } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: {
          getActiveGoalForChild: () => goalFixture({ targetAmount: 500 }),
          getGoalsForChild: () => [goalFixture({ targetAmount: 500 })],
          getWalletBalance: () => 600,
        },
      },
    );
    expect(container).toHaveTextContent("100%");
    // "Ready!" copy replaces "¥X to go" once funded.
    expect(container).toHaveTextContent(/ready/i);
    // No big-dream hint when fully funded.
    expect(container.querySelector("[data-testid='goal-big-dream-hint']")).toBeNull();
  });

  it("renders the skeleton variant while context is hydrating", () => {
    const { getByTestId, container } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: { isLoading: true },
      },
    );
    expect(getByTestId("goal-wishlist-skeleton")).toBeInTheDocument();
    // Skeleton must NOT also render the real form below.
    expect(container.querySelector("form")).toBeNull();
  });
});
