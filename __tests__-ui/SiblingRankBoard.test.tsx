/**
 * G5 — SiblingRankBoard component tests.
 *
 * Covers the new motivational rewrite:
 *   - Lifetime view renders by default (legacy contract preserved).
 *   - Toggle to weekly view re-sorts kids by THIS WEEK's earnings.
 *   - Kudos line renders correct copy on above_avg / below_avg branches.
 *   - Kudos line hides when there's no history (4yo's first week).
 *
 * Strategy: feed `jobInstances` + `jobs` through the test-utils provider so
 * the component's `useMemo`-driven weekly totals run on real data. Pin
 * `Date.now` so the week-window math is deterministic across machines.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import { SiblingRankBoard } from "@/components/features/kid-dashboard/SiblingRankBoard";
import type { Child, Job, JobInstance, RankProgress } from "@/types";

// Fixed reference: Wed 2026-05-13 12:00:00 UTC. The week-start helper in
// the component locks to Mon-10:00 UTC at-or-before this → Mon 2026-05-11
// 10:00:00 UTC. Anything `approvedAt` >= that ms counts as "this week".
const NOW_MS = Date.UTC(2026, 4, 13, 12, 0, 0); // month is 0-indexed
const WEEK_START_MS = Date.UTC(2026, 4, 11, 10, 0, 0);
const ONE_DAY = 24 * 60 * 60 * 1000;

const CHILD_A: Child = {
  _id: "child-a",
  userId: "u1",
  name: "Alex",
  icon: "shark",
  age: 8,
  rankMultiplier: 1,
  createdAt: 0,
};

const CHILD_B: Child = {
  _id: "child-b",
  userId: "u1",
  name: "Bea",
  icon: "dolphin",
  age: 4,
  rankMultiplier: 2,
  createdAt: 0,
};

const JOB_100: Job = {
  _id: "job-100",
  userId: "u1",
  title: "Tidy room",
  yenAmount: 100,
  icon: "🧹",
  createdAt: 0,
};

const JOB_50: Job = {
  _id: "job-50",
  userId: "u1",
  title: "Water plants",
  yenAmount: 50,
  icon: "🌱",
  createdAt: 0,
};

/** Build an approved JobInstance helper for terser fixtures. */
function approved(
  id: string,
  childId: string,
  jobId: string,
  approvedAt: number,
): JobInstance {
  return {
    _id: id,
    userId: "u1",
    jobId,
    childId,
    status: "approved",
    approvedAt,
    createdAt: approvedAt,
  };
}

function rank(score: number, name: RankProgress["rank"] = "Noob"): RankProgress {
  return {
    rank: name,
    nextRank: "Normal",
    score,
    nextScore: 500,
    progress: 0,
    multiplier: 1,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW_MS));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SiblingRankBoard — view rendering", () => {
  it("renders lifetime view by default with both kids and the toggle", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <SiblingRankBoard childId={CHILD_A._id} />,
      {
        contextValue: {
          familyChildren: [CHILD_A, CHILD_B],
          jobs: [JOB_100],
          jobInstances: [],
          getRankForChild: (id) => (id === CHILD_A._id ? rank(900) : rank(200)),
          getWalletTotal: (id) => (id === CHILD_A._id ? 900 : 200),
        },
      },
    );

    // Both rank rows visible.
    expect(getByTestId(`rank-row-${CHILD_A._id}`)).toBeInTheDocument();
    expect(getByTestId(`rank-row-${CHILD_B._id}`)).toBeInTheDocument();

    // Toggle present, lifetime selected by default.
    const lifetimeBtn = getByTestId("rank-board-toggle-lifetime");
    const weeklyBtn = getByTestId("rank-board-toggle-weekly");
    expect(lifetimeBtn).toHaveAttribute("aria-selected", "true");
    expect(weeklyBtn).toHaveAttribute("aria-selected", "false");

    // Lifetime view shows the wallet totals.
    expect(getByText(/¥900/)).toBeInTheDocument();
    expect(getByText(/¥200/)).toBeInTheDocument();
  });

  it("toggling to weekly view re-sorts by this-week earnings", () => {
    // Lifetime ordering: A (score 900) > B (score 200).
    // Weekly ordering: B earned ¥300 this week, A earned ¥100. B should
    // jump to #1 in the weekly view.
    const instances: JobInstance[] = [
      approved("i1", CHILD_A._id, JOB_100._id, WEEK_START_MS + ONE_DAY), // Alex 100
      approved("i2", CHILD_B._id, JOB_100._id, WEEK_START_MS + ONE_DAY), // Bea 100
      approved("i3", CHILD_B._id, JOB_100._id, WEEK_START_MS + 2 * ONE_DAY), // Bea +100
      approved("i4", CHILD_B._id, JOB_100._id, WEEK_START_MS + 2 * ONE_DAY), // Bea +100 (total 300)
    ];

    const utils = renderWithProviders(<SiblingRankBoard childId={CHILD_B._id} />, {
      contextValue: {
        familyChildren: [CHILD_A, CHILD_B],
        jobs: [JOB_100],
        jobInstances: instances,
        getRankForChild: (id) => (id === CHILD_A._id ? rank(900) : rank(200)),
        getWalletTotal: (id) => (id === CHILD_A._id ? 900 : 200),
      },
    });

    // Lifetime view default — Alex first (higher rank score).
    const initialRows = utils.container.querySelectorAll(
      '[data-testid^="rank-row-"]',
    );
    expect(initialRows[0]).toHaveAttribute(
      "data-testid",
      `rank-row-${CHILD_A._id}`,
    );

    // fireEvent.click is sufficient — we're testing the state transition,
    // not a user-event-simulation contract. userEvent + fake timers can
    // hang; fireEvent is synchronous and deterministic here.
    fireEvent.click(utils.getByTestId("rank-board-toggle-weekly"));

    expect(utils.getByTestId("rank-board-toggle-weekly")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Now the DOM order of rank rows should have Bea first.
    const rows = utils.container.querySelectorAll('[data-testid^="rank-row-"]');
    expect(rows[0]).toHaveAttribute("data-testid", `rank-row-${CHILD_B._id}`);
    expect(rows[1]).toHaveAttribute("data-testid", `rank-row-${CHILD_A._id}`);

    // Weekly yen amounts should be visible (Bea's ¥300 in the leaderboard).
    expect(utils.getByText(/¥300/)).toBeInTheDocument();
  });
});

describe("SiblingRankBoard — kudos line", () => {
  it("renders above_avg copy when this-week earnings beat the 4-week average by 20%+", () => {
    // History: 4 weeks ago + 3 weeks ago + 2 weeks ago + 1 week ago = ¥100 each.
    // Avg = 100. This week: ¥300 → ratio 3.0 → above_avg, +200%.
    const instances: JobInstance[] = [
      // This week
      approved("t1", CHILD_B._id, JOB_100._id, WEEK_START_MS + ONE_DAY),
      approved("t2", CHILD_B._id, JOB_100._id, WEEK_START_MS + 2 * ONE_DAY),
      approved("t3", CHILD_B._id, JOB_100._id, WEEK_START_MS + 3 * ONE_DAY),
      // 1 week ago
      approved("h1", CHILD_B._id, JOB_100._id, WEEK_START_MS - 3 * ONE_DAY),
      // 2 weeks ago
      approved("h2", CHILD_B._id, JOB_100._id, WEEK_START_MS - 10 * ONE_DAY),
      // 3 weeks ago
      approved("h3", CHILD_B._id, JOB_100._id, WEEK_START_MS - 17 * ONE_DAY),
      // 4 weeks ago (within window: 24 days < 28 days)
      approved("h4", CHILD_B._id, JOB_100._id, WEEK_START_MS - 24 * ONE_DAY),
    ];

    const { getByTestId } = renderWithProviders(
      <SiblingRankBoard childId={CHILD_B._id} />,
      {
        contextValue: {
          familyChildren: [CHILD_A, CHILD_B],
          jobs: [JOB_100],
          jobInstances: instances,
          getRankForChild: () => rank(0),
          getWalletTotal: () => 0,
        },
      },
    );

    const kudos = getByTestId("rank-kudos");
    expect(kudos).toHaveAttribute("data-kudos-kind", "above_avg");
    // Copy includes the yen total + the percent.
    expect(kudos).toHaveTextContent(/300/);
    expect(kudos).toHaveTextContent(/above your usual/i);
  });

  it("renders below_avg copy when this-week earnings are <= 80% of the 4-week average", () => {
    // History: ¥400 spread across 4 weeks (¥100 each). Avg = 100.
    // This week: ¥50 → ratio 0.5 → below_avg, -50%.
    const instances: JobInstance[] = [
      // This week (¥50)
      approved("t1", CHILD_B._id, JOB_50._id, WEEK_START_MS + ONE_DAY),
      // 1..4 weeks ago, ¥100 each
      approved("h1", CHILD_B._id, JOB_100._id, WEEK_START_MS - 3 * ONE_DAY),
      approved("h2", CHILD_B._id, JOB_100._id, WEEK_START_MS - 10 * ONE_DAY),
      approved("h3", CHILD_B._id, JOB_100._id, WEEK_START_MS - 17 * ONE_DAY),
      approved("h4", CHILD_B._id, JOB_100._id, WEEK_START_MS - 24 * ONE_DAY),
    ];

    const { getByTestId } = renderWithProviders(
      <SiblingRankBoard childId={CHILD_B._id} />,
      {
        contextValue: {
          familyChildren: [CHILD_A, CHILD_B],
          jobs: [JOB_50, JOB_100],
          jobInstances: instances,
          getRankForChild: () => rank(0),
          getWalletTotal: () => 0,
        },
      },
    );

    const kudos = getByTestId("rank-kudos");
    expect(kudos).toHaveAttribute("data-kudos-kind", "below_avg");
    expect(kudos).toHaveTextContent(/50/);
    expect(kudos).toHaveTextContent(/small steps add up/i);
  });

  it("hides the kudos line entirely when the kid has no 4-week history", () => {
    // Only this-week activity, no historical instances.
    const instances: JobInstance[] = [
      approved("t1", CHILD_B._id, JOB_100._id, WEEK_START_MS + ONE_DAY),
    ];

    const { queryByTestId } = renderWithProviders(
      <SiblingRankBoard childId={CHILD_B._id} />,
      {
        contextValue: {
          familyChildren: [CHILD_A, CHILD_B],
          jobs: [JOB_100],
          jobInstances: instances,
          getRankForChild: () => rank(0),
          getWalletTotal: () => 0,
        },
      },
    );

    expect(queryByTestId("rank-kudos")).toBeNull();
  });
});
