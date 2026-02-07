"use client";

import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { ApprovalCard } from "./ApprovalCard";

export function ApprovalQueue() {
  const { getPendingApprovals, approveJob, rejectJob } = usePocketMoney();
  const { t } = useTranslation();
  const pending = getPendingApprovals();

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-900/20 py-12 text-center">
        <span className="mb-3 text-5xl">⚓</span>
        <p className="text-lg font-semibold text-amber-200">
          {t("approval_all_clear")}
        </p>
        <p className="text-sm text-amber-300/60">{t("approval_no_jobs")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">📋</span>
        <h2 className="text-lg font-bold text-amber-100">
          {t("approval_waiting_title", { count: String(pending.length) })}
        </h2>
      </div>
      <div className="space-y-3">
        {pending.map((inst) => (
          <ApprovalCard
            key={inst._id}
            instance={inst}
            onApprove={() => approveJob(inst._id)}
            onReject={() => rejectJob(inst._id)}
          />
        ))}
      </div>
    </div>
  );
}
