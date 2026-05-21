"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanColumn } from "./KanbanColumn";
import { JobCard } from "./JobCard";

/**
 * G2: KanbanBoardSkeleton — 3 columns × 3 card slots while `isLoading` is true.
 * Mostly covered by AppSkeleton for the kid page, but kept for standalone /
 * future re-use (admin views, embedded panels).
 */
function KanbanBoardSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="kanban-board-skeleton"
      className="grid gap-4 md:grid-cols-3 md:gap-6"
    >
      {[0, 1, 2].map((col) => (
        <div
          key={col}
          className="space-y-3 rounded-2xl border border-blue-900/30 bg-blue-950/30 p-3"
        >
          <Skeleton className="h-7 w-24 rounded bg-blue-900/50" />
          {[0, 1, 2].map((row) => (
            <Skeleton
              key={row}
              className="h-20 w-full rounded-xl bg-blue-900/40"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// F21: celebration only fires on job approval — defer the heavy motion bundle
// until the user actually triggers it.
const DolphinCelebration = dynamic(
  () =>
    import("./DolphinCelebration").then((m) => ({
      default: m.DolphinCelebration,
    })),
  { ssr: false },
);

interface KanbanBoardProps {
  childId: string;
}

export function KanbanBoard({ childId }: KanbanBoardProps) {
  const { t } = useTranslation();
  const {
    isLoading,
    getTodayAvailableJobs,
    getInProgressJobs,
    getCompletedJobs,
    startJob,
    completeJob,
    getJobById,
    getInstancesForChild,
  } = usePocketMoney();

  const [celebrating, setCelebrating] = useState(false);
  const [celebrationYen, setCelebrationYen] = useState(0);
  const [activeColumn, setActiveColumn] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const available = getTodayAvailableJobs(childId);
  const inProgress = getInProgressJobs(childId);
  const completed = getCompletedJobs(childId);

  // F17 Goal C: observe `status === "approved"` transitions on the kid's
  // jobInstances. When the parent approves a submission, the kid's Convex
  // realtime feed flips the instance to "approved" — fire DolphinCelebration
  // so the kid sees their money land.
  const childInstances = getInstancesForChild(childId);
  const seenApprovedIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    // First pass — seed the set with whatever is already approved so we
    // don't fake-celebrate historical approvals on initial mount.
    if (seenApprovedIdsRef.current === null) {
      seenApprovedIdsRef.current = new Set(
        childInstances.filter((i) => i.status === "approved").map((i) => i._id),
      );
      return;
    }

    const seen = seenApprovedIdsRef.current;
    let toCelebrate: { yenAmount: number } | null = null;
    for (const inst of childInstances) {
      if (inst.status !== "approved") continue;
      if (seen.has(inst._id)) continue;
      seen.add(inst._id);
      if (toCelebrate) continue; // Only first new approval in this tick fires.
      const job = getJobById(inst.jobId);
      if (job) {
        toCelebrate = { yenAmount: job.yenAmount };
      }
    }
    if (toCelebrate) {
      // Defer state writes out of the effect body to avoid cascading renders.
      const payload = toCelebrate;
      queueMicrotask(() => {
        setCelebrationYen(payload.yenAmount);
        setCelebrating(true);
      });
    }
  }, [childInstances, getJobById]);

  const handleStart = (jobId: string, scheduledJobId: string) => {
    startJob(jobId, childId, scheduledJobId);
  };

  const handleComplete = async (
    instanceId: string,
    jobId: string,
    proofFile?: File,
  ) => {
    await completeJob(instanceId, proofFile);
    const job = getJobById(jobId);
    if (job) {
      setCelebrationYen(job.yenAmount);
      setCelebrating(true);
    }
  };

  // Track scroll position to update dot indicators
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const columnWidth = el.scrollWidth / 3;
    const newActive = Math.round(scrollLeft / columnWidth);
    setActiveColumn(Math.min(newActive, 2));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Scroll to column when dot is tapped
  const scrollToColumn = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const columnWidth = el.scrollWidth / 3;
    el.scrollTo({ left: columnWidth * index, behavior: "smooth" });
  };

  const columnColors = ["bg-blue-500", "bg-amber-500", "bg-green-500"];

  // G2: skeleton while context is still hydrating. Hooks above must run on
  // every render, so this check is after all hooks — empty-state copy below
  // (F11) continues to gate on length === 0 after hydration.
  if (isLoading) {
    return <KanbanBoardSkeleton />;
  }

  // Show empty state if no jobs scheduled today at all
  const hasNoJobsToday =
    available.length === 0 && inProgress.length === 0 && completed.length === 0;

  if (hasNoJobsToday) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300/30 px-6 py-12 text-center"
        data-testid="kanban-empty-today"
      >
        <span className="mb-3 text-5xl">📅</span>
        <p className="text-lg font-semibold text-white/80">
          {t("kanban_empty_today_title")}
        </p>
        <p className="mt-1 text-sm text-white/60">
          {t("kanban_empty_today_hint")}
        </p>
        {/* S3 (R4) — F10 6.3: nudge a kid who genuinely wants more chores to
            ask a grown-up. The parrot emoji lands the pirate theme without
            adding a third paragraph block. */}
        <p className="mt-3 text-sm font-medium text-amber-200/90">
          {t("kanban_empty_today_action")}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Scrollable kanban container */}
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6 md:overflow-visible"
      >
        {/* F10 6.4: by the time we reach this branch, hasNoJobsToday
            is false → at least one column has content → any empty column
            should render the soft "—" placeholder, not the rich dashed
            block. softEmpty is set unconditionally; KanbanColumn only
            renders the empty UI when its own count === 0 anyway. */}
        <div className="min-w-[85vw] snap-start md:min-w-0">
          <KanbanColumn
            title={t("kanban_available")}
            icon="⭐"
            count={available.length}
            color="bg-blue-500/80"
            columnType="available"
            softEmpty
          >
            {available.map((sj) => (
              <JobCard
                key={sj._id}
                job={sj.job}
                status="available"
                {...(sj.parentNote !== undefined
                  ? { parentNote: sj.parentNote }
                  : {})}
                {...(sj.priority !== undefined
                  ? { priority: sj.priority }
                  : {})}
                onStart={() => handleStart(sj.jobId, sj._id)}
              />
            ))}
          </KanbanColumn>
        </div>

        <div className="min-w-[85vw] snap-start md:min-w-0">
          <KanbanColumn
            title={t("kanban_doing")}
            icon="💪"
            count={inProgress.length}
            color="bg-amber-500/80"
            columnType="doing"
            softEmpty
          >
            {inProgress.map((inst) => (
              <JobCard
                key={inst._id}
                job={inst.job}
                status="in_progress"
                instanceId={inst._id}
                onComplete={(proofFile) =>
                  handleComplete(inst._id, inst.jobId, proofFile)
                }
              />
            ))}
          </KanbanColumn>
        </div>

        <div className="min-w-[85vw] snap-start md:min-w-0">
          <KanbanColumn
            title={t("kanban_done")}
            icon="🎉"
            count={completed.length}
            color="bg-green-500/80"
            columnType="done"
            softEmpty
          >
            {completed.map((inst) => (
              <JobCard
                key={inst._id}
                job={inst.job}
                status="completed"
                instanceId={inst._id}
              />
            ))}
          </KanbanColumn>
        </div>
      </div>

      {/* Dot indicators - mobile only.
          F19 a11y: descriptive aria-labels per column + focus-visible ring. */}
      <div
        role="tablist"
        aria-label={t("kanban_columns_label")}
        className="mt-4 flex items-center justify-center gap-2 md:hidden"
      >
        {[
          { i: 0, name: t("kanban_available") },
          { i: 1, name: t("kanban_doing") },
          { i: 2, name: t("kanban_done") },
        ].map(({ i, name }) => (
          <button
            key={i}
            role="tab"
            aria-selected={activeColumn === i}
            onClick={() => scrollToColumn(i)}
            className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900 ${
              activeColumn === i
                ? `w-6 ${columnColors[i]}`
                : "w-2.5 bg-white/30"
            }`}
            aria-label={name}
          />
        ))}
      </div>

      {celebrating && (
        <DolphinCelebration
          yenAmount={celebrationYen}
          childId={childId}
          onClose={() => setCelebrating(false)}
        />
      )}
    </>
  );
}
