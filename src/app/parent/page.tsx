"use client";

import { useState } from "react";
import { ParentHeader } from "@/components/features/parent-dashboard/ParentHeader";
import { ApprovalQueue } from "@/components/features/parent-dashboard/ApprovalQueue";
import { JobManager } from "@/components/features/parent-dashboard/JobManager";
import { ChildOverview } from "@/components/features/parent-dashboard/ChildOverview";

type Tab = "approvals" | "jobs" | "overview";

export default function ParentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("approvals");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "approvals", label: "Approvals", icon: "✅" },
    { id: "jobs", label: "Jobs", icon: "📜" },
    { id: "overview", label: "Overview", icon: "👀" },
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
            <span className="mr-1">{tab.icon}</span>
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
            <ChildOverview childId="jayden" />
            <ChildOverview childId="tyler" />
          </div>
        )}
      </div>
    </div>
  );
}
