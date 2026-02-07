"use client";

import { usePocketMoney } from "@/hooks/use-pocket-money";
import { ApprovalCard } from "./ApprovalCard";

export function ApprovalQueue() {
  const { getPendingApprovals, approveJob, rejectJob } = usePocketMoney();
  const pending = getPendingApprovals();

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-900/20 py-12 text-center">
        <span className="mb-3 text-5xl">⚓</span>
        <p className="text-lg font-semibold text-amber-200">All clear, Captain!</p>
        <p className="text-sm text-amber-300/60">No jobs waiting for approval</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">📋</span>
        <h2 className="text-lg font-bold text-amber-100">
          Waiting for Approval ({pending.length})
        </h2>
      </div>
      <div className="space-y-3">
        {pending.map((inst) => (
          <ApprovalCard
            key={inst.id}
            instance={inst}
            onApprove={() => approveJob(inst.id)}
            onReject={() => rejectJob(inst.id)}
          />
        ))}
      </div>
    </div>
  );
}
