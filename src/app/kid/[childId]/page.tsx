"use client";

import { use } from "react";
import { ChildId } from "@/types";
import { KidHeader } from "@/components/features/kid-dashboard/KidHeader";
import { WeeklyTracker } from "@/components/features/kid-dashboard/WeeklyTracker";
import { KanbanBoard } from "@/components/features/kanban/KanbanBoard";

interface KidPageProps {
  params: Promise<{ childId: string }>;
}

export default function KidPage({ params }: KidPageProps) {
  const { childId } = use(params);

  // Validate childId
  if (childId !== "jayden" && childId !== "tyler") {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <p className="text-2xl">Who are you? 🤔</p>
      </div>
    );
  }

  const validChildId = childId as ChildId;

  return (
    <div className="min-h-screen pb-8">
      <KidHeader childId={validChildId} />
      <div className="mt-4 space-y-6">
        <WeeklyTracker childId={validChildId} />
        <div className="px-4 sm:px-8">
          <KanbanBoard childId={validChildId} />
        </div>
      </div>
    </div>
  );
}
