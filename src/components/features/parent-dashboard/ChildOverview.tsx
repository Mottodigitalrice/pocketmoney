"use client";

import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CURRENCY, CHILD_ICON_CONFIG } from "@/lib/constants";
import type { ChildIcon } from "@/types";

interface ChildOverviewProps {
  childId: string;
}

export function ChildOverview({ childId }: ChildOverviewProps) {
  const { t } = useTranslation();
  const {
    getChildById,
    getWeeklyEarnings,
    getWeeklyPotential,
    getInProgressJobs,
    getCompletedJobs,
    getInstancesForChild,
  } = usePocketMoney();

  const child = getChildById(childId);
  if (!child) return null;

  const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
  const earned = getWeeklyEarnings(childId);
  const potential = getWeeklyPotential(childId);
  const inProgress = getInProgressJobs(childId);
  const completed = getCompletedJobs(childId);
  const allInstances = getInstancesForChild(childId);
  const approved = allInstances.filter((i) => i.status === "approved");

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-700/30 bg-amber-900/30 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{iconConfig?.emoji ?? "👤"}</span>
        <div>
          <h3 className="text-lg font-bold text-amber-100">{child.name}</h3>
          <p className="text-sm text-amber-300/70">
            {iconConfig?.label ?? child.icon}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-amber-800/30 p-3 text-center">
          <p className="text-2xl font-extrabold text-amber-100">
            {CURRENCY}
            {earned.toLocaleString()}
          </p>
          <p className="text-xs text-amber-300/60">{t("overview_earned")}</p>
        </div>
        <div className="rounded-xl bg-amber-800/30 p-3 text-center">
          <p className="text-2xl font-extrabold text-amber-100">
            {CURRENCY}
            {potential.toLocaleString()}
          </p>
          <p className="text-xs text-amber-300/60">{t("overview_possible")}</p>
        </div>
        <div className="rounded-xl bg-amber-800/30 p-3 text-center">
          <p className="text-2xl font-extrabold text-blue-300">
            {inProgress.length}
          </p>
          <p className="text-xs text-amber-300/60">
            {t("overview_in_progress")}
          </p>
        </div>
        <div className="rounded-xl bg-amber-800/30 p-3 text-center">
          <p className="text-2xl font-extrabold text-green-300">
            {approved.length}
          </p>
          <p className="text-xs text-amber-300/60">
            {t("overview_completed")}
          </p>
        </div>
      </div>

      {completed.length > 0 && (
        <p className="mt-3 text-sm text-amber-400">
          {t("overview_waiting", { count: String(completed.length) })}
        </p>
      )}
    </div>
  );
}
