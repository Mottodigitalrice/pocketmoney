"use client";

import { usePocketMoney } from "@/hooks/use-pocket-money";
import { CURRENCY } from "@/lib/constants";
import { TreasureChestAnimation } from "./TreasureChestAnimation";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";

interface WeeklyTrackerProps {
  childId: string;
}

export function WeeklyTracker({ childId }: WeeklyTrackerProps) {
  const { getWeeklyEarnings, getWeeklyPotential } = usePocketMoney();
  const [showTreasure, setShowTreasure] = useState(false);
  const { t } = useTranslation();

  const earned = getWeeklyEarnings(childId);
  const potential = getWeeklyPotential(childId);
  const percentage = potential > 0 ? Math.round((earned / potential) * 100) : 0;

  return (
    <>
      <div
        className="mx-4 cursor-pointer sm:mx-8"
        onClick={() => setShowTreasure(true)}
      >
        <div className="animate-treasure-glow overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-900/80 to-amber-800/80 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-3xl sm:text-5xl">🏴‍☠️</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-200">
                {t("weekly_treasure_title")}
              </p>
              <p className="text-2xl font-extrabold text-amber-100 sm:text-3xl">
                {CURRENCY}
                {earned.toLocaleString()}
              </p>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-amber-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-1000"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-amber-300">
                {t("weekly_progress", {
                  earned: earned.toLocaleString(),
                  total: potential.toLocaleString(),
                })}
              </p>
            </div>
            <div className="text-2xl sm:text-4xl">💰</div>
          </div>
        </div>
      </div>

      {showTreasure && (
        <TreasureChestAnimation
          totalYen={earned}
          onClose={() => setShowTreasure(false)}
        />
      )}
    </>
  );
}
