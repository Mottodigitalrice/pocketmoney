"use client";

import { use } from "react";
import { KidHeader } from "@/components/features/kid-dashboard/KidHeader";
import { WeeklyTracker } from "@/components/features/kid-dashboard/WeeklyTracker";
import { GoalWishlist } from "@/components/features/kid-dashboard/GoalWishlist";
import { LuckyChest } from "@/components/features/kid-dashboard/LuckyChest";
import { SiblingRankBoard } from "@/components/features/kid-dashboard/SiblingRankBoard";
import { UpcomingWeekPreview } from "@/components/features/kid-dashboard/UpcomingWeekPreview";
import { TreasureHistoryCalendar } from "@/components/features/kid-dashboard/TreasureHistoryCalendar";
import { RankUpToast } from "@/components/features/kid-dashboard/RankUpToast";
import { KanbanBoard } from "@/components/features/kanban/KanbanBoard";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";

interface KidPageProps {
  params: Promise<{ childId: string }>;
}

export default function KidPage({ params }: KidPageProps) {
  const { childId } = use(params);
  const { t } = useTranslation();
  const { getChildById, getRankForChild, isLoading } = usePocketMoney();

  const child = getChildById(childId);
  const currentRank = child ? getRankForChild(childId).rank : null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <div className="animate-pulse text-2xl">{t("kid_loading")}</div>
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
      {currentRank && <RankUpToast childId={childId} currentRank={currentRank} />}
      <KidHeader childId={childId} />
      <div className="mt-4 space-y-6">
        <WeeklyTracker childId={childId} />
        <LuckyChest childId={childId} />
        <SiblingRankBoard childId={childId} />
        <GoalWishlist childId={childId} />
        <UpcomingWeekPreview childId={childId} />
        <div className="px-4 sm:px-8">
          <KanbanBoard childId={childId} />
        </div>
        <TreasureHistoryCalendar childId={childId} />
      </div>
    </div>
  );
}
