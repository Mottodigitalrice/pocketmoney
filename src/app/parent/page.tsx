"use client";

import { useState } from "react";
import { ParentHeader } from "@/components/features/parent-dashboard/ParentHeader";
import { ApprovalQueue } from "@/components/features/parent-dashboard/ApprovalQueue";
import { JobManager } from "@/components/features/parent-dashboard/JobManager";
import { ChildOverview } from "@/components/features/parent-dashboard/ChildOverview";
import { ChildManager } from "@/components/features/parent-dashboard/ChildManager";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";

type Tab = "approvals" | "jobs" | "overview" | "children";

export default function ParentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("approvals");
  const { t } = useTranslation();
  const { familyChildren, addChild, editChild, deleteChild } = usePocketMoney();

  const tabs: { id: Tab; label: string }[] = [
    { id: "approvals", label: t("tab_approvals") },
    { id: "jobs", label: t("tab_jobs") },
    { id: "overview", label: t("tab_overview") },
    { id: "children", label: t("tab_children") },
  ];

  return (
    <div className="min-h-screen pb-8">
      <ParentHeader />

      {/* Tab bar */}
      <div className="mx-4 mt-6 flex gap-2 sm:mx-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-bold transition-all sm:text-base ${
              activeTab === tab.id
                ? "bg-amber-600 text-white shadow-lg"
                : "bg-amber-900/40 text-amber-300/70 hover:bg-amber-800/40 hover:text-amber-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mx-4 mt-6 sm:mx-8">
        {activeTab === "approvals" && <ApprovalQueue />}
        {activeTab === "jobs" && <JobManager />}
        {activeTab === "overview" && (
          <div className="space-y-6">
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
            children={familyChildren}
            onAdd={addChild}
            onEdit={editChild}
            onDelete={deleteChild}
          />
        )}
      </div>
    </div>
  );
}
