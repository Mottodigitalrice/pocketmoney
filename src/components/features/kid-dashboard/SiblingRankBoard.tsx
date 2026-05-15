"use client";

import { Trophy } from "lucide-react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CHILD_ICON_CONFIG, CURRENCY } from "@/lib/constants";
import type { ChildIcon } from "@/types";

interface SiblingRankBoardProps {
  childId: string;
}

export function SiblingRankBoard({ childId }: SiblingRankBoardProps) {
  const { t } = useTranslation();
  const { familyChildren, getRankForChild, getWalletTotal } = usePocketMoney();

  const rankedChildren = familyChildren
    .map((child) => ({
      child,
      rank: getRankForChild(child._id),
      total: getWalletTotal(child._id),
    }))
    .sort((a, b) => b.rank.score - a.rank.score);

  // F11: don't render a leaderboard with fewer than 2 kids — a 1-row leaderboard is awkward.
  // Hidden entirely per PRD (gap 6.8); copy keys (sibling_rank_solo_*) exist if a soft variant is wanted later.
  if (rankedChildren.length < 2) return null;

  return (
    <div className="mx-4 rounded-2xl border border-amber-300/25 bg-amber-950/35 p-4 backdrop-blur-sm sm:mx-8">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-100">
          <Trophy className="size-5" />
        </div>
        <h2 className="text-lg font-extrabold text-amber-100">
          {t("rank_board_title")}
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rankedChildren.map(({ child, rank, total }, index) => {
          const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
          const isCurrentChild = child._id === childId;
          return (
            <div
              key={child._id}
              className={`rounded-xl border p-3 ${
                isCurrentChild
                  ? "border-amber-300/60 bg-amber-700/30"
                  : "border-amber-700/20 bg-amber-900/25"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-950/60 text-sm font-extrabold text-amber-100">
                  #{index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{iconConfig?.emoji ?? "👤"}</span>
                    <p className="truncate font-extrabold text-amber-100">
                      {child.name}
                    </p>
                  </div>
                  <p className="mt-1 text-sm font-bold text-amber-200">
                    {rank.rank}
                  </p>
                </div>
                <p className="shrink-0 text-right text-sm font-bold text-amber-100">
                  {CURRENCY}
                  {total.toLocaleString()}
                </p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-200"
                  style={{ width: `${rank.progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-amber-200/70">
                {rank.nextRank
                  ? t("rank_next", {
                      rank: rank.nextRank,
                      score: (rank.nextScore ?? 0).toLocaleString(),
                    })
                  : t("rank_max")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
