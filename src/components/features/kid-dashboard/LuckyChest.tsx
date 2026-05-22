"use client";

import { useEffect, useRef, useState } from "react";
import { Gift, Lock, Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BudouXText } from "@/components/shared/BudouXText";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CURRENCY } from "@/lib/constants";
import { mapConvexError } from "@/lib/convex-errors";

interface CoinDrop {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

/**
 * Wave 2a polish: brief coin-rain overlay for the lucky-chest open moment.
 * Reuses the same `animate-coin-rain` keyframe DolphinCelebration uses, but
 * scoped to ~2s and ~12 coins so it stays a quick reward beat (the chest is
 * a smaller moment than the big dolphin celebration on job approval).
 */
function LuckyChestCoinBurst() {
  const [coins] = useState<CoinDrop[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 0.8,
    })),
  );
  return (
    <div
      aria-hidden="true"
      data-testid="lucky-chest-coin-burst"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="animate-coin-rain absolute text-2xl"
          style={{
            left: `${coin.left}%`,
            top: -32,
            animationDelay: `${coin.delay}s`,
            animationDuration: `${coin.duration}s`,
          }}
        >
          🪙
        </div>
      ))}
    </div>
  );
}

/**
 * G2: LuckyChestSkeleton — chest icon + lock-status text-line placeholder.
 */
function LuckyChestSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="lucky-chest-skeleton"
      className="mx-4 rounded-2xl border border-yellow-300/15 bg-yellow-950/15 p-4 backdrop-blur-sm sm:mx-8"
    >
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 rounded-xl bg-yellow-900/40" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40 rounded bg-yellow-900/40" />
          <Skeleton className="h-4 w-56 rounded bg-yellow-900/30" />
        </div>
      </div>
    </div>
  );
}

interface LuckyChestProps {
  childId: string;
}

export function LuckyChest({ childId }: LuckyChestProps) {
  const { t } = useTranslation();
  const { isLoading, getLuckyChestStatus, openLuckyChest } = usePocketMoney();
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState("");
  // Wave 2a polish: brief coin-rain + amount bounce when this kid is the one
  // who just opened the chest. `justOpened` is local-only — flips to true on
  // the successful mutation resolve and self-clears after 2s. Re-renders
  // driven by Convex realtime (e.g. status.opened arrives from a sibling) do
  // NOT trigger it because we only set it inside `handleOpen`.
  const [justOpened, setJustOpened] = useState(false);
  const justOpenedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (justOpenedTimerRef.current) {
        clearTimeout(justOpenedTimerRef.current);
        justOpenedTimerRef.current = null;
      }
    };
  }, []);

  // G2: skeleton while context hydrates. After hydration, !status returns null
  // (F11 already handles the "no chest yet" path inside the component below).
  if (isLoading) return <LuckyChestSkeleton />;

  const status = getLuckyChestStatus(childId);

  if (!status) return null;

  // F13: When no must-do jobs are scheduled this week, the chest is "sleeping"
  // — don't show "0 / 0 approved" which reads like failure. Show a gentle
  // informational state instead, no Open button (would be misleading).
  if (status.mustDoTotal === 0) {
    return (
      <div
        data-testid="lucky-chest"
        data-sleeping="true"
        data-unlocked="false"
        data-opened="false"
        className="mx-4 rounded-2xl border border-yellow-300/15 bg-yellow-950/15 p-4 backdrop-blur-sm sm:mx-8"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-100/60">
            <Gift className="size-5" />
            <Moon className="absolute -right-1 -top-1 size-3.5 text-yellow-100/80" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-yellow-100/80">
              {t("lucky_chest_sleeping_title")}
            </h2>
            <p className="mt-1 text-sm text-yellow-100/60">
              <BudouXText>{t("lucky_chest_sleeping_hint")}</BudouXText>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleOpen = async () => {
    if (!status.unlocked || status.opened || isOpening) return;
    setIsOpening(true);
    setError("");
    try {
      await openLuckyChest(childId);
      // Success — fire the local celebration. The chest's `status.opened`
      // flips on the next Convex tick; this overlay carries the reward beat
      // until the bounce-in amount + opened state lands.
      setJustOpened(true);
      if (justOpenedTimerRef.current) {
        clearTimeout(justOpenedTimerRef.current);
      }
      justOpenedTimerRef.current = setTimeout(() => {
        setJustOpened(false);
        justOpenedTimerRef.current = null;
      }, 2000);
    } catch (err) {
      // F12: route raw Convex errors through the typed mapper so the kid
      // never sees `LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK` or other codes.
      const { message } = mapConvexError(err, t);
      setError(message);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div
      data-testid="lucky-chest"
      data-unlocked={status.unlocked ? "true" : "false"}
      data-opened={status.opened ? "true" : "false"}
      data-celebrating={justOpened ? "true" : "false"}
      className="mx-4 rounded-2xl border border-yellow-300/30 bg-yellow-950/25 p-4 backdrop-blur-sm sm:mx-8"
    >
      {justOpened && <LuckyChestCoinBurst />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400/20 text-yellow-100">
            {status.unlocked ? (
              <Sparkles className="size-5" />
            ) : (
              <Lock className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-yellow-100">
              {t("lucky_chest_title")}
            </h2>
            <p className="mt-1 text-sm text-yellow-100/75">
              {status.opened
                ? t("lucky_chest_opened", {
                    amount: status.openedAmount?.toLocaleString() ?? "0",
                  })
                : status.unlocked
                  ? t("lucky_chest_unlocked", {
                      amount: status.maxAmount.toLocaleString(),
                    })
                  : t("lucky_chest_locked", {
                      done: status.mustDoApproved,
                      total: status.mustDoTotal,
                    })}
            </p>
            {error && (
              <p
                className="mt-2 text-sm text-red-200"
                data-testid="lucky-chest-error"
              >
                {error}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleOpen}
          disabled={!status.unlocked || status.opened || isOpening}
          data-testid="lucky-chest-open-button"
          // F20: min-h-11 — kid taps this with their thumb on a phone.
          className="min-h-11 shrink-0 gap-2 bg-yellow-500 font-extrabold text-yellow-950 hover:bg-yellow-400 disabled:opacity-60"
        >
          <Gift className="size-4" />
          {status.opened ? (
            <span
              data-testid="lucky-chest-amount"
              className={`inline-block ${justOpened ? "animate-scale-bounce" : ""}`}
            >
              {CURRENCY}
              {status.openedAmount?.toLocaleString() ?? "0"}
            </span>
          ) : isOpening ? (
            t("lucky_chest_opening")
          ) : (
            t("lucky_chest_open")
          )}
        </Button>
      </div>
    </div>
  );
}
