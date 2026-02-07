"use client";

import { Job, JobInstance } from "@/types";
import { Button } from "@/components/ui/button";
import { CURRENCY, CHILD_ICON_CONFIG } from "@/lib/constants";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import type { ChildIcon } from "@/types";
import type { TranslationKey } from "@/lib/i18n/translations";

interface ApprovalCardProps {
  instance: JobInstance & { job: Job };
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalCard({ instance, onApprove, onReject }: ApprovalCardProps) {
  const { t, locale } = useTranslation();
  const { getChildById } = usePocketMoney();
  const child = getChildById(instance.childId);
  const iconConfig = child
    ? CHILD_ICON_CONFIG[child.icon as ChildIcon]
    : null;

  const completedTime = instance.completedAt
    ? new Date(instance.completedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="overflow-hidden rounded-xl border border-amber-700/30 bg-amber-900/40 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{instance.job.icon}</span>
          <div>
            <h3 className="font-bold text-amber-100">
              {instance.job.titleKey
                ? t(instance.job.titleKey as TranslationKey)
                : locale === "ja" && instance.job.titleJa
                  ? instance.job.titleJa
                  : instance.job.title}
            </h3>
            <p className="text-sm text-amber-300/70">
              {child?.name ?? "Unknown"} ({iconConfig?.emoji ?? "👤"}) -{" "}
              {completedTime}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-300">
          {CURRENCY}
          {instance.job.yenAmount}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          onClick={onApprove}
          className="flex-1 rounded-lg bg-green-600 font-bold text-white hover:bg-green-700"
        >
          {t("approval_approve")}
        </Button>
        <Button
          onClick={onReject}
          variant="outline"
          className="flex-1 rounded-lg border-red-500/50 font-bold text-red-400 hover:bg-red-500/10"
        >
          {t("approval_reject")}
        </Button>
      </div>
    </div>
  );
}
