"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";

/**
 * AppSkeleton — polished shell placeholder for initial Convex hydration.
 *
 * G2: replaces the bare `...` text gate on the home/kid/parent pages.
 * Fills the void during the 200–800ms (slow networks: longer) before
 * `PocketMoneyProvider.isLoading` flips false. After hydration, real UI
 * mounts; if data is genuinely empty, F11 empty-state copy fires instead.
 *
 * Palette tuned to the project's pirate amber-on-deep-blue look — the base
 * shadcn `Skeleton` is `bg-accent`, which on this app's dark amber surfaces
 * reads as a muted shimmer rather than the spec's `bg-amber-900/30`. We use
 * the shadcn default so any future theme retuning stays centralized.
 *
 * H3 — punchlist 2.1: the `home` variant now shows a friendly visible
 * "Loading your crew…" label so the brief empty-character-select flash during
 * the `convexUser === undefined` provisioning race reads as intentional
 * loading copy rather than a blank shell.
 */
export function AppSkeleton({ variant = "home" }: { variant?: "home" | "kid" | "parent" }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      data-testid="app-skeleton"
      className="min-h-screen bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 pb-8"
    >
      {/* Header strip: logo placeholder + nav placeholders */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Skeleton className="h-10 w-32 rounded-xl bg-amber-900/40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full bg-amber-900/40" />
          <Skeleton className="h-9 w-9 rounded-full bg-amber-900/40" />
        </div>
      </div>

      {variant === "home" && <HomeSkeletonBody />}
      {variant === "kid" && <KidSkeletonBody />}
      {variant === "parent" && <ParentSkeletonBody />}
    </div>
  );
}

function HomeSkeletonBody() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12">
      <Skeleton className="h-14 w-72 rounded-xl bg-amber-900/40" />
      <Skeleton className="mt-4 h-6 w-56 rounded-lg bg-amber-900/30" />

      {/* H3 — punchlist 2.1: visible loading copy so the convexUser
          provisioning race reads as intentional loading, not a blank flash. */}
      <p
        data-testid="home-loading-label"
        className="mt-6 text-sm font-medium text-white/70 drop-shadow"
      >
        {t("home_loading_crew")}
      </p>

      {/* Child avatar row — 3 round skeletons */}
      <div className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <Skeleton className="size-24 rounded-full bg-amber-900/40" />
            <Skeleton className="h-5 w-20 rounded bg-amber-900/30" />
            <Skeleton className="h-3 w-16 rounded bg-amber-900/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function KidSkeletonBody() {
  return (
    <div className="mt-4 space-y-6">
      {/* Header bar */}
      <div className="mx-4 sm:mx-8">
        <Skeleton className="h-20 w-full rounded-2xl bg-amber-900/40" />
      </div>

      {/* Wallet/weekly tracker block */}
      <div className="mx-4 sm:mx-8">
        <Skeleton className="h-32 w-full rounded-2xl bg-amber-900/40" />
      </div>

      {/* Kanban — 3 columns × 3 card slots */}
      <div className="px-4 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((col) => (
            <div key={col} className="space-y-3 rounded-2xl border border-amber-900/30 p-3">
              <Skeleton className="h-6 w-24 rounded bg-amber-900/40" />
              <Skeleton className="h-20 w-full rounded-xl bg-amber-900/30" />
              <Skeleton className="h-20 w-full rounded-xl bg-amber-900/30" />
              <Skeleton className="h-20 w-full rounded-xl bg-amber-900/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Two wide bottom widgets */}
      <div className="mx-4 grid gap-4 sm:mx-8 md:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-2xl bg-amber-900/40" />
        <Skeleton className="h-40 w-full rounded-2xl bg-amber-900/40" />
      </div>
    </div>
  );
}

function ParentSkeletonBody() {
  return (
    <div className="mt-6 space-y-6">
      {/* Tab bar */}
      <div className="mx-4 flex gap-2 overflow-x-auto sm:mx-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-xl bg-amber-900/40" />
        ))}
      </div>

      {/* Child avatar row */}
      <div className="mx-4 flex gap-3 sm:mx-8">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="size-14 rounded-full bg-amber-900/40" />
        ))}
      </div>

      {/* Body widgets */}
      <div className="mx-4 space-y-4 sm:mx-8">
        <Skeleton className="h-32 w-full rounded-2xl bg-amber-900/40" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-2xl bg-amber-900/30" />
          <Skeleton className="h-24 w-full rounded-2xl bg-amber-900/30" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl bg-amber-900/40" />
      </div>
    </div>
  );
}
