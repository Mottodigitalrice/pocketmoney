"use client";

import { useState } from "react";
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
    getAvailableJobs,
    getInProgressJobs,
    getCompletedJobs,
    startJob,
    completeJob,
    getJobById,
  } = usePocketMoney();

  const [celebrating, setCelebrating] = useState(false);
  const [celebrationYen, setCelebrationYen] = useState(0);

  const available = getAvailableJobs(childId);
  const inProgress = getInProgressJobs(childId);
  const completed = getCompletedJobs(childId);

  const handleComplete = (instanceId: string, jobId: string) => {
    completeJob(instanceId);
    const job = getJobById(jobId);
    if (job) {
      setCelebrationYen(job.yenAmount);
      setCelebrating(true);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <KanbanColumn
          title={t("kanban_available")}
          icon="⭐"
          count={available.length}
          color="bg-blue-500/80"
          columnType="available"
        >
          {available.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              status="available"
              onStart={() => startJob(job._id, childId)}
            />
          ))}
        </KanbanColumn>

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
