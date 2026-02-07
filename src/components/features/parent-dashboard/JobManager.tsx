"use client";

import { useState } from "react";
import { Job } from "@/types";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { CURRENCY, CHILD_ICON_CONFIG } from "@/lib/constants";
import { JobForm } from "./JobForm";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { ChildIcon } from "@/types";

export function JobManager() {
  const { t, locale } = useTranslation();
  const { jobs, addJob, editJob, deleteJob, familyChildren, getChildById } =
    usePocketMoney();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Job | undefined>();

  const handleAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const handleEdit = (job: Job) => {
    setEditing(job);
    setFormOpen(true);
  };

  const handleSave = (jobData: {
    title: string;
    titleJa?: string;
    yenAmount: number;
    assignedTo: string;
    dailyLimit: number;
    weeklyLimit: number;
    icon: string;
  }) => {
    if (editing) {
      editJob(editing._id, jobData);
    } else {
      addJob(jobData);
    }
  };

  const getAssignmentLabel = (assignedTo: string) => {
    if (assignedTo === "all") return t("job_form_assigned_both");
    const child = getChildById(assignedTo);
    if (!child) return assignedTo;
    const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
    return `${iconConfig?.emoji ?? ""} ${child.name}`;
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
        <Button
          onClick={handleAdd}
          className="bg-amber-600 font-bold text-white hover:bg-amber-700"
        >
          {t("job_manager_new")}
        </Button>
      </div>

      <div className="space-y-2">
        {jobs.map((job) => (
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
              <p className="text-xs text-amber-300/60">
                {getAssignmentLabel(job.assignedTo)} &middot;{" "}
                {t("job_manager_daily", { count: String(job.dailyLimit) })}{" "}
                &middot;{" "}
                {t("job_manager_weekly", { count: String(job.weeklyLimit) })}
              </p>
            </div>
            <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-300">
              {CURRENCY}
              {job.yenAmount}
            </span>
            <div className="flex gap-1">
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
        children={familyChildren}
      />
    </div>
  );
}
