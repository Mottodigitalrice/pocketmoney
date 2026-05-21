"use client";

import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CURRENCY, CHILD_ICON_CONFIG } from "@/lib/constants";
import type { ChildIcon } from "@/types";
import { WalletJarBalances } from "@/components/features/shared/WalletJarBalances";
import { WithdrawalDialog } from "./WithdrawalDialog";
import { BonusDialog } from "./BonusDialog";

interface ChildOverviewProps {
  childId: string;
}

export function ChildOverview({ childId }: ChildOverviewProps) {
  const { t } = useTranslation();
  const {
    getChildById,
    getWeeklyEarnings,
    getWeeklyPotential,
    getWalletBalance,
    getWalletTotal,
    getRankForChild,
    getInProgressJobs,
    getCompletedJobs,
    getInstancesForChild,
  } = usePocketMoney();

  const child = getChildById(childId);
  if (!child) return null;

  const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
  const earned = getWeeklyEarnings(childId);
  const potential = getWeeklyPotential(childId);
  const walletBalances = {
    spend: getWalletBalance(childId, "spend"),
    save: getWalletBalance(childId, "save"),
    give: getWalletBalance(childId, "give"),
  };
  const walletTotal = getWalletTotal(childId);
  const rank = getRankForChild(childId);
  const inProgress = getInProgressJobs(childId);
  const completed = getCompletedJobs(childId);
  const allInstances = getInstancesForChild(childId);
  const approved = allInstances.filter((i) => i.status === "approved");

  return (
    <div
      data-testid="child-overview"
      data-child-id={childId}
      data-child-name={child.name}
      className="overflow-hidden rounded-2xl border border-amber-700/30 bg-amber-900/30 p-5 backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{iconConfig?.emoji ?? "👤"}</span>
        <div>
          <h3 className="text-lg font-bold text-amber-100">{child.name}</h3>
          <p className="text-sm text-amber-300/70">
            {iconConfig?.label ?? child.icon}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-950/35 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/70">
              {t("rank_current")}
            </p>
            <p className="text-xl font-extrabold text-amber-100">{rank.rank}</p>
          </div>
          <p className="text-sm font-semibold text-amber-200/80">
            {t("rank_score", { score: rank.score.toLocaleString() })}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-950">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-200"
            style={{ width: `${rank.progress}%` }}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <WalletJarBalances balances={walletBalances} total={walletTotal} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <BonusDialog childId={childId} childName={child.name} />
          <WithdrawalDialog childId={childId} childName={child.name} />
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
          <p className="text-xs text-amber-300/60">{t("overview_completed")}</p>
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
