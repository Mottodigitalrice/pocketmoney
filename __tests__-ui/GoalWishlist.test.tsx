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
import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { renderWithProviders, fireEvent } from "./test-utils";
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
    expect(container).toHaveTextContent(
      /no goal yet|set your first goal|goal/i,
    );
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
    expect(
      container.querySelector("[data-testid='goal-big-dream-hint']"),
    ).toBeNull();
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

// S5 (R4) — GoalWishlist collapse toggle (F10 6.6).
describe("GoalWishlist — S5 (R4) collapse swap form behind toggle (F10 6.6)", () => {
  it("with no active goal, the create-form is visible by default (first-goal flow)", () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: {
          getActiveGoalForChild: () => undefined,
          getGoalsForChild: () => [],
        },
      },
    );
    // First-goal flow: form expanded, toggle button hidden.
    expect(getByTestId("goal-create-form")).toBeInTheDocument();
    expect(queryByTestId("goal-new-toggle")).toBeNull();
  });

  it("with an active goal, the form is hidden until the toggle is tapped", () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: {
          getActiveGoalForChild: () =>
            goalFixture({ _id: "g-active", targetAmount: 500 }),
          getGoalsForChild: () => [
            goalFixture({ _id: "g-active", targetAmount: 500 }),
          ],
        },
      },
    );
    // Toggle visible, form hidden.
    const toggle = getByTestId("goal-new-toggle");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveTextContent(/I want something else/i);
    expect(queryByTestId("goal-create-form")).toBeNull();
  });

  it("tapping the toggle expands the form and flips aria-expanded", () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: {
          getActiveGoalForChild: () =>
            goalFixture({ _id: "g-active", targetAmount: 500 }),
          getGoalsForChild: () => [
            goalFixture({ _id: "g-active", targetAmount: 500 }),
          ],
        },
      },
    );
    // Start: form hidden.
    expect(queryByTestId("goal-create-form")).toBeNull();
    // Tap toggle — use fireEvent.click so React's synthetic event system
    // picks up the change (toggle.click() in jsdom skips React's handlers).
    const toggle = getByTestId("goal-new-toggle");
    fireEvent.click(toggle);
    // Form now visible, toggle text flipped to "Maybe later".
    expect(getByTestId("goal-create-form")).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveTextContent(/Maybe later/i);
  });

  it("renders the JP toggle copy when locale is ja", () => {
    const { getByTestId } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        initialLang: "ja",
        contextValue: {
          getActiveGoalForChild: () =>
            goalFixture({ _id: "g-active", targetAmount: 500 }),
          getGoalsForChild: () => [
            goalFixture({ _id: "g-active", targetAmount: 500 }),
          ],
        },
      },
    );
    const toggle = getByTestId("goal-new-toggle");
    expect(toggle).toHaveTextContent(/ほかのもほしい/);
  });
});

// stop-test-1b — goal milestone celebration (Wave 2 survey follow-up).
// The progress bar pulses gold + a brief coin-rain fires when the goal
// crosses < 100 → ≥ 100, and a polite aria-live region announces the
// crossing. Mirrors WeeklyTracker's Wave 2a pattern.
describe("GoalWishlist — stop-test-1b goal milestone celebration", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("locks the progress bar transition to duration-300 (regression-pin)", () => {
    // Wave 2 survey called out duration-700 as too sluggish; we tightened
    // to duration-300 ease-out to match the WeeklyTracker pacing. Pin it.
    const { container } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: {
          getActiveGoalForChild: () => goalFixture({ targetAmount: 1000 }),
          getGoalsForChild: () => [goalFixture({ targetAmount: 1000 })],
          getWalletBalance: () => 250,
        },
      },
    );
    const bar = container.querySelector(
      ".bg-gradient-to-r.from-sky-300",
    ) as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar!.className).toMatch(/duration-300/);
    expect(bar!.className).toMatch(/ease-out/);
    // And the slow Wave-1 transition is gone.
    expect(bar!.className).not.toMatch(/duration-700/);
  });

  it("flips celebrating state when progress crosses < 100 → ≥ 100 and clears after 1500ms", async () => {
    vi.useFakeTimers();
    // First render: 50% — below the threshold. Mock the context's
    // saveBalance via a mutable closure so we can re-render with new
    // values without changing the goal identity.
    let balance = 500; // 50% of 1000 target
    const goal = goalFixture({ targetAmount: 1000 });
    const { getByTestId, queryByTestId, rerender } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: {
          getActiveGoalForChild: () => goal,
          getGoalsForChild: () => [goal],
          getWalletBalance: () => balance,
        },
      },
    );
    // Pre-crossing: progress bar is NOT celebrating, no a11y announce.
    const bar = getByTestId("goal-wishlist-progress");
    expect(bar.dataset.celebrating).toBe("false");
    expect(queryByTestId("goal-wishlist-a11y-announce")).toBeNull();

    // Push the balance past the target and re-render. The effect's
    // queueMicrotask flips celebratingFull to true on next tick — drain
    // microtasks via act() so React commits the state update.
    balance = 1200;
    await act(async () => {
      rerender(<GoalWishlist childId={CHILD_ID} />);
      await Promise.resolve();
    });

    // Celebrating now: data-attribute flipped, pulse-gold class applied,
    // coin-burst overlay rendered, aria-live region announces the title.
    expect(bar.dataset.celebrating).toBe("true");
    expect(bar.className).toMatch(/animate-pulse-gold/);
    expect(getByTestId("goal-reached-coin-burst")).toBeInTheDocument();
    const announce = getByTestId("goal-wishlist-a11y-announce");
    expect(announce).toBeInTheDocument();
    expect(announce).toHaveTextContent(/Goal reached/i);
    expect(announce).toHaveTextContent(/New skateboard/);

    // After 1500ms the celebration clears — bar drops the pulse,
    // overlay + announce unmount.
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(bar.dataset.celebrating).toBe("false");
    expect(bar.className).not.toMatch(/animate-pulse-gold/);
    expect(queryByTestId("goal-reached-coin-burst")).toBeNull();
    expect(queryByTestId("goal-wishlist-a11y-announce")).toBeNull();
  });

  it("does NOT fire on first render when progress is already ≥ 100 (no false crossing)", () => {
    // A kid returning to the app with a fully-funded goal shouldn't
    // re-trigger the celebration every time the page mounts.
    const { queryByTestId, getByTestId } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        contextValue: {
          getActiveGoalForChild: () => goalFixture({ targetAmount: 500 }),
          getGoalsForChild: () => [goalFixture({ targetAmount: 500 })],
          getWalletBalance: () => 600,
        },
      },
    );
    expect(getByTestId("goal-wishlist-progress").dataset.celebrating).toBe(
      "false",
    );
    expect(queryByTestId("goal-reached-coin-burst")).toBeNull();
    expect(queryByTestId("goal-wishlist-a11y-announce")).toBeNull();
  });

  it("renders the JP version of the goal-reached announcement", async () => {
    vi.useFakeTimers();
    let balance = 100;
    const goal = goalFixture({ targetAmount: 1000, title: "ゲーム機" });
    const { getByTestId, rerender } = renderWithProviders(
      <GoalWishlist childId={CHILD_ID} />,
      {
        initialLang: "ja",
        contextValue: {
          getActiveGoalForChild: () => goal,
          getGoalsForChild: () => [goal],
          getWalletBalance: () => balance,
        },
      },
    );
    balance = 1500;
    await act(async () => {
      rerender(<GoalWishlist childId={CHILD_ID} />);
      await Promise.resolve();
    });
    const announce = getByTestId("goal-wishlist-a11y-announce");
    expect(announce).toHaveTextContent(/もくひょうたっせい/);
    expect(announce).toHaveTextContent(/ゲーム機/);
  });
});
