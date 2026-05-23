/**
 * G4 — `renderWithProviders` helper.
 *
 * Mounts a component inside the real LanguageProvider + a deeply mockable
 * PocketMoneyContext.Provider, so every component test can pick exactly
 * the slice of shape it cares about without having to spin up Convex/Clerk.
 *
 * Why we use the *real* LanguageProvider instead of mocking the context:
 *   - The provider reads `localStorage` once on mount via `getInitialLocale()`
 *     which defaults to `"ja"` when nothing is stored. To force `"en"` for a
 *     test, the test seeds `localStorage` before calling `renderWithProviders`.
 *   - This keeps the `t()` calls real, so we can assert on translated copy.
 *
 * Why we *do* mock PocketMoneyContext directly:
 *   - The real provider pulls from Convex + Clerk. We don't want any of that
 *     in component tests. We feed our own partial context value with the
 *     hooks the component-under-test happens to call.
 */
import React, { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { PocketMoneyContext } from "@/components/providers/PocketMoneyProvider";
import type { RankProgress } from "@/types";

// We pull the full context type off the exported Context — that way if the
// provider's interface evolves, this helper picks up the change without
// duplicating shape.
export type FullContext = NonNullable<
  React.ContextType<typeof PocketMoneyContext>
>;

export const DEFAULT_RANK_PROGRESS: RankProgress = {
  rank: "Noob",
  nextRank: "Normal",
  score: 0,
  nextScore: 500,
  progress: 0,
  multiplier: 1,
};

// Sensible empty defaults. Every method is a no-op so a component can call
// e.g. `openLuckyChest("foo")` without exploding even when the test didn't
// override it. Tests that DO care about a call use `vi.fn()` overrides.
function noopAsync() {
  return Promise.resolve();
}

export const DEFAULT_CONTEXT_VALUE: FullContext = {
  isLoading: false,
  userId: "test-user-id",
  captainCodeEnabled: false,
  luckyChestMaxAmount: 100,
  familyChildren: [],
  jobs: [],
  jobInstances: [],
  scheduledJobs: [],
  wallets: [],
  transactions: [],
  goals: [],
  setCaptainCodeEnabled: noopAsync,
  addJob: async () => undefined,
  editJob: () => {},
  deleteJob: () => {},
  scheduleJob: () => {},
  scheduleJobBatch: () => {},
  removeScheduledJob: () => {},
  clearScheduledDay: () => {},
  applyRecurringJobsForWeek: noopAsync,
  quickAssign: () => {},
  quickAddForToday: noopAsync,
  createOneOff: () => {},
  startJob: () => {},
  completeJob: noopAsync,
  approveJob: noopAsync,
  rejectJob: () => {},
  withdrawFromWallet: noopAsync,
  awardBonus: noopAsync,
  setLuckyChestMaxAmount: noopAsync,
  openLuckyChest: noopAsync,
  createGoal: noopAsync,
  getScheduledJobsForChildDate: () => [],
  getScheduledJobsForWeek: () => [],
  getTodayAvailableJobs: () => [],
  getInProgressJobs: () => [],
  getCompletedJobs: () => [],
  getPendingApprovals: () => [],
  getWeeklyEarnings: () => 0,
  getWeeklyPotential: () => 0,
  getLifetimeEarnings: () => 0,
  getWalletsForChild: () => [],
  getWalletBalance: () => 0,
  getWalletTotal: () => 0,
  getRankForChild: () => DEFAULT_RANK_PROGRESS,
  getTransactionsForChild: () => [],
  getGoalsForChild: () => [],
  getActiveGoalForChild: () => undefined,
  getLuckyChestStatus: () => undefined,
  getInstancesForChild: () => [],
  getJobById: () => undefined,
  getChildById: () => undefined,
  addChild: () => {},
  editChild: () => {},
  deleteChild: () => {},
  getLocalDateString: () => "2026-05-15",
  getWeekDates: () => [
    "2026-05-11",
    "2026-05-12",
    "2026-05-13",
    "2026-05-14",
    "2026-05-15",
    "2026-05-16",
    "2026-05-17",
  ],
};

interface RenderWithProvidersOptions {
  /** Locale to seed the LanguageProvider with. Default: "en". */
  initialLang?: "en" | "ja";
  /** Override any subset of the PocketMoneyContext value. */
  contextValue?: Partial<FullContext>;
  renderOptions?: Omit<RenderOptions, "wrapper">;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const { initialLang = "en", contextValue = {}, renderOptions } = options;

  // LanguageProvider reads localStorage at mount via `getInitialLocale()`.
  // Seed it here so the test gets the locale it asked for. `clear()` wipes
  // any rank-up keys (etc.) leaked between tests.
  if (typeof window !== "undefined") {
    window.localStorage.clear();
    window.localStorage.setItem("pocketmoney-lang", initialLang);
  }

  const mergedContext: FullContext = {
    ...DEFAULT_CONTEXT_VALUE,
    ...contextValue,
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LanguageProvider>
        <PocketMoneyContext.Provider value={mergedContext}>
          {children}
        </PocketMoneyContext.Provider>
      </LanguageProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export RTL for ergonomic imports in tests.
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
