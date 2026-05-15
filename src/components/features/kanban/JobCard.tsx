"use client";

import { useState } from "react";
import { Job, JobPriority, JobStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { CURRENCY } from "@/lib/constants";
import { useTranslation } from "@/hooks/use-translation";
import type { TranslationKey } from "@/lib/i18n/translations";

interface JobCardProps {
  job: Job;
  status: JobStatus | "available";
  instanceId?: string;
  parentNote?: string;
  priority?: JobPriority;
  onStart?: () => void;
  onComplete?: (proofFile?: File) => Promise<void> | void;
}

export function JobCard({
  job,
  status,
  instanceId,
  parentNote,
  priority,
  onStart,
  onComplete,
}: JobCardProps) {
  const [bouncing, setBouncing] = useState(false);
  const [animationDuration] = useState(() => 3 + Math.random() * 2);
  const [proofFile, setProofFile] = useState<File | undefined>();
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState("");
  const { t, locale } = useTranslation();
  const requiresPhotoProof = Boolean(job.requiresPhotoProof);

  const handleAction = async () => {
    if (status === "in_progress" && requiresPhotoProof && !proofFile) {
      setError(t("photo_proof_required"));
      return;
    }

    setError("");
    setBouncing(true);
    setTimeout(() => setBouncing(false), 500);

    if (status === "available" && onStart) {
      onStart();
    } else if (status === "in_progress" && onComplete) {
      setIsCompleting(true);
      try {
        await onComplete(proofFile);
      } catch {
        setError(t("photo_proof_error"));
      } finally {
        setIsCompleting(false);
      }
    }
  };

  return (
    <div
      data-testid="job-card"
      data-job-id={job._id}
      data-instance-id={instanceId}
      data-status={status}
      className={`animate-bob group relative overflow-hidden rounded-2xl border-2 bg-white/90 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
        bouncing ? "animate-scale-bounce" : ""
      } ${
        status === "available"
          ? "border-blue-300"
          : status === "in_progress"
          ? "border-amber-400"
          : "border-green-400"
      }`}
      style={{ animationDuration: `${animationDuration}s` }}
    >
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
        {CURRENCY}
        {job.yenAmount}
      </div>

      {priority === "mustDo" && (
        <div className="mb-3 w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-red-700">
          {t("priority_must_do")}
        </div>
      )}

      <div className="mb-3 flex items-center gap-3">
        <span className="text-3xl">{job.icon}</span>
        <h3 className="line-clamp-2 pr-16 text-lg font-bold text-gray-800">
          {job.titleKey
            ? t(job.titleKey as TranslationKey)
            : locale === "ja" && job.titleJa
              ? job.titleJa
              : job.title}
        </h3>
      </div>

      {status === "available" && parentNote && (
        <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
          {t("job_try_again_note", { note: parentNote })}
        </div>
      )}

      {status === "available" && (
        <Button
          onClick={handleAction}
          className="w-full rounded-xl bg-blue-500 py-6 text-lg font-bold text-white hover:bg-blue-600 active:scale-95"
          size="lg"
        >
          {t("job_start")}
        </Button>
      )}

      {status === "in_progress" && (
        <div className="space-y-3">
          {requiresPhotoProof && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-3">
              <p className="mb-2 text-sm font-bold text-sky-800">
                {t("photo_proof_required")}
              </p>
              <label className="block cursor-pointer rounded-lg bg-white px-3 py-2 text-center text-sm font-bold text-sky-700 shadow-sm ring-1 ring-sky-200">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  data-testid="job-card-proof-input"
                  className="sr-only"
                  onChange={(event) => {
                    setProofFile(event.target.files?.[0]);
                    setError("");
                  }}
                />
                {proofFile
                  ? t("photo_proof_chosen", { name: proofFile.name })
                  : t("photo_proof_choose")}
              </label>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <Button
            onClick={handleAction}
            disabled={isCompleting || (requiresPhotoProof && !proofFile)}
            className="w-full rounded-xl bg-green-500 py-6 text-lg font-bold text-white hover:bg-green-600 active:scale-95 disabled:opacity-60"
            size="lg"
          >
            {isCompleting ? t("photo_proof_uploading") : t("job_complete")}
          </Button>
        </div>
      )}

      {status === "completed" && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-3 text-amber-700">
          <span className="text-lg">⏳</span>
          <span className="font-semibold">{t("job_waiting")}</span>
        </div>
      )}
    </div>
  );
}
