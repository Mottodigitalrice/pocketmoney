"use client";

import { useState } from "react";
import { ParentHeader } from "@/components/features/parent-dashboard/ParentHeader";
import { QuickAddToday } from "@/components/features/parent-dashboard/QuickAddToday";
import { ApprovalQueue } from "@/components/features/parent-dashboard/ApprovalQueue";
import { WeekPlanner } from "@/components/features/parent-dashboard/WeekPlanner";
import { JobManager } from "@/components/features/parent-dashboard/JobManager";
import { ChildOverview } from "@/components/features/parent-dashboard/ChildOverview";
import { ChildManager } from "@/components/features/parent-dashboard/ChildManager";
import { LuckyChestSettings } from "@/components/features/parent-dashboard/LuckyChestSettings";
import { AppSkeleton } from "@/components/features/shared/AppSkeleton";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";

type Tab = "quick_add" | "approvals" | "planner" | "jobs" | "overview" | "children";

const tabIds: Tab[] = ["quick_add", "approvals", "planner", "jobs", "overview", "children"];

function isTab(value: string): value is Tab {
  return tabIds.includes(value as Tab);
}

export default function ParentPage() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "quick_add";

    const hashTab = window.location.hash.replace("#", "");
    return isTab(hashTab) ? hashTab : "quick_add";
  });
  const { t } = useTranslation();
  const { familyChildren, addChild, editChild, deleteChild, isLoading } = usePocketMoney();

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
            onClick={() => {
              setActiveTab(tab.id);
              window.history.replaceState(null, "", `#${tab.id}`);
            }}
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

      {/* Tab content */}
      <div
        role="tabpanel"
        id={`parent-panel-${activeTab}`}
        aria-labelledby={`parent-tab-${activeTab}`}
        className="mx-4 mt-6 sm:mx-8"
      >
        {activeTab === "quick_add" && <QuickAddToday />}
        {activeTab === "approvals" && <ApprovalQueue />}
        {activeTab === "planner" && <WeekPlanner />}
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
