"use client";

import { usePocketMoney } from "@/hooks/use-pocket-money";
import { CURRENCY } from "@/lib/constants";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/use-translation";
import { useEffect, useRef, useState } from "react";
import { WalletJarBalances } from "@/components/features/shared/WalletJarBalances";

// F21: chest animation only renders when the user taps the wallet card.
// Lazy-load the motion + canvas bundle until then.
const TreasureChestAnimation = dynamic(
  () =>
    import("./TreasureChestAnimation").then((m) => ({
      default: m.TreasureChestAnimation,
    })),
  { ssr: false },
);

interface WeeklyTrackerProps {
  childId: string;
}

export function WeeklyTracker({ childId }: WeeklyTrackerProps) {
  const {
    getWeeklyEarnings,
    getWeeklyPotential,
    getWalletBalance,
    getWalletTotal,
  } = usePocketMoney();
  const [showTreasure, setShowTreasure] = useState(false);
  const { t } = useTranslation();

  const earned = getWeeklyEarnings(childId);
  const walletBalances = {
    spend: getWalletBalance(childId, "spend"),
    save: getWalletBalance(childId, "save"),
    give: getWalletBalance(childId, "give"),
  };
  const walletTotal = getWalletTotal(childId);
  const potential = getWeeklyPotential(childId);
  const percentage = potential > 0 ? Math.round((earned / potential) * 100) : 0;

  // Wave 2a polish: pulse the progress bar when the kid first crosses 100%.
  // We track the previous-render's percentage so re-renders below the
  // threshold (e.g. locale toggles) don't re-fire the pulse. The 1500ms
  // window matches the `animate-pulse-gold` keyframe loop (2s ease) so it
  // gets one full visual pulse before disabling.
  const [celebratingFull, setCelebratingFull] = useState(false);
  const prevPercentRef = useRef<number>(percentage);
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevPercentRef.current;
    prevPercentRef.current = percentage;
    if (prev < 100 && percentage >= 100) {
      // Defer the state write out of the effect body so we don't trigger a
      // synchronous cascading render — matches the queueMicrotask pattern
      // used by KanbanBoard's approval-celebration effect.
      queueMicrotask(() => {
        setCelebratingFull(true);
      });
      if (celebrateTimerRef.current) {
        clearTimeout(celebrateTimerRef.current);
      }
      celebrateTimerRef.current = setTimeout(() => {
        setCelebratingFull(false);
        celebrateTimerRef.current = null;
      }, 1500);
    }
  }, [percentage]);

  useEffect(() => {
    return () => {
      if (celebrateTimerRef.current) {
        clearTimeout(celebrateTimerRef.current);
        celebrateTimerRef.current = null;
      }
    };
  }, []);

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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-amber-200">
                    {t("wallet_total")}
                  </p>
                  <p className="text-2xl font-extrabold text-amber-100 sm:text-3xl">
                    {CURRENCY}
                    {walletTotal.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-200">
                    {t("treasure_this_week")}
                  </p>
                  <p className="text-2xl font-extrabold text-amber-100 sm:text-3xl">
                    {CURRENCY}
                    {earned.toLocaleString()}
                  </p>
                </div>
              </div>
              <div
                className={`mt-2 h-3 overflow-hidden rounded-full bg-amber-950 ${
                  celebratingFull ? "animate-pulse-gold" : ""
                }`}
                data-testid="weekly-tracker-progress"
                data-celebrating={celebratingFull ? "true" : "false"}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-amber-300">
                {t("weekly_progress", {
                  earned: earned.toLocaleString(),
                  total: potential.toLocaleString(),
                })}
              </p>
              {/* S3 (R4) — F10 6.5: first-day ¥0 nudge. Fires only when there
                  IS something to earn (potential > 0) but nothing has landed
                  yet — so we don't shout at a kid on a planning-only week. */}
              {earned === 0 && potential > 0 && (
                <p
                  className="mt-1 text-xs font-medium text-amber-200/90"
                  data-testid="weekly-tracker-zero-hint"
                >
                  {t("weekly_tracker_zero_hint")}
                </p>
              )}
              <div className="mt-3">
                <WalletJarBalances balances={walletBalances} compact />
              </div>
            </div>
            <div className="text-2xl sm:text-4xl">💰</div>
          </div>
        </div>
      </div>

      {showTreasure && (
        <TreasureChestAnimation
          totalYen={walletTotal}
          onClose={() => setShowTreasure(false)}
        />
      )}
    </>
  );
}
