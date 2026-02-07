"use client";

import { Job, KidJobInstance, ChildId } from "@/types";
import { Button } from "@/components/ui/button";
import { CURRENCY, CHILDREN } from "@/lib/constants";

interface ApprovalCardProps {
  instance: KidJobInstance & { job: Job };
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalCard({ instance, onApprove, onReject }: ApprovalCardProps) {
  const child = CHILDREN[instance.childId as ChildId];
  const completedTime = instance.completedAt
    ? new Date(instance.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="overflow-hidden rounded-xl border border-amber-700/30 bg-amber-900/40 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{instance.job.icon}</span>
          <div>
            <h3 className="font-bold text-amber-100">{instance.job.title}</h3>
            <p className="text-sm text-amber-300/70">
              {child.name} ({instance.childId === "jayden" ? "🦈" : "🐬"}) - {completedTime}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-300">
          {CURRENCY}{instance.job.yenAmount}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          onClick={onApprove}
          className="flex-1 rounded-lg bg-green-600 font-bold text-white hover:bg-green-700"
        >
          Approve ✅
        </Button>
        <Button
          onClick={onReject}
          variant="outline"
          className="flex-1 rounded-lg border-red-500/50 font-bold text-red-400 hover:bg-red-500/10"
        >
          Try Again 🔄
        </Button>
      </div>
    </div>
  );
}
