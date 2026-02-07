"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { KanbanColumn } from "./KanbanColumn";
import { JobCard } from "./JobCard";
import { DolphinCelebration } from "./DolphinCelebration";

interface KanbanBoardProps {
  childId: string;
}

export function KanbanBoard({ childId }: KanbanBoardProps) {
  const { t } = useTranslation();
  const {
    getTodayAvailableJobs,
    getInProgressJobs,
    getCompletedJobs,
    startJob,
    completeJob,
    getJobById,
  } = usePocketMoney();

  const [celebrating, setCelebrating] = useState(false);
  const [celebrationYen, setCelebrationYen] = useState(0);
  const [activeColumn, setActiveColumn] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const available = getTodayAvailableJobs(childId);
  const inProgress = getInProgressJobs(childId);
  const completed = getCompletedJobs(childId);

  const handleStart = (jobId: string, scheduledJobId: string) => {
    startJob(jobId, childId, scheduledJobId);
  };

  const handleComplete = (instanceId: string, jobId: string) => {
    completeJob(instanceId);
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

  // Show empty state if no jobs scheduled today at all
  const hasNoJobsToday = available.length === 0 && inProgress.length === 0 && completed.length === 0;

  if (hasNoJobsToday) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300/30 py-12 text-center">
        <span className="mb-3 text-5xl">📅</span>
        <p className="text-lg font-semibold text-white/80">
          {t("kanban_no_jobs_today")}
        </p>
        <p className="text-sm text-white/50">
          {t("kanban_no_jobs_hint")}
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
        <div className="min-w-[85vw] snap-start md:min-w-0">
          <KanbanColumn
            title={t("kanban_available")}
            icon="⭐"
            count={available.length}
            color="bg-blue-500/80"
            columnType="available"
          >
            {available.map((sj) => (
              <JobCard
                key={sj._id}
                job={sj.job}
                status="available"
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
          >
            {inProgress.map((inst) => (
              <JobCard
                key={inst._id}
                job={inst.job}
                status="in_progress"
                instanceId={inst._id}
                onComplete={() => handleComplete(inst._id, inst.jobId)}
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

      {/* Dot indicators - mobile only */}
      <div className="mt-4 flex items-center justify-center gap-2 md:hidden">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => scrollToColumn(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              activeColumn === i
                ? `w-6 ${columnColors[i]}`
                : "w-2.5 bg-white/30"
            }`}
            aria-label={`Column ${i + 1}`}
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
