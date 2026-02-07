"use client";

import { ChildId } from "@/types";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { CURRENCY } from "@/lib/constants";
import { TreasureChestAnimation } from "./TreasureChestAnimation";
import { useState } from "react";

interface WeeklyTrackerProps {
  childId: ChildId;
}

export function WeeklyTracker({ childId }: WeeklyTrackerProps) {
  const { getWeeklyEarnings, getWeeklyPotential } = usePocketMoney();
  const [showTreasure, setShowTreasure] = useState(false);

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
          <div className="flex items-center gap-4">
            {/* Treasure chest */}
            <div className="text-5xl">🏴‍☠️</div>

            <div className="flex-1">
              <p className="text-sm font-medium text-amber-200">This Week&apos;s Treasure</p>
              <p className="text-3xl font-extrabold text-amber-100">
                {CURRENCY}{earned.toLocaleString()}
              </p>

              {/* Progress bar */}
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-amber-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-1000"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-amber-300">
                {CURRENCY}{earned.toLocaleString()} of {CURRENCY}{potential.toLocaleString()} possible
              </p>
            </div>

            <div className="text-4xl">💰</div>
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
