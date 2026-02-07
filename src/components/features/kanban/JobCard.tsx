"use client";

import { useState } from "react";
import { Job, JobStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { CURRENCY } from "@/lib/constants";
import { useTranslation } from "@/hooks/use-translation";
import type { TranslationKey } from "@/lib/i18n/translations";

interface JobCardProps {
  job: Job;
  status: JobStatus | "available";
  instanceId?: string;
  onStart?: () => void;
  onComplete?: () => void;
}

export function JobCard({ job, status, onStart, onComplete }: JobCardProps) {
  const [bouncing, setBouncing] = useState(false);
  const { t, locale } = useTranslation();

  const handleAction = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 500);

    if (status === "available" && onStart) {
      onStart();
    } else if (status === "in_progress" && onComplete) {
      onComplete();
    }
  };

  return (
    <div
      className={`animate-bob group relative overflow-hidden rounded-2xl border-2 bg-white/90 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
        bouncing ? "animate-scale-bounce" : ""
      } ${
        status === "available"
          ? "border-blue-300"
          : status === "in_progress"
          ? "border-amber-400"
          : "border-green-400"
      }`}
      style={{ animationDuration: `${3 + Math.random() * 2}s` }}
    >
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
        {CURRENCY}
        {job.yenAmount}
      </div>

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
        <Button
          onClick={handleAction}
          className="w-full rounded-xl bg-green-500 py-6 text-lg font-bold text-white hover:bg-green-600 active:scale-95"
          size="lg"
        >
          {t("job_complete")}
        </Button>
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
