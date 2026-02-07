"use client";

import { useState, useMemo } from "react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CURRENCY, CHILD_ICON_CONFIG, DAYS_OF_WEEK, DAYS_OF_WEEK_JA } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { JobPickerSheet } from "./JobPickerSheet";
import type { ChildIcon } from "@/types";
import type { TranslationKey } from "@/lib/i18n/translations";

export function WeekPlanner() {
  const { t, locale } = useTranslation();
  const {
    familyChildren,
    getScheduledJobsForChildDate,
    getWeekDates,
    removeScheduledJob,
  } = usePocketMoney();

  const [weekOffset, setWeekOffset] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerChildId, setPickerChildId] = useState<string | null>(null);
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [pickerDayLabel, setPickerDayLabel] = useState("");

  // Calculate the week dates based on offset
  const weekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(base);
  }, [weekOffset, getWeekDates]);

  const dayLabels = locale === "ja" ? DAYS_OF_WEEK_JA : DAYS_OF_WEEK;

  const handleCellTap = (childId: string, date: string, dayLabel: string, childName: string) => {
    setPickerChildId(childId);
    setPickerDate(date);
    setPickerDayLabel(
      t("planner_select_jobs" as TranslationKey, { name: childName, day: dayLabel })
    );
    setPickerOpen(true);
  };

  const getWeekLabel = () => {
    if (weekOffset === 0) return t("planner_this_week");
    if (weekOffset === 1) return t("planner_next_week");
    if (weekOffset === -1) return t("planner_prev_week");
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[6]);
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  };

  if (familyChildren.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-900/20 py-12 text-center">
        <span className="mb-3 text-5xl">👶</span>
        <p className="text-lg font-semibold text-amber-200">
          {t("planner_no_children")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <h2 className="text-lg font-bold text-amber-100">
            {t("planner_title")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="text-amber-300 hover:bg-amber-800/40"
          >
            ←
          </Button>
          <span className="min-w-[100px] text-center text-sm font-semibold text-amber-200">
            {getWeekLabel()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="text-amber-300 hover:bg-amber-800/40"
          >
            →
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-[120px_repeat(7,1fr)] gap-1">
            <div />
            {dayLabels.map((day, i) => {
              const dateStr = weekDates[i];
              const isToday = dateStr === getWeekDates()[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
              return (
                <div
                  key={day}
                  className={`rounded-lg px-1 py-2 text-center text-xs font-bold ${
                    isToday
                      ? "bg-amber-600 text-white"
                      : "text-amber-300/70"
                  }`}
                >
                  <div>{day}</div>
                  <div className="text-[10px] opacity-70">
                    {new Date(dateStr + "T00:00:00").getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Child rows */}
          {familyChildren.map((child) => {
            const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
            return (
              <div
                key={child._id}
                className="mb-2 grid grid-cols-[120px_repeat(7,1fr)] gap-1"
              >
                {/* Child name */}
                <div className="flex items-center gap-2 rounded-lg bg-amber-900/40 px-2 py-2">
                  <span className="text-lg">{iconConfig?.emoji ?? "👤"}</span>
                  <span className="truncate text-sm font-semibold text-amber-100">
                    {child.name}
                  </span>
                </div>

                {/* Day cells */}
                {weekDates.map((date, dayIndex) => {
                  const scheduled = getScheduledJobsForChildDate(child._id, date);
                  return (
                    <button
                      key={date}
                      onClick={() =>
                        handleCellTap(
                          child._id,
                          date,
                          dayLabels[dayIndex],
                          child.name
                        )
                      }
                      className="group flex min-h-[60px] flex-col gap-0.5 rounded-lg border border-amber-700/20 bg-amber-900/20 p-1 text-left transition-all hover:border-amber-500/40 hover:bg-amber-800/30"
                    >
                      {scheduled.length === 0 ? (
                        <span className="flex h-full items-center justify-center text-[10px] text-amber-500/40 opacity-0 group-hover:opacity-100">
                          +
                        </span>
                      ) : (
                        scheduled.map((sj) => (
                          <div
                            key={sj._id}
                            className="flex items-center gap-0.5 rounded bg-amber-800/40 px-1 py-0.5"
                          >
                            <span className="text-[10px]">{sj.job.icon}</span>
                            <span className="flex-1 truncate text-[10px] text-amber-200">
                              {sj.job.titleKey
                                ? t(sj.job.titleKey as TranslationKey)
                                : locale === "ja" && sj.job.titleJa
                                  ? sj.job.titleJa
                                  : sj.job.title}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeScheduledJob(sj._id);
                              }}
                              className="text-[8px] text-red-400/60 opacity-0 hover:text-red-300 group-hover:opacity-100"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Job picker sheet */}
      {pickerOpen && pickerChildId && pickerDate && (
        <JobPickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          childId={pickerChildId}
          date={pickerDate}
          title={pickerDayLabel}
        />
      )}
    </div>
  );
}
