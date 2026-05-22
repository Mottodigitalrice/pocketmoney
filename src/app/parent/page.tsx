"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ParentHeader } from "@/components/features/parent-dashboard/ParentHeader";
import { QuickAddToday } from "@/components/features/parent-dashboard/QuickAddToday";
import { ApprovalQueue } from "@/components/features/parent-dashboard/ApprovalQueue";
import { AppSkeleton } from "@/components/features/shared/AppSkeleton";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";

// Wave 4a perf: tabs 3-6 (planner / jobs / overview / children) are lazy.
// The default-load path (quick_add) plus ApprovalQueue stay eager because
// they're the two lightweight "today" surfaces — splitting them would add
// a skeleton flash on the most common entry point without saving real KB.
// The heavier tabs (WeekPlanner's 7-day grid, JobManager's recurring-job
// editor, ChildManager, LuckyChestSettings, ChildOverview's per-child
// rollup) defer behind `dynamic({ ssr: false })` and reuse AppSkeleton
// while their chunk loads.
const WeekPlanner = dynamic(
  () =>
    import("@/components/features/parent-dashboard/WeekPlanner").then((m) => ({
      default: m.WeekPlanner,
    })),
  {
    ssr: false,
    loading: () => <AppSkeleton variant="parent" />,
  },
);
const JobManager = dynamic(
  () =>
    import("@/components/features/parent-dashboard/JobManager").then((m) => ({
      default: m.JobManager,
    })),
  {
    ssr: false,
    loading: () => <AppSkeleton variant="parent" />,
  },
);
const ChildOverview = dynamic(
  () =>
    import("@/components/features/parent-dashboard/ChildOverview").then(
      (m) => ({ default: m.ChildOverview }),
    ),
  {
    ssr: false,
    loading: () => <AppSkeleton variant="parent" />,
  },
);
const ChildManager = dynamic(
  () =>
    import("@/components/features/parent-dashboard/ChildManager").then((m) => ({
      default: m.ChildManager,
    })),
  {
    ssr: false,
    loading: () => <AppSkeleton variant="parent" />,
  },
);
const LuckyChestSettings = dynamic(
  () =>
    import("@/components/features/parent-dashboard/LuckyChestSettings").then(
      (m) => ({ default: m.LuckyChestSettings }),
    ),
  {
    ssr: false,
    loading: () => <AppSkeleton variant="parent" />,
  },
);

type Tab =
  | "quick_add"
  | "approvals"
  | "planner"
  | "jobs"
  | "overview"
  | "children";

const tabIds: Tab[] = [
  "quick_add",
  "approvals",
  "planner",
  "jobs",
  "overview",
  "children",
];

const DEFAULT_TAB: Tab = "quick_add";

function isTab(value: string | null): value is Tab {
  return value !== null && tabIds.includes(value as Tab);
}

// F10 5.20 — tab state lives in `?tab=...` instead of `#...`. Reading the
// search params on the server pass means we hydrate with the correct active
// tab on the first paint (no flash to "quick_add" then re-render). The
// Suspense boundary below is required by Next 16 whenever a tree calls
// `useSearchParams()` — otherwise `next build` fails.
export default function ParentPage() {
  return (
    <Suspense fallback={<AppSkeleton variant="parent" />}>
      <ParentPageInner />
    </Suspense>
  );
}

function ParentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const { t } = useTranslation();
  const {
    familyChildren,
    addChild,
    editChild,
    deleteChild,
    isLoading,
    jobInstances,
  } = usePocketMoney();

  // Wave 7 — F10 5.18 (Option A): when the family has at least one approved
  // job (lifetime), default to the Overview tab — the "status snapshot" view
  // most relevant for a parent who's been using the app. Brand-new families
  // (zero approvals ever) still land on Quick Add because their first job is
  // a creation step, not a review step.
  //
  // Wave 6's `?tab=` search-param override still wins via `isTab(tabParam)`
  // below. Wave 4's lazy-loading of Overview's children (LuckyChestSettings +
  // ChildOverview) still kicks in because the imports are eager but the
  // sub-components are dynamic at the JSX site.
  const hasApprovedInstance = jobInstances.some(
    (instance) => instance.status === "approved",
  );
  const smartDefaultTab: Tab = hasApprovedInstance ? "overview" : DEFAULT_TAB;
  const activeTab: Tab = isTab(tabParam) ? tabParam : smartDefaultTab;

  const setActiveTab = (tab: Tab) => {
    // `scroll: false` keeps the user's scroll position when toggling tabs.
    // `replace` (not `push`) so back-button doesn't accumulate tab-history.
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  // G2: parent dashboard also benefits from a skeleton while Convex hydrates,
  // so the tabs/widgets aren't visibly empty before data arrives.
  if (isLoading) {
    return <AppSkeleton variant="parent" />;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "quick_add", label: t("tab_quick_add") },
    { id: "approvals", label: t("tab_approvals") },
    { id: "planner", label: t("tab_planner") },
    { id: "jobs", label: t("tab_jobs") },
    { id: "overview", label: t("tab_overview") },
    { id: "children", label: t("tab_children") },
  ];

  return (
    <div className="min-h-screen pb-8">
      <ParentHeader />

      {/* Tab bar — F19 a11y: role=tablist + role=tab + aria-selected, plus
          focus-visible rings and tabpanel wiring for screen readers. */}
      <div
        role="tablist"
        aria-label={t("tab_navigation_label")}
        className="hide-scrollbar mx-4 mt-6 flex gap-2 overflow-x-auto sm:mx-8"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`parent-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`parent-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            // F19 a11y: bumped inactive-tab text from amber-300/70 (≈3.5:1)
            // to amber-200 (≈6.5:1) on the amber-900/40 backdrop.
            className={`whitespace-nowrap rounded-xl px-4 py-3 text-center text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:flex-1 sm:text-base ${
              activeTab === tab.id
                ? "bg-amber-600 text-white shadow-lg"
                : "bg-amber-900/40 text-amber-200 hover:bg-amber-800/40 hover:text-amber-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* H4 — empty-state CTAs in QuickAddToday/WeekPlanner can call this
          to switch to the Crew tab. URL `?tab=` stays in sync via the
          router.replace inside setActiveTab. */}
      {/* Tab content */}
      <div
        role="tabpanel"
        id={`parent-panel-${activeTab}`}
        aria-labelledby={`parent-tab-${activeTab}`}
        className="mx-4 mt-6 sm:mx-8"
      >
        {activeTab === "quick_add" && (
          <QuickAddToday
            onNavigateToChildren={() => setActiveTab("children")}
          />
        )}
        {activeTab === "approvals" && <ApprovalQueue />}
        {activeTab === "planner" && (
          <WeekPlanner onNavigateToChildren={() => setActiveTab("children")} />
        )}
        {activeTab === "jobs" && <JobManager />}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <LuckyChestSettings />
            {familyChildren.map((child) => (
              <ChildOverview key={child._id} childId={child._id} />
            ))}
            {familyChildren.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-900/20 py-12 text-center">
                <span className="mb-3 text-5xl">👶</span>
                <p className="text-lg font-semibold text-amber-200">
                  {t("children_empty")}
                </p>
                <p className="text-sm text-amber-300/60">
                  {t("children_empty_subtitle")}
                </p>
              </div>
            )}
          </div>
        )}
        {activeTab === "children" && (
          <ChildManager
            crewMembers={familyChildren}
            onAdd={addChild}
            onEdit={editChild}
            onDelete={deleteChild}
          />
        )}
      </div>
    </div>
  );
}
