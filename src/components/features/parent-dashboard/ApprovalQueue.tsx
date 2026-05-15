"use client";

import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { BudouXText } from "@/components/shared/BudouXText";
import { Skeleton } from "@/components/ui/skeleton";
import { ApprovalCard } from "./ApprovalCard";

/**
 * G2: ApprovalQueueSkeleton — 3 row placeholders (avatar + label + button).
 */
function ApprovalQueueSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="approval-queue-skeleton"
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Skeleton className="size-7 rounded bg-amber-900/40" />
        <Skeleton className="h-5 w-44 rounded bg-amber-900/40" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-amber-700/20 bg-amber-900/30 p-3"
          >
            <Skeleton className="size-10 rounded-full bg-amber-900/50" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 rounded bg-amber-900/40" />
              <Skeleton className="h-3 w-24 rounded bg-amber-900/30" />
            </div>
            <Skeleton className="h-10 w-20 rounded-xl bg-amber-900/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApprovalQueue() {
  const { isLoading, getPendingApprovals, approveJob, rejectJob } = usePocketMoney();
  const { t } = useTranslation();

  if (isLoading) return <ApprovalQueueSkeleton />;

  const pending = getPendingApprovals();

  const handleReject = (instanceId: string) => {
    const parentNote = window.prompt(t("approval_reject_note_prompt"));
    if (!parentNote?.trim()) return;
    rejectJob(instanceId, parentNote.trim());
  };

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-900/20 px-6 py-12 text-center">
        <span className="mb-3 text-5xl">⚓</span>
        <p className="text-lg font-semibold text-amber-200">
          {t("approvals_empty_title")}
        </p>
        <p className="mt-1 text-sm text-amber-300/70">
          <BudouXText>{t("approvals_empty_hint")}</BudouXText>
        </p>
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
            onReject={() => handleReject(inst._id)}
          />
        ))}
      </div>
    </div>
  );
}
