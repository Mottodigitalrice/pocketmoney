"use client";

import { use } from "react";
import { KidHeader } from "@/components/features/kid-dashboard/KidHeader";
import { WeeklyTracker } from "@/components/features/kid-dashboard/WeeklyTracker";
import { KanbanBoard } from "@/components/features/kanban/KanbanBoard";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";

interface KidPageProps {
  params: Promise<{ childId: string }>;
}

export default function KidPage({ params }: KidPageProps) {
  const { childId } = use(params);
  const { t } = useTranslation();
  const { getChildById, isLoading } = usePocketMoney();

  const child = getChildById(childId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <div className="animate-pulse text-2xl">Loading...</div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <p className="text-2xl">{t("kid_invalid_child")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <KidHeader childId={childId} />
      <div className="mt-4 space-y-6">
        <WeeklyTracker childId={childId} />
        <div className="px-4 sm:px-8">
          <KanbanBoard childId={childId} />
        </div>
      </div>
    </div>
  );
}
