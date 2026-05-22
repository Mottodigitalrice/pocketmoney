"use client";

import { useMemo, useState } from "react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { BudouXText } from "@/components/shared/BudouXText";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCY, DAYS_OF_WEEK, DAYS_OF_WEEK_JA } from "@/lib/constants";
import type { TranslationKey } from "@/lib/i18n/translations";

/**
 * G2: TreasureHistoryCalendarSkeleton — 7-column day grid of square skeletons.
 * (Spec called for 7×4 grid; collapsed to 7 days × 1 row because the real
 *  layout is one row of 7 day-cards, not a month grid.)
 */
function TreasureHistoryCalendarSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="treasure-history-skeleton"
      className="mx-4 rounded-2xl border border-amber-300/20 bg-amber-950/20 p-4 backdrop-blur-sm sm:mx-8"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded bg-amber-900/40" />
          <Skeleton className="h-5 w-32 rounded bg-amber-900/40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded bg-amber-900/30" />
          <Skeleton className="h-4 w-24 rounded bg-amber-900/30" />
          <Skeleton className="size-9 rounded bg-amber-900/30" />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton
            key={i}
            className="h-28 w-full rounded-xl bg-amber-900/30"
          />
        ))}
      </div>
    </div>
  );
}

interface TreasureHistoryCalendarProps {
  childId: string;
}

export function TreasureHistoryCalendar({
  childId,
}: TreasureHistoryCalendarProps) {
  const { t, locale } = useTranslation();
  const {
    isLoading,
    getWeekDates,
    getInstancesForChild,
    getJobById,
    getLocalDateString,
  } = usePocketMoney();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(base);
  }, [getWeekDates, weekOffset]);

  // G2: skeleton while hydrating. Placed after hooks to keep hook order stable.
  if (isLoading) return <TreasureHistoryCalendarSkeleton />;

  const approvedInstances = getInstancesForChild(childId).filter(
    (instance) => instance.status === "approved" && instance.approvedAt,
  );

  const days = weekDates.map((date, index) => {
    const instances = approvedInstances.filter((instance) => {
      if (!instance.approvedAt) return false;
      return getLocalDateString(new Date(instance.approvedAt)) === date;
    });

    const jobs = instances
      .map((instance) => ({
        instance,
        job: getJobById(instance.jobId),
      }))
      .filter((entry) => entry.job);

    const earned = jobs.reduce(
      (sum, entry) => sum + (entry.job?.yenAmount ?? 0),
      0,
    );

    return {
      date,
      dayLabel: (locale === "ja" ? DAYS_OF_WEEK_JA : DAYS_OF_WEEK)[index],
      jobs,
      earned,
    };
  });

  const hasAnyHistory = days.some((day) => day.jobs.length > 0);

  const weekLabel =
    weekOffset === 0
      ? t("kid_history_this_week")
      : weekOffset === -1
        ? t("kid_history_prev_week")
        : weekOffset === 1
          ? t("kid_history_next_week")
          : `${new Date(`${weekDates[0]}T00:00:00`).getMonth() + 1}/${new Date(`${weekDates[0]}T00:00:00`).getDate()} - ${new Date(`${weekDates[6]}T00:00:00`).getMonth() + 1}/${new Date(`${weekDates[6]}T00:00:00`).getDate()}`;

  return (
    <div className="mx-4 rounded-2xl border border-amber-300/20 bg-amber-950/20 p-4 backdrop-blur-sm sm:mx-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <h2 className="text-lg font-bold text-white">
            {t("kid_history_title")}
          </h2>
        </div>
        {/* F20: chevron buttons promoted to size="icon" (h-9 w-9) + min 11.
            aria-label added so screen readers announce "previous week"
            instead of "left arrow button". */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekOffset((value) => value - 1)}
            aria-label={t("kid_history_prev_week")}
            className="min-h-11 min-w-11 text-amber-200 hover:bg-amber-900/30"
          >
            ←
          </Button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-amber-100">
            {weekLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekOffset((value) => Math.min(value + 1, 0))}
            disabled={weekOffset === 0}
            aria-label={t("kid_history_next_week")}
            className="min-h-11 min-w-11 text-amber-200 hover:bg-amber-900/30 disabled:opacity-40"
          >
            →
          </Button>
        </div>
      </div>

      {/* Wave 7 — F10 6.7: always render the calendar grid (the "shell"),
          even with zero history. When `hasAnyHistory` is false we overlay a
          centered empty-state card on top so the screen feels like an
          adventure-not-yet-started prompt rather than a void. The grid
          underneath stays visible-but-muted so kids understand the shape of
          what's coming. */}
      <div className="relative">
        <div
          aria-hidden={!hasAnyHistory}
          className={
            hasAnyHistory
              ? "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
              : "grid gap-3 opacity-30 md:grid-cols-2 xl:grid-cols-4"
          }
          data-testid="treasure-history-grid"
        >
          {days.map((day) => (
            <div
              key={day.date}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-200">
                    {day.dayLabel}
                  </p>
                  <p className="text-xs text-white/55">
                    {new Date(`${day.date}T00:00:00`).toLocaleDateString(
                      locale === "ja" ? "ja-JP" : "en-US",
                      { month: "short", day: "numeric" },
                    )}
                  </p>
                </div>
                <div className="rounded-full bg-amber-400/15 px-2 py-1 text-xs font-bold text-amber-200">
                  {CURRENCY}
                  {day.earned.toLocaleString()}
                </div>
              </div>

              {day.jobs.length === 0 ? (
                <p className="mt-3 text-sm text-white/45">-</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {day.jobs.map(({ instance, job }) => (
                    <div
                      key={instance._id}
                      className="rounded-lg bg-amber-900/30 px-3 py-2 text-sm text-white/90"
                    >
                      <span className="mr-2">{job?.icon}</span>
                      <span>
                        {job?.titleKey
                          ? t(job.titleKey as TranslationKey)
                          : locale === "ja" && job?.titleJa
                            ? job.titleJa
                            : job?.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-3 text-xs text-white/55">
                {t("kid_history_jobs", { count: day.jobs.length })}
              </p>
            </div>
          ))}
        </div>

        {!hasAnyHistory && (
          <div
            data-testid="treasure-history-empty-overlay"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-2 rounded-2xl border border-dashed border-amber-300/30 bg-amber-950/85 px-6 py-8 text-center shadow-2xl backdrop-blur-sm">
              <span className="text-5xl" aria-hidden="true">
                🗺️
              </span>
              <p className="text-lg font-bold text-amber-100">
                <BudouXText>{t("treasure_history_empty_title")}</BudouXText>
              </p>
              <p className="text-sm text-white/80">
                <BudouXText>{t("treasure_history_empty_body")}</BudouXText>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
