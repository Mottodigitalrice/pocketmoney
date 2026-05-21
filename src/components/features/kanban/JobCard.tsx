"use client";

import { useState } from "react";
import { Job, JobPriority, JobStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { CURRENCY } from "@/lib/constants";
import { useTranslation } from "@/hooks/use-translation";
import type { TranslationKey } from "@/lib/i18n/translations";
import { mapConvexError } from "@/lib/convex-errors";
import { RetryablePhotoUploadError } from "@/lib/photo-proof";

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
  const [retryable, setRetryable] = useState(false);
  const { t, locale } = useTranslation();
  const requiresPhotoProof = Boolean(job.requiresPhotoProof);

  const handleAction = async () => {
    if (status === "in_progress" && requiresPhotoProof && !proofFile) {
      setError(t("photo_proof_required"));
      setRetryable(false);
      return;
    }

    setError("");
    setRetryable(false);
    setBouncing(true);
    setTimeout(() => setBouncing(false), 500);

    if (status === "available" && onStart) {
      onStart();
    } else if (status === "in_progress" && onComplete) {
      setIsCompleting(true);
      try {
        await onComplete(proofFile);
      } catch (err) {
        // F12: route errors through the typed mapper so the kid sees a
        // friendly message, not a raw error code.
        if (err instanceof RetryablePhotoUploadError) {
          setError(t("error_network"));
          setRetryable(true);
        } else {
          const { message } = mapConvexError(err, t);
          setError(message);
          setRetryable(false);
        }
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
              {/* F19 a11y: visible focus-within ring on the file picker.
                  The native input is sr-only, so we ring the wrapping label
                  whenever the hidden input takes focus via keyboard. */}
              <label className="block cursor-pointer rounded-lg bg-white px-3 py-2 text-center text-sm font-bold text-sky-700 shadow-sm ring-1 ring-sky-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-amber-400">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  data-testid="job-card-proof-input"
                  className="sr-only"
                  onChange={(event) => {
                    setProofFile(event.target.files?.[0]);
                    setError("");
                    setRetryable(false);
                  }}
                />
                {proofFile
                  ? t("photo_proof_chosen", { name: proofFile.name })
                  : t("photo_proof_choose")}
              </label>
            </div>
          )}

          {error && (
            <div
              data-testid="job-card-error"
              // F19 a11y: announce errors politely so screen-reader users
              // hear "photo proof required" without a focus jump.
              role="status"
              aria-live="polite"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
            >
              <p>{error}</p>
              {retryable && (
                <Button
                  onClick={handleAction}
                  disabled={isCompleting}
                  data-testid="job-card-retry"
                  className="mt-2 w-full rounded-md bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {t("photo_proof_retry")}
                </Button>
              )}
            </div>
          )}

          <Button
            onClick={handleAction}
            disabled={isCompleting || (requiresPhotoProof && !proofFile)}
            data-testid="job-card-complete"
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
