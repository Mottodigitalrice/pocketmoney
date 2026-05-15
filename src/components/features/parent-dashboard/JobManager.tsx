"use client";

import { useState } from "react";
import { Job } from "@/types";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { CURRENCY, CHILD_ICON_CONFIG } from "@/lib/constants";
import { JobForm } from "./JobForm";
import { OneOffTaskForm } from "./OneOffTaskForm";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { ChildIcon, JobPriority, RecurrenceType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function JobManager() {
  const { t, locale } = useTranslation();
  const { jobs, addJob, editJob, deleteJob, familyChildren, quickAssign } =
    usePocketMoney();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Job | undefined>();
  const [oneOffOpen, setOneOffOpen] = useState(false);
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const handleEdit = (job: Job) => {
    setEditing(job);
    setFormOpen(true);
  };

  const handleSave = async (jobData: {
    title: string;
    titleJa?: string;
    yenAmount: number;
    icon: string;
    requiresPhotoProof?: boolean;
    recurrence?: {
      type: RecurrenceType;
      daysOfWeek?: number[];
      priority?: JobPriority;
    };
  }) => {
    if (editing) {
      editJob(editing._id, jobData);
    } else {
      await addJob(jobData);
    }
  };

  const handleQuickAssign = (jobId: string, childId: string) => {
    quickAssign(jobId, childId);
    setAssigningJobId(null);
  };

  const getRecurrenceLabel = (job: Job) => {
    const recurrence = job.recurrence;
    if (!recurrence || recurrence.type === "none") return null;
    if (recurrence.type !== "specificDays") {
      return t(`recurrence_${recurrence.type}` as TranslationKey);
    }
    const days = (recurrence.daysOfWeek ?? [])
      .map((day) => t(`recurrence_day_${day}` as TranslationKey))
      .join(", ");
    return days || t("recurrence_specificDays");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <h2 className="text-lg font-bold text-amber-100">
            {t("job_manager_title", { count: String(jobs.length) })}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setOneOffOpen(true)}
            variant="outline"
            className="border-amber-600/50 text-amber-300 hover:bg-amber-800/40"
          >
            {t("oneoff_title")}
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-amber-600 font-bold text-white hover:bg-amber-700"
          >
            {t("job_manager_new")}
          </Button>
        </div>
      </div>

      {jobs.filter((job) => !job.isOneOff).length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-700/20 bg-amber-900/20 px-6 py-12 text-center backdrop-blur-sm">
          <span className="text-5xl">📜</span>
          <p className="text-lg font-semibold text-amber-200">
            {t("job_library_empty_title")}
          </p>
          <p className="text-sm text-amber-300/70">
            {t("job_library_empty_hint")}
          </p>
          <Button
            onClick={handleAdd}
            className="mt-2 bg-amber-600 font-bold text-white hover:bg-amber-700"
          >
            {t("job_library_empty_cta")}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {jobs.filter((job) => !job.isOneOff).map((job) => (
          <div
            key={job._id}
            className="flex items-center gap-3 rounded-xl border border-amber-700/20 bg-amber-900/30 p-3 backdrop-blur-sm"
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
              {getRecurrenceLabel(job) && (
                <p className="mt-1 truncate text-xs font-semibold text-amber-300/70">
                  {getRecurrenceLabel(job)}
                </p>
              )}
              {job.requiresPhotoProof && (
                <p className="mt-1 text-xs font-semibold text-sky-200">
                  {t("job_manager_photo_proof")}
                </p>
              )}
            </div>
            <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-300">
              {CURRENCY}
              {job.yenAmount}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAssigningJobId(job._id)}
                className="text-xs text-green-400 hover:bg-green-900/40 hover:text-green-300"
                title={t("job_manager_quick_assign")}
              >
                📅
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(job)}
                className="text-amber-300 hover:bg-amber-800/40 hover:text-amber-100"
              >
                ✏️
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteJob(job._id)}
                className="text-red-400 hover:bg-red-900/40 hover:text-red-300"
              >
                🗑️
              </Button>
            </div>
          </div>
        ))}
      </div>

      <JobForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editingJob={editing}
      />

      <OneOffTaskForm
        open={oneOffOpen}
        onClose={() => setOneOffOpen(false)}
      />

      {/* Quick assign child picker */}
      <Dialog
        open={!!assigningJobId}
        onOpenChange={(v) => !v && setAssigningJobId(null)}
      >
        <DialogContent className="border-amber-700/50 bg-amber-950 text-amber-100 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-100">
              {t("job_manager_choose_child")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {familyChildren.map((child) => {
              const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
              return (
                <button
                  key={child._id}
                  onClick={() =>
                    assigningJobId && handleQuickAssign(assigningJobId, child._id)
                  }
                  className="flex w-full items-center gap-3 rounded-xl bg-amber-900/30 p-4 text-left transition-all hover:bg-amber-800/40"
                >
                  <span className="text-2xl">{iconConfig?.emoji ?? "👤"}</span>
                  <span className="font-semibold text-amber-100">
                    {child.name}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
