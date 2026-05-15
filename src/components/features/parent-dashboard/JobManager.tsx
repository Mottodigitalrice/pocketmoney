"use client";

import { useState } from "react";
import { Job } from "@/types";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { CURRENCY, CHILD_ICON_CONFIG } from "@/lib/constants";
import { JobForm } from "./JobForm";
import { OneOffTaskForm } from "./OneOffTaskForm";
import { Skeleton } from "@/components/ui/skeleton";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { ChildIcon, JobPriority, RecurrenceType } from "@/types";

/**
 * G2: JobManagerSkeleton — header + 4 row skeletons (title + amount + icons).
 */
function JobManagerSkeleton() {
  return (
    <div aria-hidden="true" data-testid="job-manager-skeleton" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded bg-amber-900/40" />
          <Skeleton className="h-5 w-32 rounded bg-amber-900/40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-24 rounded-xl bg-amber-900/40" />
          <Skeleton className="h-11 w-24 rounded-xl bg-amber-900/40" />
        </div>
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-amber-700/20 bg-amber-900/30 p-3"
          >
            <Skeleton className="size-8 rounded bg-amber-900/50" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 rounded bg-amber-900/40" />
              <Skeleton className="h-3 w-24 rounded bg-amber-900/30" />
            </div>
            <Skeleton className="h-7 w-16 rounded-full bg-amber-900/40" />
            <div className="flex gap-1">
              <Skeleton className="size-11 rounded bg-amber-900/30" />
              <Skeleton className="size-11 rounded bg-amber-900/30" />
              <Skeleton className="size-11 rounded bg-amber-900/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BudouXText } from "@/components/shared/BudouXText";

export function JobManager() {
  const { t, locale } = useTranslation();
  const { isLoading, jobs, addJob, editJob, deleteJob, familyChildren, quickAssign } =
    usePocketMoney();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Job | undefined>();
  const [oneOffOpen, setOneOffOpen] = useState(false);
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);
  // F12: confirm-dialog state for destructive delete. Same pattern as
  // ChildManager — orphans scheduled instances, so we gate behind confirm.
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  // G2: skeleton while context hydrates.
  if (isLoading) return <JobManagerSkeleton />;

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
            className="min-h-11 border-amber-600/50 text-amber-300 hover:bg-amber-800/40"
          >
            {t("oneoff_title")}
          </Button>
          <Button
            onClick={handleAdd}
            className="min-h-11 bg-amber-600 font-bold text-white hover:bg-amber-700"
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
            <BudouXText>{t("job_library_empty_hint")}</BudouXText>
          </p>
          <Button
            onClick={handleAdd}
            className="mt-2 min-h-11 bg-amber-600 font-bold text-white hover:bg-amber-700"
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
            {/* F20: bumped emoji icon buttons from size="sm" (h-8) to
                size="icon" (h-9 w-9) + min-h-11/min-w-11 floors so each
                hits the 44px Apple HIG. aria-label promoted from title so
                screen readers + AT announce the action, not the emoji. */}
            <div className="flex gap-1">
              {/* S2 (R4) — F10 5.10: disable quick-assign when no crew exists.
                  Without kids, the picker dialog has nothing to pick — silently
                  opening it would dead-end the parent. Also marks aria-disabled
                  for assistive tech. */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAssigningJobId(job._id)}
                disabled={familyChildren.length === 0}
                aria-disabled={familyChildren.length === 0}
                className="min-h-11 min-w-11 text-base text-green-400 hover:bg-green-900/40 hover:text-green-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label={
                  familyChildren.length === 0
                    ? t("job_manager_quick_assign_no_kids_aria")
                    : t("job_manager_quick_assign")
                }
                title={
                  familyChildren.length === 0
                    ? t("job_manager_quick_assign_no_kids_aria")
                    : t("job_manager_quick_assign")
                }
              >
                📅
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(job)}
                aria-label={t("job_manager_edit_aria")}
                className="min-h-11 min-w-11 text-base text-amber-300 hover:bg-amber-800/40 hover:text-amber-100"
              >
                ✏️
              </Button>
              <Button
                variant="ghost"
                size="icon"
                // F12: route delete through confirm dialog. Single-tap
                // destructive delete is forbidden (F10 gap 5.9).
                onClick={() => setDeletingJobId(job._id)}
                data-testid="job-row-delete"
                aria-label={t("job_manager_delete_aria")}
                className="min-h-11 min-w-11 text-base text-red-400 hover:bg-red-900/40 hover:text-red-300"
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
        {...(editing !== undefined ? { editingJob: editing } : {})}
      />

      <OneOffTaskForm
        open={oneOffOpen}
        onClose={() => setOneOffOpen(false)}
      />

      {/* F12 — Delete-job confirmation dialog */}
      <ConfirmDialog
        open={!!deletingJobId}
        onClose={() => setDeletingJobId(null)}
        onConfirm={() => {
          if (deletingJobId) deleteJob(deletingJobId);
        }}
        title={t("job_delete_confirm_title")}
        body={<BudouXText>{t("job_delete_confirm_body")}</BudouXText>}
        confirmLabel={t("job_delete_confirm_cta")}
        cancelLabel={t("job_delete_confirm_cancel")}
        confirmTestId="job-delete-confirm"
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
          <DialogBody className="space-y-2 pb-6">
            {familyChildren.map((child) => {
              const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
              return (
                <button
                  key={child._id}
                  onClick={() =>
                    assigningJobId && handleQuickAssign(assigningJobId, child._id)
                  }
                  // F20: explicit min-h-[60px] for tap target (p-4 already
                  // hits 44 with 24px text, but explicit floor is safer).
                  className="flex min-h-[60px] w-full items-center gap-3 rounded-xl bg-amber-900/30 p-4 text-left transition-all hover:bg-amber-800/40"
                >
                  <span className="text-2xl">{iconConfig?.emoji ?? "👤"}</span>
                  <span className="font-semibold text-amber-100">
                    {child.name}
                  </span>
                </button>
              );
            })}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
