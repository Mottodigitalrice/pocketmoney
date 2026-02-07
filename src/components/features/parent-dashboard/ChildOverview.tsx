"use client";

import { ChildId } from "@/types";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { CURRENCY, CHILDREN } from "@/lib/constants";

interface ChildOverviewProps {
  childId: ChildId;
}

export function ChildOverview({ childId }: ChildOverviewProps) {
  const {
    getWeeklyEarnings,
    getWeeklyPotential,
    getInProgressJobs,
    getCompletedJobs,
    getInstancesForChild,
  } = usePocketMoney();

  const child = CHILDREN[childId];
  const earned = getWeeklyEarnings(childId);
  const potential = getWeeklyPotential(childId);
  const inProgress = getInProgressJobs(childId);
  const completed = getCompletedJobs(childId);
  const allInstances = getInstancesForChild(childId);
  const approved = allInstances.filter((i) => i.status === "approved");

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-700/30 bg-amber-900/30 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{childId === "jayden" ? "🦈" : "🐬"}</span>
        <div>
          <h3 className="text-lg font-bold text-amber-100">{child.name}</h3>
          <p className="text-sm text-amber-300/70">
            {childId === "jayden" ? "Great White Shark" : "Dolphin"} - Age {child.age}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-amber-800/30 p-3 text-center">
          <p className="text-2xl font-extrabold text-amber-100">
            {CURRENCY}{earned.toLocaleString()}
          </p>
          <p className="text-xs text-amber-300/60">Earned</p>
        </div>
        <div className="rounded-xl bg-amber-800/30 p-3 text-center">
          <p className="text-2xl font-extrabold text-amber-100">
            {CURRENCY}{potential.toLocaleString()}
          </p>
          <p className="text-xs text-amber-300/60">Possible</p>
        </div>
        <div className="rounded-xl bg-amber-800/30 p-3 text-center">
          <p className="text-2xl font-extrabold text-blue-300">{inProgress.length}</p>
          <p className="text-xs text-amber-300/60">In Progress</p>
        </div>
        <div className="rounded-xl bg-amber-800/30 p-3 text-center">
          <p className="text-2xl font-extrabold text-green-300">{approved.length}</p>
          <p className="text-xs text-amber-300/60">Completed</p>
        </div>
      </div>

      {/* Pending approvals for this child */}
      {completed.length > 0 && (
        <p className="mt-3 text-sm text-amber-400">
          ⏳ {completed.length} job{completed.length > 1 ? "s" : ""} waiting for approval
        </p>
      )}
    </div>
  );
}
