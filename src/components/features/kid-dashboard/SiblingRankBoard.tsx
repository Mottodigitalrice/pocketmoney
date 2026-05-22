"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { Skeleton } from "@/components/ui/skeleton";
import { BudouXText } from "@/components/shared/BudouXText";
import { CHILD_ICON_CONFIG, CURRENCY } from "@/lib/constants";
import type { ChildIcon } from "@/types";
import { computeWeeklyDelta } from "../../../../convex/lib/rankWeekly";

/**
 * G2: SiblingRankBoardSkeleton — 2-3 rank rows with avatar + progress bar.
 */
function SiblingRankBoardSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="sibling-rank-skeleton"
      className="mx-4 rounded-2xl border border-amber-300/25 bg-amber-950/35 p-4 backdrop-blur-sm sm:mx-8"
    >
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="size-9 rounded-xl bg-amber-900/50" />
        <Skeleton className="h-5 w-32 rounded bg-amber-900/40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-amber-700/20 bg-amber-900/25 p-3 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full bg-amber-900/50" />
              <Skeleton className="h-6 flex-1 rounded bg-amber-900/40" />
              <Skeleton className="h-4 w-12 rounded bg-amber-900/30" />
            </div>
            <Skeleton className="h-2 w-full rounded-full bg-amber-950" />
            <Skeleton className="h-3 w-28 rounded bg-amber-900/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface SiblingRankBoardProps {
  childId: string;
}

// Local ms-per-day constant — keeps the week-window math readable below.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * G5: returns the timestamp of the Monday-10:00-UTC at-or-before `now`.
 *
 * Why Monday 10:00 UTC: matches the PRD's "fair-fight surface resets Mon
 * 10:00 UTC" — picked because Japan is UTC+9 so this is 19:00 JST Monday,
 * which lines up with the start of the family's working week (post-dinner
 * Sunday reflection in JP timezones lands before the rollover).
 */
function getWeekStartMs(now: number): number {
  const d = new Date(now);
  const dayOfWeek = d.getUTCDay(); // 0=Sun..6=Sat
  // Days to subtract to reach Monday. Sunday → 6, Mon → 0, Tue → 1, ...
  const daysBack = (dayOfWeek + 6) % 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - daysBack);
  monday.setUTCHours(10, 0, 0, 0);
  // If we just rolled forward (e.g. early Monday UTC before 10:00), the
  // computed Monday-10:00 is in the future — step back a week.
  if (monday.getTime() > now) {
    monday.setUTCDate(monday.getUTCDate() - 7);
  }
  return monday.getTime();
}

export function SiblingRankBoard({ childId }: SiblingRankBoardProps) {
  const { t } = useTranslation();
  const {
    isLoading,
    familyChildren,
    getRankForChild,
    getWalletTotal,
    jobInstances,
    jobs,
  } = usePocketMoney();
  // Wave 2a polish: respect prefers-reduced-motion for the layout-driven
  // reorder spring. CSS media-query covers transition-duration, but the
  // motion-layout engine needs its own opt-out. When reduced, we collapse
  // the spring to a 100ms linear tween so the row still moves smoothly to
  // its new spot but without the bouncy spring overshoot.
  const prefersReducedMotion = useReducedMotion();
  const rowTransition = prefersReducedMotion
    ? { duration: 0.1, ease: "linear" as const }
    : { type: "spring" as const, stiffness: 350, damping: 30 };

  // Toggle state: lifetime (default) vs weekly. Trailing sibling can flip
  // to see the fair-fight surface. Public on both views — sibling positions
  // are visible. Only the kudos line stays private to the current child.
  const [view, setView] = useState<"lifetime" | "weekly">("lifetime");

  // Compute current week + history windows once per render. Pinned via
  // useMemo so the kudos calculation downstream is stable.
  const { weekStartMs, history4WeeksStartMs } = useMemo(() => {
    const now = Date.now();
    const weekStart = getWeekStartMs(now);
    return {
      weekStartMs: weekStart,
      history4WeeksStartMs: weekStart - 4 * 7 * MS_PER_DAY,
    };
  }, []);

  // Per-child weekly earnings map for the leaderboard sort + kudos input.
  // Derived from the existing jobInstances + jobs in context — no new
  // Convex query needed. Filters by `status === "approved"` and
  // `approvedAt >= weekStartMs` to match the existing `getWeeklyEarnings`
  // semantics in the provider (an approved job's yen counts toward earnings).
  const weeklyTotalsByChild = useMemo(() => {
    const map = new Map<string, number>();
    for (const inst of jobInstances) {
      if (inst.status !== "approved") continue;
      if (!inst.approvedAt || inst.approvedAt < weekStartMs) continue;
      const job = jobs.find((j) => j._id === inst.jobId);
      if (!job) continue;
      map.set(inst.childId, (map.get(inst.childId) ?? 0) + job.yenAmount);
    }
    return map;
  }, [jobInstances, jobs, weekStartMs]);

  // This child's 4-week history bucketed by week index. Used for the kudos
  // computation. Only need the per-week sums — the helper averages them.
  const last4WeeksTotalsForChild = useMemo(() => {
    const buckets: number[] = [0, 0, 0, 0];
    for (const inst of jobInstances) {
      if (inst.childId !== childId) continue;
      if (inst.status !== "approved") continue;
      if (!inst.approvedAt) continue;
      // Only count instances inside the 4-week history window (strictly
      // before this week's start, after the 4-weeks-ago boundary).
      if (
        inst.approvedAt < history4WeeksStartMs ||
        inst.approvedAt >= weekStartMs
      ) {
        continue;
      }
      const job = jobs.find((j) => j._id === inst.jobId);
      if (!job) continue;
      // Which of the 4 weekly buckets does this instance fall in? Index 0 is
      // 4 weeks ago, index 3 is the most recent prior week.
      const weeksAgo = Math.floor(
        (weekStartMs - inst.approvedAt) / (7 * MS_PER_DAY),
      );
      const bucket = 3 - weeksAgo; // 0..3, with 3 = last completed week
      if (bucket >= 0 && bucket <= 3) {
        buckets[bucket]! += job.yenAmount;
      }
    }
    return buckets;
  }, [jobInstances, jobs, childId, weekStartMs, history4WeeksStartMs]);

  // Kudos signal — pure helper, easy to test on its own. We pass this
  // child's THIS WEEK total (as a single-element list) and the 4-week
  // history (flat list, order-independent in the helper).
  const kudos = useMemo(() => {
    const thisWeek = weeklyTotalsByChild.get(childId) ?? 0;
    return computeWeeklyDelta(
      thisWeek > 0 ? [thisWeek] : [],
      last4WeeksTotalsForChild,
    );
  }, [weeklyTotalsByChild, childId, last4WeeksTotalsForChild]);

  if (isLoading) return <SiblingRankBoardSkeleton />;

  // Sort children by the active view's metric. Lifetime view preserves the
  // pre-G5 behavior (sort by rank.score which already applies multiplier).
  // Weekly view sorts by raw weekly yen — the fair-fight surface.
  const rankedChildren = familyChildren
    .map((child) => ({
      child,
      rank: getRankForChild(child._id),
      total: getWalletTotal(child._id),
      weeklyTotal: weeklyTotalsByChild.get(child._id) ?? 0,
    }))
    .sort((a, b) => {
      if (view === "weekly") return b.weeklyTotal - a.weeklyTotal;
      return b.rank.score - a.rank.score;
    });

  // F11: don't render a leaderboard with fewer than 2 kids — a 1-row leaderboard is awkward.
  // Hidden entirely per PRD (gap 6.8); copy keys (sibling_rank_solo_*) exist if a soft variant is wanted later.
  if (rankedChildren.length < 2) return null;

  // Pick the right kudos key based on `kind`. `no_history` hides the line.
  const kudosKey =
    kudos.kind === "above_avg"
      ? "rank_kudos_above_avg"
      : kudos.kind === "below_avg"
        ? "rank_kudos_below_avg"
        : kudos.kind === "at_avg"
          ? "rank_kudos_at_avg"
          : null;

  return (
    <div className="mx-4 rounded-2xl border border-amber-300/25 bg-amber-950/35 p-4 backdrop-blur-sm sm:mx-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-100">
            <Trophy className="size-5" />
          </div>
          <h2 className="text-lg font-extrabold text-amber-100">
            {t("rank_board_title")}
          </h2>
        </div>

        {/* G5: lifetime/weekly pill toggle. Trailing-sibling escape hatch. */}
        <div
          role="tablist"
          aria-label={t("rank_board_title")}
          className="flex shrink-0 overflow-hidden rounded-full border border-amber-700/40 bg-amber-950/40 text-xs font-extrabold"
          data-testid="rank-board-toggle"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "lifetime"}
            data-testid="rank-board-toggle-lifetime"
            onClick={() => setView("lifetime")}
            className={`px-3 py-1.5 transition-colors ${
              view === "lifetime"
                ? "bg-amber-400 text-amber-950"
                : "text-amber-200 hover:bg-amber-900/40"
            }`}
          >
            {t("rank_toggle_lifetime")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "weekly"}
            data-testid="rank-board-toggle-weekly"
            onClick={() => setView("weekly")}
            className={`px-3 py-1.5 transition-colors ${
              view === "weekly"
                ? "bg-amber-400 text-amber-950"
                : "text-amber-200 hover:bg-amber-900/40"
            }`}
          >
            {t("rank_toggle_weekly")}
          </button>
        </div>
      </div>

      <LayoutGroup id="sibling-rank-board">
        <div className="grid gap-3 sm:grid-cols-2">
          {rankedChildren.map(({ child, rank, total, weeklyTotal }, index) => {
            const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
            const isCurrentChild = child._id === childId;
            // Weekly view shows the week-yen prominently; lifetime view keeps
            // the existing wallet-total display. Bar still tracks rank progress
            // in lifetime view; in weekly view the bar reflects relative weekly
            // share so a kid who's #1 this week sees a full bar.
            const topWeekly = rankedChildren[0]?.weeklyTotal ?? 0;
            const weeklyBarPercent =
              view === "weekly" && topWeekly > 0
                ? Math.min(100, Math.round((weeklyTotal / topWeekly) * 100))
                : rank.progress;
            return (
              <motion.div
                key={child._id}
                layout
                layoutId={`rank-row-${child._id}`}
                transition={rowTransition}
                data-testid={`rank-row-${child._id}`}
                className={`rounded-xl border p-3 ${
                  isCurrentChild
                    ? "border-amber-300/60 bg-amber-700/30"
                    : "border-amber-700/20 bg-amber-900/25"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-950/60 text-sm font-extrabold text-amber-100">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {iconConfig?.emoji ?? "👤"}
                      </span>
                      <p className="truncate font-extrabold text-amber-100">
                        {child.name}
                      </p>
                    </div>
                    <p className="mt-1 text-sm font-bold text-amber-200">
                      {rank.rank}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-bold text-amber-100">
                    {CURRENCY}
                    {(view === "weekly" ? weeklyTotal : total).toLocaleString()}
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-950">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-200"
                    style={{ width: `${weeklyBarPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-amber-200/70">
                  {view === "weekly"
                    ? t("rank_toggle_weekly")
                    : rank.nextRank
                      ? t("rank_next", {
                          rank: rank.nextRank,
                          score: (rank.nextScore ?? 0).toLocaleString(),
                        })
                      : t("rank_max")}
                </p>
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>

      {/* G5: private kudos line — only renders for the current child, both
          views. Self-vs-self comparison; siblings never see it. */}
      {kudosKey && (
        <div
          data-testid="rank-kudos"
          data-kudos-kind={kudos.kind}
          className="mt-4 rounded-xl border border-amber-300/40 bg-amber-500/15 p-3 text-sm font-bold text-amber-100"
        >
          <BudouXText
            text={t(kudosKey, {
              amount: kudos.thisWeekTotal.toLocaleString(),
              percent: Math.abs(kudos.percentDelta).toString(),
            })}
          />
        </div>
      )}
    </div>
  );
}
