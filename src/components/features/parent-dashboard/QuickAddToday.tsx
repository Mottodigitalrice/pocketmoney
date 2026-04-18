"use client";

import { useMemo, useState } from "react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CURRENCY, CHILD_ICON_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { ChildIcon } from "@/types";
import type { TranslationKey } from "@/lib/i18n/translations";

export function QuickAddToday() {
  const { t, locale } = useTranslation();
  const { jobs, familyChildren, quickAddForToday } = usePocketMoney();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [preApprove, setPreApprove] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const libraryJobs = useMemo(
    () => jobs.filter((job) => !job.isOneOff),
    [jobs]
  );

  const selectedJob = libraryJobs.find((job) => job._id === selectedJobId);

  const openAssignDialog = (jobId: string) => {
    setSelectedJobId(jobId);
    setSelectedChildIds([]);
    setPreApprove(false);
  };

  const closeAssignDialog = () => {
    setSelectedJobId(null);
    setSelectedChildIds([]);
    setPreApprove(false);
  };

  const toggleChild = (childId: string) => {
    setSelectedChildIds((current) =>
      current.includes(childId)
        ? current.filter((id) => id !== childId)
        : [...current, childId]
    );
  };

  const handleConfirm = async () => {
    if (!selectedJob || selectedChildIds.length === 0 || isSaving) return;

    setIsSaving(true);
    try {
      await quickAddForToday(selectedJob._id, selectedChildIds, { preApprove });
      closeAssignDialog();
    } finally {
      setIsSaving(false);
    }
  };

  if (familyChildren.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-900/20 py-12 text-center">
        <span className="mb-3 text-5xl">👶</span>
        <p className="text-lg font-semibold text-amber-200">
          {t("children_empty")}
        </p>
        <p className="text-sm text-amber-300/60">
          {t("quick_add_empty_children")}
        </p>
      </div>
    );
  }

  if (libraryJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-900/20 py-12 text-center">
        <span className="mb-3 text-5xl">📜</span>
        <p className="text-lg font-semibold text-amber-200">
          {t("job_manager_title", { count: "0" })}
        </p>
        <p className="text-sm text-amber-300/60">
          {t("quick_add_empty_jobs")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-700/20 bg-amber-900/20 p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h2 className="text-lg font-bold text-amber-100">
                {t("quick_add_title")}
              </h2>
              <p className="mt-1 text-sm text-amber-300/70">
                {t("quick_add_subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {libraryJobs.map((job) => (
            <button
              key={job._id}
              type="button"
              onClick={() => openAssignDialog(job._id)}
              className="rounded-2xl border border-amber-700/20 bg-amber-900/30 p-4 text-left backdrop-blur-sm transition-all hover:border-amber-500/40 hover:bg-amber-800/40"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{job.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-amber-100">
                    {job.titleKey
                      ? t(job.titleKey as TranslationKey)
                      : locale === "ja" && job.titleJa
                        ? job.titleJa
                        : job.title}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-amber-300">
                    {CURRENCY}
                    {job.yenAmount.toLocaleString()}
                  </p>
                </div>
                <span className="text-xl text-amber-400">+</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && closeAssignDialog()}>
        <DialogContent className="border-amber-700/50 bg-amber-950 text-amber-100 sm:max-w-md">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-amber-100">
                  {selectedJob.icon} {selectedJob.titleKey
                    ? t(selectedJob.titleKey as TranslationKey)
                    : locale === "ja" && selectedJob.titleJa
                      ? selectedJob.titleJa
                      : selectedJob.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-amber-200">
                    {t("quick_add_choose_who")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {familyChildren.map((child) => {
                      const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
                      const isSelected = selectedChildIds.includes(child._id);

                      return (
                        <button
                          key={child._id}
                          type="button"
                          onClick={() => toggleChild(child._id)}
                          className={`rounded-xl border px-3 py-3 text-left transition-all ${
                            isSelected
                              ? "border-amber-400 bg-amber-600/30 ring-1 ring-amber-400"
                              : "border-amber-700/20 bg-amber-900/30 hover:bg-amber-800/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{iconConfig?.emoji ?? "👤"}</span>
                            <span className="font-semibold text-amber-100">
                              {child.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-700/20 bg-amber-900/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-amber-100">
                        {t("quick_add_preapprove")}
                      </p>
                      <p className="mt-1 text-sm text-amber-300/70">
                        {t("quick_add_preapprove_hint")}
                      </p>
                    </div>
                    <Switch
                      checked={preApprove}
                      onCheckedChange={setPreApprove}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={selectedChildIds.length === 0 || isSaving}
                  className="w-full bg-amber-600 font-bold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {isSaving ? t("quick_add_assigning") : t("quick_add_confirm")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
