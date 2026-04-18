"use client";

import { useMemo, useState } from "react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CHILD_ICON_CONFIG, DAYS_OF_WEEK, DAYS_OF_WEEK_JA } from "@/lib/constants";
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
    getLocalDateString,
    removeScheduledJob,
    clearScheduledDay,
  } = usePocketMoney();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [pickerDayLabel, setPickerDayLabel] = useState("");

  const activeChild = familyChildren.find((child) => child._id === selectedChildId) ?? familyChildren[0];

  const weekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(base);
  }, [weekOffset, getWeekDates]);

  const todayStr = getLocalDateString();
  const dayLabels = locale === "ja" ? DAYS_OF_WEEK_JA : DAYS_OF_WEEK;

  const getWeekLabel = () => {
    if (weekOffset === 0) return t("planner_this_week");
    if (weekOffset === 1) return t("planner_next_week");
    if (weekOffset === -1) return t("planner_prev_week");
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[6]);
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  };

  const openPicker = (date: string, dayLabel: string) => {
    if (!activeChild) return;

    setPickerDate(date);
    setPickerDayLabel(
      t("planner_select_jobs" as TranslationKey, {
        name: activeChild.name,
        day: dayLabel,
      })
    );
    setPickerOpen(true);
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
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-700/20 bg-amber-900/20 p-4 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h2 className="text-lg font-bold text-amber-100">
              {t("planner_title")}
            </h2>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset((value) => value - 1)}
              className="text-amber-300 hover:bg-amber-800/40"
            >
              ←
            </Button>
            <span className="min-w-[120px] text-center text-sm font-semibold text-amber-200">
              {getWeekLabel()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset((value) => value + 1)}
              className="text-amber-300 hover:bg-amber-800/40"
            >
              →
            </Button>
          </div>
        </div>

        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {familyChildren.map((child) => {
            const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
            const isActive = child._id === activeChild?._id;

            return (
              <button
                key={child._id}
                type="button"
                onClick={() => setSelectedChildId(child._id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-amber-600 text-white shadow-lg"
                    : "bg-amber-900/40 text-amber-300/70 hover:bg-amber-800/40 hover:text-amber-200"
                }`}
              >
                <span>{iconConfig?.emoji ?? "👤"}</span>
                <span>{child.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeChild && (
        <div className="space-y-3">
          {weekDates.map((date, index) => {
            const scheduled = getScheduledJobsForChildDate(activeChild._id, date);
            const isToday = date === todayStr;
            const dayLabel = dayLabels[index];

            return (
              <div
                key={date}
                className={`rounded-2xl border p-4 backdrop-blur-sm ${
                  isToday
                    ? "border-amber-500/50 bg-amber-800/30"
                    : "border-amber-700/20 bg-amber-900/20"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-amber-100">{dayLabel}</p>
                      {isToday && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                          {t("planner_today")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-amber-300/70">
                      {new Date(`${date}T00:00:00`).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {scheduled.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearScheduledDay(activeChild._id, date)}
                        className="border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                      >
                        {t("planner_clear_day")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => openPicker(date, dayLabel)}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      {t("planner_add_jobs")}
                    </Button>
                  </div>
                </div>

                {scheduled.length === 0 ? (
                  <p className="mt-4 text-sm text-amber-300/50">
                    {t("planner_empty_day")}
                  </p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {scheduled.map((entry) => (
                      <div
                        key={entry._id}
                        className="flex items-center gap-2 rounded-full bg-amber-800/40 px-3 py-2 text-sm text-amber-100"
                      >
                        <span>{entry.job.icon}</span>
                        <span>
                          {entry.job.titleKey
                            ? t(entry.job.titleKey as TranslationKey)
                            : locale === "ja" && entry.job.titleJa
                              ? entry.job.titleJa
                              : entry.job.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeScheduledJob(entry._id)}
                          className="text-red-300/80 hover:text-red-200"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pickerOpen && activeChild && pickerDate && (
        <JobPickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          childId={activeChild._id}
          date={pickerDate}
          title={pickerDayLabel}
        />
      )}
    </div>
  );
}
