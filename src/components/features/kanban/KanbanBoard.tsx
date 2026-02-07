"use client";

import { useState } from "react";
import { ChildId } from "@/types";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { KanbanColumn } from "./KanbanColumn";
import { JobCard } from "./JobCard";
import { DolphinCelebration } from "./DolphinCelebration";

interface KanbanBoardProps {
  childId: ChildId;
}

export function KanbanBoard({ childId }: KanbanBoardProps) {
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
          title="Available Jobs"
          icon="⭐"
          count={available.length}
          color="bg-blue-500/80"
        >
          {available.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              status="available"
              onStart={() => startJob(job.id, childId)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="I'm Doing It!"
          icon="💪"
          count={inProgress.length}
          color="bg-amber-500/80"
        >
          {inProgress.map((inst) => (
            <JobCard
              key={inst.id}
              job={inst.job}
              status="in_progress"
              instanceId={inst.id}
              onComplete={() => handleComplete(inst.id, inst.jobId)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="Done!"
          icon="🎉"
          count={completed.length}
          color="bg-green-500/80"
        >
          {completed.map((inst) => (
            <JobCard
              key={inst.id}
              job={inst.job}
              status="completed"
              instanceId={inst.id}
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
