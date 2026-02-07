"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CHILD_ICON_CONFIG } from "@/lib/constants";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useTranslation } from "@/hooks/use-translation";
import type { ChildIcon } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LocalChild {
  id: string;
  name: string;
  icon: ChildIcon | null;
}

interface LocalJob {
  id: string;
  title: string;
  icon: string;
  yenAmount: number;
}

const ICON_OPTIONS = Object.keys(CHILD_ICON_CONFIG) as ChildIcon[];
const MAX_CHILDREN = 6;
const MAX_JOBS = 10;

const JOB_ICONS = [
  "👕", "🧸", "🛏️", "🍽️", "🌱", "👟", "🐾", "📚", "🧹", "🧺",
  "🏠", "🛋️", "🪥", "🎒", "🛒", "🪟", "♻️", "👨‍🍳", "🧽", "🪣",
];

// ---------------------------------------------------------------------------
// Progress Dots
// ---------------------------------------------------------------------------

function ProgressDots({ current, total }: { current: number; total: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              i < current
                ? "scale-110 bg-amber-400 shadow-lg shadow-amber-400/50"
                : i === current
                  ? "scale-125 bg-amber-500 shadow-lg shadow-amber-500/50 ring-2 ring-amber-300/50"
                  : "bg-white/30"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-white/60">
        {t("onboarding_step", { current: current + 1, total })}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 - Welcome
// ---------------------------------------------------------------------------

function StepWelcome({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="animate-float-up flex flex-col items-center gap-8 text-center">
      <div className="text-8xl">
        <span role="img" aria-label="pirate ship">
          🏴‍☠️
        </span>
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl">
          {t("onboarding_welcome")}
        </h1>
        <p className="mx-auto max-w-md text-lg text-white/80 drop-shadow">
          {t("onboarding_welcome_subtitle")}
        </p>
      </div>

      <button
        onClick={onNext}
        className="animate-pulse-gold rounded-2xl bg-amber-500 px-10 py-4 text-xl font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-amber-600 active:scale-95"
      >
        {t("onboarding_get_started")}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icon Picker (for children)
// ---------------------------------------------------------------------------

function IconPicker({
  selected,
  onSelect,
  takenIcons,
}: {
  selected: ChildIcon | null;
  onSelect: (icon: ChildIcon) => void;
  takenIcons: Set<string>;
}) {
  const { locale } = useTranslation();

  return (
    <div className="grid grid-cols-4 gap-3">
      {ICON_OPTIONS.map((icon) => {
        const config = CHILD_ICON_CONFIG[icon];
        const isSelected = selected === icon;
        const isTaken = takenIcons.has(icon) && !isSelected;

        return (
          <button
            key={icon}
            type="button"
            disabled={isTaken}
            onClick={() => onSelect(icon)}
            className={`flex flex-col items-center gap-1 rounded-xl p-3 transition-all duration-200 ${
              isSelected
                ? "scale-110 bg-amber-500/30 ring-3 ring-amber-400 shadow-lg shadow-amber-400/30"
                : isTaken
                  ? "cursor-not-allowed bg-white/5 opacity-30"
                  : "bg-white/10 hover:scale-105 hover:bg-white/20"
            }`}
          >
            <span className="text-3xl">{config.emoji}</span>
            <span className="text-xs font-medium text-white/70">
              {locale === "ja" ? config.labelJa : config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Child Form Card
// ---------------------------------------------------------------------------

function ChildFormCard({
  child,
  index,
  canRemove,
  takenIcons,
  onUpdate,
  onRemove,
}: {
  child: LocalChild;
  index: number;
  canRemove: boolean;
  takenIcons: Set<string>;
  onUpdate: (id: string, updates: Partial<Pick<LocalChild, "name" | "icon">>) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="animate-float-up rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-lg font-bold text-white/90">
          {child.icon ? CHILD_ICON_CONFIG[child.icon].emoji : "🏴‍☠️"}{" "}
          {child.name || `Crew Member ${index + 1}`}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(child.id)}
            className="rounded-lg px-3 py-1 text-sm text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200"
          >
            {t("onboarding_remove_child")}
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={child.name}
          onChange={(e) => onUpdate(child.id, { name: e.target.value })}
          placeholder={t("onboarding_child_name")}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          maxLength={20}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/70">
          {t("onboarding_choose_icon")}
        </label>
        <IconPicker
          selected={child.icon}
          onSelect={(icon) => onUpdate(child.id, { icon })}
          takenIcons={takenIcons}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 - Add Children
// ---------------------------------------------------------------------------

function StepAddChildren({
  children: localChildren,
  setChildren,
  onNext,
  onBack,
}: {
  children: LocalChild[];
  setChildren: React.Dispatch<React.SetStateAction<LocalChild[]>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  const takenIcons = new Set(
    localChildren.map((c) => c.icon).filter(Boolean) as string[]
  );

  const isValid =
    localChildren.length >= 1 &&
    localChildren.every((c) => c.name.trim() !== "" && c.icon !== null);

  const addChild = useCallback(() => {
    if (localChildren.length >= MAX_CHILDREN) return;
    setChildren((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", icon: null },
    ]);
  }, [localChildren.length, setChildren]);

  const removeChild = useCallback(
    (id: string) => {
      setChildren((prev) => prev.filter((c) => c.id !== id));
    },
    [setChildren]
  );

  const updateChild = useCallback(
    (id: string, updates: Partial<Pick<LocalChild, "name" | "icon">>) => {
      setChildren((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    [setChildren]
  );

  return (
    <div className="animate-float-up flex w-full max-w-lg flex-col gap-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white drop-shadow-lg sm:text-4xl">
          {t("onboarding_add_crew")}
        </h2>
        <p className="mt-2 text-white/70">
          {t("onboarding_add_crew_subtitle")}
        </p>
      </div>

      <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto pr-1">
        {localChildren.map((child, index) => (
          <ChildFormCard
            key={child.id}
            child={child}
            index={index}
            canRemove={localChildren.length > 1}
            takenIcons={takenIcons}
            onUpdate={updateChild}
            onRemove={removeChild}
          />
        ))}
      </div>

      {localChildren.length < MAX_CHILDREN && (
        <button
          type="button"
          onClick={addChild}
          className="rounded-xl border-2 border-dashed border-white/30 bg-white/5 py-3 text-white/60 transition-all duration-200 hover:border-white/50 hover:bg-white/10 hover:text-white/80"
        >
          {t("onboarding_add_another")}
        </button>
      )}

      {!isValid && localChildren.length > 0 && (
        <p className="text-center text-sm text-amber-300/80">
          {t("onboarding_at_least_one")}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
        >
          {t("onboarding_back")}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-white shadow-lg transition-all duration-200 hover:bg-amber-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-500"
        >
          {t("onboarding_next")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Job Form Card (for onboarding)
// ---------------------------------------------------------------------------

function JobFormCard({
  job,
  canRemove,
  onUpdate,
  onRemove,
}: {
  job: LocalJob;
  canRemove: boolean;
  onUpdate: (id: string, updates: Partial<Pick<LocalJob, "title" | "icon" | "yenAmount">>) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="animate-float-up rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-lg font-bold text-white/90">
          {job.icon} {job.title || t("onboarding_job_name")}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(job.id)}
            className="rounded-lg px-3 py-1 text-sm text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200"
          >
            {t("onboarding_remove_job")}
          </button>
        )}
      </div>

      {/* Job name */}
      <div className="mb-4">
        <input
          type="text"
          value={job.title}
          onChange={(e) => onUpdate(job.id, { title: e.target.value })}
          placeholder={t("onboarding_job_name_placeholder")}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          maxLength={40}
        />
      </div>

      {/* Yen amount */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-white/70">
          {t("onboarding_job_yen")}
        </label>
        <input
          type="number"
          value={job.yenAmount}
          onChange={(e) => onUpdate(job.id, { yenAmount: Math.max(10, Number(e.target.value)) })}
          min={10}
          step={10}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </div>

      {/* Icon picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/70">
          {t("job_form_icon_label")}
        </label>
        <div className="flex flex-wrap gap-2">
          {JOB_ICONS.map((ic) => (
            <button
              type="button"
              key={ic}
              onClick={() => onUpdate(job.id, { icon: ic })}
              className={`rounded-lg p-2 text-xl transition-all ${
                job.icon === ic
                  ? "scale-110 bg-amber-500/30 ring-2 ring-amber-400"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 - Add Jobs
// ---------------------------------------------------------------------------

function StepAddJobs({
  jobs,
  setJobs,
  onNext,
  onBack,
}: {
  jobs: LocalJob[];
  setJobs: React.Dispatch<React.SetStateAction<LocalJob[]>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  const isValid =
    jobs.length >= 1 &&
    jobs.every((j) => j.title.trim() !== "" && j.yenAmount >= 10);

  const addJob = useCallback(() => {
    if (jobs.length >= MAX_JOBS) return;
    setJobs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: "", icon: "🧹", yenAmount: 100 },
    ]);
  }, [jobs.length, setJobs]);

  const removeJob = useCallback(
    (id: string) => {
      setJobs((prev) => prev.filter((j) => j.id !== id));
    },
    [setJobs]
  );

  const updateJob = useCallback(
    (id: string, updates: Partial<Pick<LocalJob, "title" | "icon" | "yenAmount">>) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
      );
    },
    [setJobs]
  );

  return (
    <div className="animate-float-up flex w-full max-w-lg flex-col gap-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white drop-shadow-lg sm:text-4xl">
          {t("onboarding_add_jobs")}
        </h2>
        <p className="mt-2 text-white/70">
          {t("onboarding_add_jobs_subtitle")}
        </p>
      </div>

      <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto pr-1">
        {jobs.map((job) => (
          <JobFormCard
            key={job.id}
            job={job}
            canRemove={jobs.length > 1}
            onUpdate={updateJob}
            onRemove={removeJob}
          />
        ))}
      </div>

      {jobs.length < MAX_JOBS && (
        <button
          type="button"
          onClick={addJob}
          className="rounded-xl border-2 border-dashed border-white/30 bg-white/5 py-3 text-white/60 transition-all duration-200 hover:border-white/50 hover:bg-white/10 hover:text-white/80"
        >
          {t("onboarding_add_job")}
        </button>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
        >
          {t("onboarding_back")}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-white shadow-lg transition-all duration-200 hover:bg-amber-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-500"
        >
          {t("onboarding_next")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 - Confirm & Go
// ---------------------------------------------------------------------------

function StepDone({
  children: localChildren,
  jobs: localJobs,
  onBack,
  onComplete,
  isSaving,
}: {
  children: LocalChild[];
  jobs: LocalJob[];
  onBack: () => void;
  onComplete: () => void;
  isSaving: boolean;
}) {
  const { t, locale } = useTranslation();

  return (
    <div className="animate-float-up flex w-full max-w-lg flex-col items-center gap-8 text-center">
      <div className="text-8xl">
        <span role="img" aria-label="celebration">
          🎉
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white drop-shadow-lg sm:text-4xl">
          {t("onboarding_all_done")}
        </h2>
        <p className="text-lg text-white/80">
          {t("onboarding_all_done_subtitle")}
        </p>
      </div>

      {/* Crew summary */}
      <div className="w-full rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <h3 className="mb-4 text-lg font-bold text-amber-300">
          {t("onboarding_your_crew")}
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          {localChildren.map((child) => {
            const iconConfig = child.icon ? CHILD_ICON_CONFIG[child.icon] : null;
            return (
              <div
                key={child.id}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <span className="text-4xl">{iconConfig?.emoji ?? "🏴‍☠️"}</span>
                <span className="font-bold text-white">{child.name}</span>
                <span className="text-xs text-white/50">
                  {iconConfig
                    ? locale === "ja"
                      ? iconConfig.labelJa
                      : iconConfig.label
                    : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Jobs summary */}
      <div className="w-full rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <h3 className="mb-4 text-lg font-bold text-amber-300">
          {t("tab_jobs")}
        </h3>
        <div className="flex flex-col gap-2">
          {localJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{job.icon}</span>
                <span className="font-semibold text-white">{job.title}</span>
              </div>
              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-300">
                ¥{job.yenAmount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 disabled:opacity-40"
        >
          {t("onboarding_back")}
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={isSaving}
          className="flex-1 rounded-2xl bg-amber-500 py-4 text-xl font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-amber-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-amber-500"
        >
          {isSaving ? t("onboarding_saving") : t("onboarding_start_adventure")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { locale } = useTranslation();

  // Convex
  const convexUser = useQuery(
    api.functions.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const createChild = useMutation(api.functions.children.create);
  const createJob = useMutation(api.functions.jobs.create);

  // Local state
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [localChildren, setLocalChildren] = useState<LocalChild[]>([
    { id: crypto.randomUUID(), name: "", icon: null },
  ]);
  const [localJobs, setLocalJobs] = useState<LocalJob[]>([
    { id: crypto.randomUUID(), title: "", icon: "🧹", yenAmount: 100 },
  ]);

  // Step transition with a small fade delay
  const [visible, setVisible] = useState(true);

  const goToStep = useCallback(
    (next: number) => {
      setVisible(false);
      setTimeout(() => {
        setStep(next);
        setVisible(true);
      }, 200);
    },
    []
  );

  // Complete onboarding: save children + jobs, then redirect
  const handleComplete = useCallback(async () => {
    if (!convexUser?._id) return;

    setIsSaving(true);
    try {
      // Create all children
      for (const child of localChildren) {
        if (child.name.trim() && child.icon) {
          await createChild({
            userId: convexUser._id,
            name: child.name.trim(),
            icon: child.icon,
          });
        }
      }

      // Create all jobs (with auto-translation)
      for (const job of localJobs) {
        if (job.title.trim()) {
          let titleEn = job.title.trim();
          let titleJa: string | undefined;

          // Auto-translate job title
          try {
            const res = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: job.title.trim(), from: locale }),
            });
            if (res.ok) {
              const { translated } = await res.json();
              if (locale === "ja") {
                titleJa = job.title.trim();
                titleEn = translated;
              } else {
                titleJa = translated;
              }
            }
          } catch {
            // Translation failed silently
          }

          await createJob({
            userId: convexUser._id,
            title: titleEn,
            titleJa,
            yenAmount: job.yenAmount,
            assignedTo: "all",
            dailyLimit: 1,
            weeklyLimit: 7,
            icon: job.icon,
          });
        }
      }

      // Redirect to home
      router.push("/");
    } catch (error) {
      console.error("Onboarding error:", error);
      setIsSaving(false);
    }
  }, [convexUser, localChildren, localJobs, createChild, createJob, locale, router]);

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      {/* Language toggle */}
      <div className="absolute right-4 top-4 z-30">
        <LanguageToggle />
      </div>

      {/* Progress indicator */}
      <div className="mb-8 mt-4">
        <ProgressDots current={step} total={4} />
      </div>

      {/* Step content with fade transition */}
      <div
        className={`flex w-full flex-1 items-center justify-center transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {step === 0 && <StepWelcome onNext={() => goToStep(1)} />}
        {step === 1 && (
          <StepAddChildren
            children={localChildren}
            setChildren={setLocalChildren}
            onNext={() => goToStep(2)}
            onBack={() => goToStep(0)}
          />
        )}
        {step === 2 && (
          <StepAddJobs
            jobs={localJobs}
            setJobs={setLocalJobs}
            onNext={() => goToStep(3)}
            onBack={() => goToStep(1)}
          />
        )}
        {step === 3 && (
          <StepDone
            children={localChildren}
            jobs={localJobs}
            onBack={() => goToStep(2)}
            onComplete={handleComplete}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
}
