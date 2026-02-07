"use client";

import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CURRENCY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TranslationKey } from "@/lib/i18n/translations";

interface JobPickerSheetProps {
  open: boolean;
  onClose: () => void;
  childId: string;
  date: string;
  title: string;
}

export function JobPickerSheet({
  open,
  onClose,
  childId,
  date,
  title,
}: JobPickerSheetProps) {
  const { t, locale } = useTranslation();
  const {
    jobs,
    scheduleJob,
    getScheduledJobsForChildDate,
    removeScheduledJob,
    clearScheduledDay,
  } = usePocketMoney();

  const scheduled = getScheduledJobsForChildDate(childId, date);
  const scheduledJobIds = new Set(scheduled.map((s) => s.jobId));

  const handleToggleJob = (jobId: string) => {
    if (scheduledJobIds.has(jobId)) {
      const entry = scheduled.find((s) => s.jobId === jobId);
      if (entry) removeScheduledJob(entry._id);
    } else {
      scheduleJob(jobId, childId, date);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto border-amber-700/50 bg-amber-950 text-amber-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-100">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {jobs.map((job) => {
            const isSelected = scheduledJobIds.has(job._id);
            return (
              <button
                key={job._id}
                onClick={() => handleToggleJob(job._id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                  isSelected
                    ? "bg-amber-600/30 ring-2 ring-amber-400"
                    : "bg-amber-900/30 hover:bg-amber-800/40"
                }`}
              >
                <span className="text-2xl">{job.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-amber-100">
                    {job.titleKey
                      ? t(job.titleKey as TranslationKey)
                      : locale === "ja" && job.titleJa
                        ? job.titleJa
                        : job.title}
                  </h3>
                </div>
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                  {CURRENCY}
                  {job.yenAmount}
                </span>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                    isSelected
                      ? "border-amber-400 bg-amber-500 text-white"
                      : "border-amber-600"
                  }`}
                >
                  {isSelected && <span className="text-xs">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          {scheduled.length > 0 && (
            <Button
              variant="outline"
              onClick={() => clearScheduledDay(childId, date)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              {t("planner_clear_day")}
            </Button>
          )}
          <Button
            onClick={onClose}
            className="flex-1 bg-amber-600 font-bold text-white hover:bg-amber-700"
          >
            {t("planner_done")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
