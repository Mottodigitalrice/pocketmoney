"use client";

import { useMemo, useState, type DragEvent } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Trash2,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CHILD_ICON_CONFIG, DAYS_OF_WEEK, DAYS_OF_WEEK_JA } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { BudouXText } from "@/components/shared/BudouXText";
import type { ChildIcon, JobPriority } from "@/types";
import type { TranslationKey } from "@/lib/i18n/translations";

type DragPayload =
  | {
      type: "library-job";
      jobId: string;
    }
  | {
      type: "scheduled-job";
      scheduledJobId: string;
      jobId: string;
      childId: string;
      date: string;
      priority?: JobPriority;
    };

export function WeekPlanner() {
  const { t, locale } = useTranslation();
  const {
    familyChildren,
    jobs,
    getScheduledJobsForChildDate,
    getWeekDates,
    getLocalDateString,
    scheduleJobBatch,
    removeScheduledJob,
    clearScheduledDay,
    applyRecurringJobsForWeek,
  } = usePocketMoney();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedPriority, setSelectedPriority] =
    useState<JobPriority>("optional");
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const libraryJobs = useMemo(
    () => jobs.filter((job) => !job.isOneOff),
    [jobs]
  );

  const recurringJobs = useMemo(
    () =>
      libraryJobs.filter(
        (job) => job.recurrence && job.recurrence.type !== "none"
      ),
    [libraryJobs]
  );

  const weekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(base);
  }, [weekOffset, getWeekDates]);

  const previousWeekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + (weekOffset - 1) * 7);
    return getWeekDates(base);
  }, [weekOffset, getWeekDates]);

  const todayStr = getLocalDateString();
  const dayLabels = locale === "ja" ? DAYS_OF_WEEK_JA : DAYS_OF_WEEK;
  const activeChildIds =
    selectedChildIds.length > 0
      ? selectedChildIds
      : familyChildren.map((child) => child._id);

  const getWeekLabel = () => {
    if (weekOffset === 0) return t("planner_this_week");
    if (weekOffset === 1) return t("planner_next_week");
    if (weekOffset === -1) return t("planner_prev_week");
    const start = new Date(`${weekDates[0]}T00:00:00`);
    const end = new Date(`${weekDates[6]}T00:00:00`);
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  };

  const getJobTitle = (job: (typeof libraryJobs)[number]) =>
    job.titleKey
      ? t(job.titleKey as TranslationKey)
      : locale === "ja" && job.titleJa
        ? job.titleJa
        : job.title;

  const getRecurrenceLabel = (job: (typeof libraryJobs)[number]) => {
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

  const toggleChild = (childId: string) => {
    setSelectedChildIds((current) =>
      current.includes(childId)
        ? current.filter((id) => id !== childId)
        : [...current, childId]
    );
  };

  const isScheduled = (childId: string, date: string, jobId: string) =>
    getScheduledJobsForChildDate(childId, date).some((entry) => entry.jobId === jobId);

  const addSelectedJobToDate = (date: string) => {
    if (!selectedJobId || activeChildIds.length === 0) return;

    const entries = activeChildIds
      .filter((childId) => !isScheduled(childId, date, selectedJobId))
      .map((childId) => ({
        jobId: selectedJobId,
        childId,
        date,
        priority: selectedPriority,
      }));

    if (entries.length > 0) {
      scheduleJobBatch(entries);
    }
  };

  const scheduleJobIfMissing = (
    jobId: string,
    childId: string,
    date: string,
    priority: JobPriority = selectedPriority
  ) => {
    if (!isScheduled(childId, date, jobId)) {
      scheduleJobBatch([{ jobId, childId, date, priority }]);
    }
  };

  const handleDrop = (childId: string, date: string, rawPayload: string) => {
    setDragOverCell(null);
    if (!rawPayload) return;

    let payload: DragPayload;
    try {
      payload = JSON.parse(rawPayload) as DragPayload;
    } catch {
      return;
    }

    if (payload.type === "library-job") {
      scheduleJobIfMissing(payload.jobId, childId, date, selectedPriority);
      return;
    }

    const isSameCell = payload.childId === childId && payload.date === date;
    if (isSameCell) return;

    removeScheduledJob(payload.scheduledJobId);
    scheduleJobIfMissing(payload.jobId, childId, date, payload.priority ?? "optional");
  };

  const setDragData = (
    event: DragEvent<HTMLElement>,
    payload: DragPayload
  ) => {
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  };

  const copyLastWeek = () => {
    const entries = activeChildIds.flatMap((childId) =>
      previousWeekDates.flatMap((previousDate, index) =>
        getScheduledJobsForChildDate(childId, previousDate)
          .filter((entry) => !isScheduled(childId, weekDates[index], entry.jobId))
          .map((entry) => ({
            jobId: entry.jobId,
            childId,
            date: weekDates[index],
            priority: entry.priority ?? "optional",
          }))
      )
    );

    if (entries.length > 0) {
      scheduleJobBatch(entries);
    }
  };

  const applyMondayTemplate = () => {
    const monday = weekDates[0];
    const targetDates = weekDates.slice(1);
    const entries = activeChildIds.flatMap((childId) => {
      const mondayJobs = getScheduledJobsForChildDate(childId, monday);
      return targetDates.flatMap((date) =>
        mondayJobs
          .filter((entry) => !isScheduled(childId, date, entry.jobId))
          .map((entry) => ({
            jobId: entry.jobId,
            childId,
            date,
            priority: entry.priority ?? "optional",
          }))
      );
    });

    if (entries.length > 0) {
      scheduleJobBatch(entries);
    }
  };

  const applyRecurringTemplate = async () => {
    if (recurringJobs.length === 0 || activeChildIds.length === 0) return;
    await applyRecurringJobsForWeek(
      weekDates,
      recurringJobs.map((job) => ({
        jobId: job._id,
        childIds: activeChildIds,
      }))
    );
  };

  if (familyChildren.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-900/20 px-6 py-12 text-center">
        <Users className="mb-3 h-10 w-10 text-amber-300" />
        <p className="text-lg font-semibold text-amber-200">
          {t("planner_empty_title")}
        </p>
        <p className="mt-1 text-sm text-amber-300/70">
          <BudouXText>{t("planner_empty_hint")}</BudouXText>
        </p>
      </div>
    );
  }

  const weekHasAnyScheduled = familyChildren.some((child) =>
    weekDates.some(
      (date) => getScheduledJobsForChildDate(child._id, date).length > 0
    )
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-700/20 bg-amber-900/20 p-4 backdrop-blur-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-5 w-5 shrink-0 text-amber-300" />
            <h2 className="truncate text-lg font-bold text-amber-100">
              {t("planner_title")}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* F20: chevrons bumped from 36×36 to 44×44. */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset((value) => value - 1)}
              className="h-11 w-11 text-amber-300 hover:bg-amber-800/40"
              aria-label={t("planner_prev_week")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-semibold text-amber-200">
              {getWeekLabel()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset((value) => value + 1)}
              className="h-11 w-11 text-amber-300 hover:bg-amber-800/40"
              aria-label={t("planner_next_week")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {weekOffset !== 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(0)}
                className="min-h-11 border-amber-600/50 text-amber-300 hover:bg-amber-800/40"
              >
                {t("planner_today")}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-amber-300/70">
                {t("planner_bulk_job")}
              </p>
              {libraryJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-amber-700/30 bg-amber-900/20 px-4 py-8 text-center">
                  <span className="text-3xl">📜</span>
                  <p className="text-sm font-semibold text-amber-200">
                    {t("planner_no_jobs_title")}
                  </p>
                  <p className="text-xs text-amber-300/70">
                    <BudouXText>{t("planner_no_jobs_hint")}</BudouXText>
                  </p>
                </div>
              ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {libraryJobs.map((job) => {
                  const isSelected = selectedJobId === job._id;
                  return (
                    <button
                      key={job._id}
                      type="button"
                      draggable
                      onDragStart={(event) =>
                        setDragData(event, { type: "library-job", jobId: job._id })
                      }
                      onClick={() => setSelectedJobId(job._id)}
                      // F20: min-h-11 floor — library-job picker is the
                      // entry point for "schedule this job" on mobile.
                      className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                        isSelected
                          ? "border-amber-400 bg-amber-600/30 text-amber-50 ring-1 ring-amber-400"
                          : "border-amber-700/20 bg-amber-900/30 text-amber-200 hover:bg-amber-800/40"
                      }`}
                    >
                      <span className="shrink-0 text-xl">{job.icon}</span>
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {getJobTitle(job)}
                        {getRecurrenceLabel(job) && (
                          <span className="mt-1 block truncate text-[10px] font-bold uppercase text-amber-200/70">
                            {getRecurrenceLabel(job)}
                          </span>
                        )}
                      </span>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-amber-300/70">
                {t("planner_bulk_children")}
              </p>
              <div className="flex flex-wrap gap-2">
                {familyChildren.map((child) => {
                  const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
                  const isSelected = activeChildIds.includes(child._id);
                  return (
                    <button
                      key={child._id}
                      type="button"
                      onClick={() => toggleChild(child._id)}
                      // F20: child-toggle pill min-h-11 (was ~36).
                      className={`flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all ${
                        isSelected
                          ? "border-amber-400 bg-amber-600 text-white"
                          : "border-amber-700/20 bg-amber-900/30 text-amber-300/70 hover:bg-amber-800/40"
                      }`}
                    >
                      <span>{iconConfig?.emoji ?? "👤"}</span>
                      <span>{child.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-amber-300/60">
                {selectedChildIds.length === 0
                  ? t("planner_all_children_selected")
                  : t("planner_selected_children", {
                      count: String(selectedChildIds.length),
                    })}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-amber-300/70">
                {t("planner_priority")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["optional", "mustDo"] as JobPriority[]).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setSelectedPriority(priority)}
                    // F20: priority toggle min-h-11.
                    className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition-all ${
                      selectedPriority === priority
                        ? "border-amber-400 bg-amber-600 text-white"
                        : "border-amber-700/20 bg-amber-900/30 text-amber-300/70 hover:bg-amber-800/40"
                    }`}
                  >
                    {priority === "mustDo"
                      ? t("planner_priority_must")
                      : t("planner_priority_optional")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid min-w-0 content-start gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {/* F20: bulk-action buttons now min-h-11 (default Button is h-9). */}
            <Button
              onClick={copyLastWeek}
              variant="outline"
              className="min-h-11 justify-start gap-2 border-amber-600/50 text-amber-300 hover:bg-amber-800/40"
            >
              <Copy className="h-4 w-4" />
              {t("planner_copy_last_week")}
            </Button>
            <Button
              onClick={applyMondayTemplate}
              variant="outline"
              className="min-h-11 justify-start gap-2 border-amber-600/50 text-amber-300 hover:bg-amber-800/40"
            >
              <Wand2 className="h-4 w-4" />
              {t("planner_apply_monday")}
            </Button>
            <Button
              onClick={applyRecurringTemplate}
              disabled={recurringJobs.length === 0}
              variant="outline"
              className="min-h-11 justify-start gap-2 border-amber-600/50 text-amber-300 hover:bg-amber-800/40 disabled:opacity-50"
            >
              <CalendarDays className="h-4 w-4" />
              {t("planner_apply_recurring")}
            </Button>
          </div>
        </div>
      </div>

      {weekHasAnyScheduled === false && libraryJobs.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-amber-700/30 bg-amber-900/20 px-4 py-3 text-left text-sm text-amber-200">
          <span className="text-xl">🗓️</span>
          <p className="flex-1">
            <BudouXText>{t("planner_week_empty_banner")}</BudouXText>
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-amber-700/20 bg-amber-950/40 backdrop-blur-sm">
        <div className="grid grid-cols-[88px_repeat(7,minmax(118px,1fr))] overflow-x-auto">
          <div className="sticky left-0 z-20 border-b border-r border-amber-700/20 bg-amber-950/95 p-3 text-xs font-bold uppercase text-amber-300/70">
            {t("planner_crew")}
          </div>
          {weekDates.map((date, index) => {
            const isToday = date === todayStr;
            return (
              <div
                key={date}
                className={`border-b border-r border-amber-700/20 p-3 ${
                  isToday ? "bg-amber-700/25" : "bg-amber-900/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-amber-100">
                      {dayLabels[index]}
                    </p>
                    <p className="text-xs text-amber-300/70">
                      {new Date(`${date}T00:00:00`).toLocaleDateString(
                        locale === "ja" ? "ja-JP" : "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </p>
                  </div>
                  {isToday && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {t("planner_today")}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => addSelectedJobToDate(date)}
                  disabled={!selectedJobId}
                  data-testid="planner-add-selected"
                  data-date={date}
                  // F20: bumped from h-8 (32px) to min-h-11 (44px) — this is
                  // the primary "add job to day" tap target. Real thumbs need
                  // the height even when scrolling sideways in the grid.
                  className="mt-2 min-h-11 w-full gap-1 bg-amber-600 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("planner_add_selected")}
                </Button>
              </div>
            );
          })}

          {familyChildren.map((child) => {
            const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
            return (
              <div key={child._id} className="contents">
                <div className="sticky left-0 z-10 flex min-h-[116px] items-start gap-2 border-b border-r border-amber-700/20 bg-amber-950/95 p-3">
                  <span className="shrink-0 text-xl">{iconConfig?.emoji ?? "👤"}</span>
                  <span className="min-w-0 break-words text-sm font-bold text-amber-100">
                    {child.name}
                  </span>
                </div>
                {weekDates.map((date) => {
                  const scheduled = getScheduledJobsForChildDate(child._id, date);
                  return (
                    <div
                      key={`${child._id}-${date}`}
                      data-testid="planner-cell"
                      data-child-id={child._id}
                      data-date={date}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDragOverCell(`${child._id}-${date}`);
                      }}
                      onDragLeave={() => setDragOverCell(null)}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleDrop(
                          child._id,
                          date,
                          event.dataTransfer.getData("application/json")
                        );
                      }}
                      className={`min-h-[116px] border-b border-r border-amber-700/20 p-2 transition-colors ${
                        dragOverCell === `${child._id}-${date}`
                          ? "bg-amber-700/20"
                          : ""
                      }`}
                    >
                      {scheduled.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-amber-700/25 px-2 py-3 text-center text-xs text-amber-300/45">
                          {t("planner_empty_day")}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {scheduled.map((entry) => (
                            <div
                              key={entry._id}
                              draggable
                              onDragStart={(event) =>
                                setDragData(event, {
                                  type: "scheduled-job",
                                  scheduledJobId: entry._id,
                                  jobId: entry.jobId,
                                  childId: entry.childId,
                                  date: entry.date,
                                  priority: entry.priority ?? "optional",
                                })
                              }
                              className="group flex min-w-0 items-start gap-2 rounded-lg bg-amber-800/35 px-2 py-2 text-xs text-amber-100"
                            >
                              <span className="shrink-0 text-base">{entry.job.icon}</span>
                              <span className="min-w-0 flex-1 break-words font-semibold">
                                {entry.job.titleKey
                                  ? t(entry.job.titleKey as TranslationKey)
                                  : locale === "ja" && entry.job.titleJa
                                    ? entry.job.titleJa
                                    : entry.job.title}
                                {entry.priority === "mustDo" && (
                                  <span className="mt-1 block w-fit rounded-full bg-red-500/25 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-red-100">
                                    {t("priority_must_do")}
                                  </span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeScheduledJob(entry._id)}
                                // F20: bumped from p-0.5 around a 14px icon
                                // (~20×20) to min-h-11/min-w-11 so the remove
                                // X is a real tap target inside the cell.
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-red-300/75 transition hover:bg-red-500/15 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                                aria-label={t("planner_remove_job")}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => clearScheduledDay(child._id, date)}
                            // F20: min-h-11 floor + larger hit area for the
                            // per-cell clear button. Was a 16-18px text link.
                            className="inline-flex min-h-11 items-center gap-1 rounded px-2 text-xs font-semibold text-red-300/80 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t("planner_clear_day")}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
