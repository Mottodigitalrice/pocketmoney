"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { BudouXText } from "@/components/shared/BudouXText";
import { useTranslation } from "@/hooks/use-translation";

interface CoinDrop {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

/**
 * Wave 8c — brief coin-rain overlay for the onboarding-complete celebration.
 * Mirrors LuckyChestCoinBurst (Wave 2a) but with 16 coins instead of 12 — the
 * end-of-onboarding moment is a bigger beat than a single chest-open since the
 * whole funnel just landed. Skipped entirely under prefers-reduced-motion at
 * the caller (`OnboardingCompleteCelebration` below).
 */
function OnboardingCompleteCoinBurst() {
  const [coins] = useState<CoinDrop[]>(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 0.8,
    })),
  );
  return (
    <div
      aria-hidden="true"
      data-testid="onboarding-celebrate-coin-burst"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="animate-coin-rain absolute text-3xl"
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

interface OnboardingCompleteCelebrationProps {
  /** Family name (typically the first child's name) interpolated into copy. */
  familyName: string;
}

/**
 * Wave 8c — full-screen micro-celebration fired after the parent finishes the
 * onboarding funnel and the Convex save resolves. The redirect to `/` is owned
 * by the caller (OnboardingPageInner) — this component is purely presentational
 * so tests can drive the timer deterministically via `vi.useFakeTimers`.
 *
 * Shape:
 *   - Center: 🏴‍☠️ pirate flag (animate-scale-bounce)
 *   - Title: t("onboarding_celebrate_title", { familyName })
 *   - Subtitle: t("onboarding_celebrate_subtitle"), BudouX-wrapped for JP
 *   - Coin-rain (16 coins) UNLESS prefers-reduced-motion
 *   - sr-only aria-live="polite" region carrying the same beat for screen
 *     readers (Wave 6 pattern — see LuckyChest a11y_lucky_chest_opened)
 */
export function OnboardingCompleteCelebration({
  familyName,
}: OnboardingCompleteCelebrationProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      data-testid="onboarding-celebrate-overlay"
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-900/80 via-slate-900/90 to-slate-950/95 px-6 text-center backdrop-blur-md"
    >
      {!prefersReducedMotion && <OnboardingCompleteCoinBurst />}

      <div className="animate-scale-bounce text-8xl drop-shadow-2xl sm:text-9xl">
        <span role="img" aria-label="pirate flag">
          🏴‍☠️
        </span>
      </div>

      <div className="max-w-lg space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-4xl">
          <BudouXText text={t("onboarding_celebrate_title", { familyName })} />
        </h1>
        <p className="text-lg text-amber-200/90 drop-shadow">
          <BudouXText text={t("onboarding_celebrate_subtitle")} />
        </p>
      </div>

      {/* Wave 6 pattern — hidden polite live region carries the same beat
          (family setup complete) to assistive tech, since the flag + coin-burst
          are visual-only. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="onboarding-celebrate-a11y-announce"
      >
        {t("onboarding_celebrate_announce")}
      </div>
    </div>
  );
}
