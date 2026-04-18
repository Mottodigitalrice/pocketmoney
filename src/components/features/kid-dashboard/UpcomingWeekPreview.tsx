"use client";

import { useMemo } from "react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import type { TranslationKey } from "@/lib/i18n/translations";

interface UpcomingWeekPreviewProps {
  childId: string;
}

export function UpcomingWeekPreview({ childId }: UpcomingWeekPreviewProps) {
  const { t, locale } = useTranslation();
  const { getScheduledJobsForWeek, getLocalDateString } = usePocketMoney();

  const today = getLocalDateString();
  const upcomingJobs = useMemo(
    () =>
      getScheduledJobsForWeek(childId)
        .filter((entry) => entry.date > today)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [childId, getScheduledJobsForWeek, today]
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof upcomingJobs>();

    for (const job of upcomingJobs) {
      const current = groups.get(job.date) ?? [];
      current.push(job);
      groups.set(job.date, current);
    }

    return Array.from(groups.entries());
  }, [upcomingJobs]);

  return (
    <div className="mx-4 rounded-2xl border border-cyan-300/20 bg-cyan-950/20 p-4 backdrop-blur-sm sm:mx-8">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">🗓️</span>
        <h2 className="text-lg font-bold text-white">{t("kid_upcoming_title")}</h2>
      </div>

      {grouped.length === 0 ? (
        <p className="text-sm text-white/60">{t("kid_upcoming_empty")}</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, jobs]) => (
            <div
              key={date}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <p className="text-sm font-semibold text-cyan-200">
                {new Date(`${date}T00:00:00`).toLocaleDateString(
                  locale === "ja" ? "ja-JP" : "en-US",
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {jobs.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center gap-2 rounded-full bg-cyan-900/40 px-3 py-2 text-sm text-white/90"
                  >
                    <span>{entry.job.icon}</span>
                    <span>
                      {entry.job.titleKey
                        ? t(entry.job.titleKey as TranslationKey)
                        : locale === "ja" && entry.job.titleJa
                          ? entry.job.titleJa
                          : entry.job.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
