"use client";

import { use } from "react";
import Link from "next/link";
import { KidHeader } from "@/components/features/kid-dashboard/KidHeader";
import { WeeklyTracker } from "@/components/features/kid-dashboard/WeeklyTracker";
import { GoalWishlist } from "@/components/features/kid-dashboard/GoalWishlist";
import { LuckyChest } from "@/components/features/kid-dashboard/LuckyChest";
import { SiblingRankBoard } from "@/components/features/kid-dashboard/SiblingRankBoard";
import { UpcomingWeekPreview } from "@/components/features/kid-dashboard/UpcomingWeekPreview";
import { TreasureHistoryCalendar } from "@/components/features/kid-dashboard/TreasureHistoryCalendar";
import { RankUpToast } from "@/components/features/kid-dashboard/RankUpToast";
import { KanbanBoard } from "@/components/features/kanban/KanbanBoard";
import { AppSkeleton } from "@/components/features/shared/AppSkeleton";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { ROUTES } from "@/lib/constants";

interface KidPageProps {
  params: Promise<{ childId: string }>;
}

export default function KidPage({ params }: KidPageProps) {
  const { childId } = use(params);
  const { t } = useTranslation();
  const { getChildById, getRankForChild, isLoading } = usePocketMoney();

  const child = getChildById(childId);
  const currentRank = child ? getRankForChild(childId).rank : null;

  // G2: polished kid-dashboard skeleton during initial Convex hydration.
  if (isLoading) {
    return <AppSkeleton variant="kid" />;
  }

  if (!child) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-white">
        <p className="text-2xl">{t("kid_invalid_child")}</p>
        {/* H4 (Gap 6.10): give the (often mis-routed) kid a way back home.
            Using next/link + ROUTES.home so the middleware-driven redirect to
            /landing for logged-out users still happens correctly. */}
        <Link
          href={ROUTES.home}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-base font-bold text-amber-950 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          {t("kid_back_home")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {currentRank && (
        <RankUpToast childId={childId} currentRank={currentRank} />
      )}
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
