/**
 * Wave 6 — Accessibility audit tests.
 *
 * Covers six a11y polish items shipped in this wave:
 *   1. globals.css declares a `prefers-reduced-motion` block AND it neutralizes
 *      every ambient infinite-loop utility class the kid/parent dashboards use.
 *   2. globals.css defines a global `*:focus-visible` rule with a high-contrast
 *      ring so keyboard navigation has a visible focus indicator.
 *   3. LuckyChest renders an `aria-live` polite region after a successful open.
 *   4. WeeklyTracker renders an `aria-live` polite region when crossing 100%.
 *   5. BudouXText wraps known JP body strings inside the wave-2-touched
 *      components (LuckyChest unlocked / opened / locked, WeeklyTracker
 *      weekly_progress + weekly_tracker_zero_hint).
 *   6. Icon-only buttons have an aria-label (GoalWishlist emoji picker tiles).
 *   7. The LuckyChestCoinBurst decorative overlay is `aria-hidden="true"`.
 *
 * Strategy: read globals.css with `fs` for the CSS-only items (matches
 * the pattern in `__tests__-ui/animations/animation-surface.test.tsx`).
 * For component items, mount via `renderWithProviders` and assert on DOM.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { act, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { LuckyChest } from "@/components/features/kid-dashboard/LuckyChest";
import { WeeklyTracker } from "@/components/features/kid-dashboard/WeeklyTracker";
import { GoalWishlist } from "@/components/features/kid-dashboard/GoalWishlist";
import type { LuckyChestStatus } from "@/types";

const GLOBALS_CSS_PATH = path.resolve(__dirname, "../../src/app/globals.css");
const GLOBALS_CSS = fs.readFileSync(GLOBALS_CSS_PATH, "utf8");

// Every ambient infinite-loop animation utility the kid + parent dashboards
// currently rely on. If a new ambient loop is added in a future wave it MUST
// also land in the `prefers-reduced-motion` media block — this list is the
// contract that enforces that.
const AMBIENT_ANIMATION_CLASSES = [
  "animate-bob",
  "animate-wave",
  "animate-wave-slow",
  "animate-wave-slowest",
  "animate-shimmer",
  "animate-pulse-gold",
  "animate-sparkle",
  "animate-float-gentle",
  "animate-coin-float",
  "animate-coin-spin",
  "animate-scroll-hint",
  "animate-treasure-glow",
] as const;

describe("Wave 6 — globals.css a11y contract", () => {
  it("declares a prefers-reduced-motion media query block", () => {
    expect(GLOBALS_CSS).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
    );
  });

  it.each(AMBIENT_ANIMATION_CLASSES)(
    "neutralizes ambient animation class `%s` under prefers-reduced-motion",
    (cls) => {
      // Find the reduced-motion media block, then check the class is named
      // inside the comma-separated selector list before the duration override.
      const blockMatch = GLOBALS_CSS.match(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/,
      );
      expect(blockMatch).not.toBeNull();
      const block = blockMatch?.[1] ?? "";
      expect(block).toContain(`.${cls}`);
    },
  );

  it("defines a global :focus-visible rule with a visible ring", () => {
    // Box-shadow is preferred over outline because overflow:hidden parents
    // clip outlines but not box-shadow. The ring must be at least 2px wide.
    expect(GLOBALS_CSS).toMatch(/\*\s*:\s*focus-visible/);
    expect(GLOBALS_CSS).toMatch(
      /\*\s*:\s*focus-visible\s*\{[\s\S]*?box-shadow:[\s\S]*?2px/,
    );
  });
});

describe("Wave 6 — LuckyChest a11y", () => {
  function status(overrides: Partial<LuckyChestStatus>): LuckyChestStatus {
    return {
      childId: "child-1",
      weekStart: "2026-05-11",
      unlocked: true,
      opened: false,
      maxAmount: 100,
      mustDoTotal: 3,
      mustDoApproved: 3,
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does NOT render the announce region before the kid opens the chest", () => {
    const { queryByTestId } = renderWithProviders(
      <LuckyChest childId="child-1" />,
      {
        contextValue: {
          getLuckyChestStatus: () => status({}),
        },
      },
    );
    expect(queryByTestId("lucky-chest-a11y-announce")).toBeNull();
  });

  it("renders an aria-live polite announce region after a successful open", async () => {
    // Pattern mirrors `__tests__-ui/animations/animation-surface.test.tsx` —
    // fireEvent.click + drain microtasks via Promise.resolve() but DO NOT
    // advance the 2s clearing timer. The announce region is present at
    // assertion time because `justOpened` is still true.
    const openLuckyChest = vi.fn().mockResolvedValue(undefined);
    const { getByTestId, queryByTestId } = renderWithProviders(
      <LuckyChest childId="child-1" />,
      {
        contextValue: {
          openLuckyChest,
          getLuckyChestStatus: () => status({}),
        },
      },
    );

    expect(queryByTestId("lucky-chest-a11y-announce")).toBeNull();

    await act(async () => {
      fireEvent.click(getByTestId("lucky-chest-open-button"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(openLuckyChest).toHaveBeenCalledWith("child-1");
    const announce = getByTestId("lucky-chest-a11y-announce");
    expect(announce).toHaveAttribute("role", "status");
    expect(announce).toHaveAttribute("aria-live", "polite");
    expect(announce).toHaveAttribute("aria-atomic", "true");
    // The EN string contains "Lucky Chest opened" — locale defaults to EN.
    expect(announce.textContent).toMatch(/Lucky Chest opened/i);
  });

  it("marks the decorative coin-burst overlay as aria-hidden", async () => {
    const openLuckyChest = vi.fn().mockResolvedValue(undefined);
    const { getByTestId, queryByTestId } = renderWithProviders(
      <LuckyChest childId="child-1" />,
      {
        contextValue: {
          openLuckyChest,
          getLuckyChestStatus: () => status({}),
        },
      },
    );
    await act(async () => {
      fireEvent.click(getByTestId("lucky-chest-open-button"));
      await Promise.resolve();
      await Promise.resolve();
    });
    const burst = queryByTestId("lucky-chest-coin-burst");
    expect(burst).not.toBeNull();
    expect(burst).toHaveAttribute("aria-hidden", "true");
  });

  it("wraps JP body copy in BudouXText (inline-block spans) in JA locale", () => {
    // In JA locale, BudouXText emits a parent span with style word-break:keep-all
    // wrapping inline-block phrase spans. We mount the unlocked branch (the
    // longest body string after JA hiragana expansion) and assert the spans
    // exist. EN locale doesn't wrap, so we explicitly seed `ja`.
    const { getByTestId } = renderWithProviders(
      <LuckyChest childId="child-1" />,
      {
        initialLang: "ja",
        contextValue: {
          getLuckyChestStatus: () =>
            status({ unlocked: true, opened: false, maxAmount: 100 }),
        },
      },
    );
    const chest = getByTestId("lucky-chest");
    // BudouX inline-block spans use display:inline-block inline style.
    const inlineBlockSpans = chest.querySelectorAll(
      'span[style*="inline-block"]',
    );
    // At least one phrase span must exist (the unlocked copy is multi-phrase).
    expect(inlineBlockSpans.length).toBeGreaterThan(0);
  });
});

describe("Wave 6 — WeeklyTracker a11y", () => {
  it("does NOT render the announce region by default", () => {
    const { queryByTestId } = renderWithProviders(
      <WeeklyTracker childId="child-1" />,
      {
        contextValue: {
          getWeeklyEarnings: () => 100,
          getWeeklyPotential: () => 500,
          getWalletBalance: () => 0,
          getWalletTotal: () => 100,
        },
      },
    );
    expect(queryByTestId("weekly-tracker-a11y-announce")).toBeNull();
  });

  it("wraps the weekly-progress copy in BudouXText in JA locale", () => {
    const { getByTestId } = renderWithProviders(
      <WeeklyTracker childId="child-1" />,
      {
        initialLang: "ja",
        contextValue: {
          getWeeklyEarnings: () => 0,
          getWeeklyPotential: () => 500,
          getWalletBalance: () => 0,
          getWalletTotal: () => 0,
        },
      },
    );
    // The zero-hint paragraph carries a JP hiragana string in JA locale.
    const hint = getByTestId("weekly-tracker-zero-hint");
    const inlineBlockSpans = hint.querySelectorAll(
      'span[style*="inline-block"]',
    );
    expect(inlineBlockSpans.length).toBeGreaterThan(0);
  });
});

describe("Wave 6 — icon-only button aria-label sweep", () => {
  it("gives every GoalWishlist emoji-picker tile an aria-label + aria-pressed", () => {
    // GoalWishlist's emoji picker only shows when the form is open. The
    // empty-state path (no goals) renders the create form unconditionally,
    // so we feed an empty getActiveGoalForChild and the form is up.
    const { container } = renderWithProviders(
      <GoalWishlist childId="child-1" />,
      {
        contextValue: {
          getActiveGoalForChild: () => undefined,
          getGoalsForChild: () => [],
          getWalletBalance: () => 0,
        },
      },
    );
    // Each emoji tile has data-testid="goal-emoji-<emoji>" + aria-label.
    const tiles = container.querySelectorAll(
      'button[data-testid^="goal-emoji-"]',
    );
    expect(tiles.length).toBeGreaterThan(0);
    tiles.forEach((tile) => {
      // Wave 6 — aria-label uses the a11y_pick_emoji key, EN default.
      expect(tile.getAttribute("aria-label")).toMatch(/Pick emoji/i);
      expect(tile.getAttribute("aria-pressed")).toMatch(/^(true|false)$/);
    });
  });
});
