"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Target } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CURRENCY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BudouXText } from "@/components/shared/BudouXText";

interface GoalWishlistProps {
  childId: string;
}

const emojiOptions = ["🎮", "⚽", "🧸", "📚", "🚲", "🎧", "🎁", "🏴‍☠️"];

interface CoinDrop {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

/**
 * stop-test-1b: brief coin-rain overlay when a save-goal crosses 100%.
 * Mirrors LuckyChestCoinBurst (Wave 2a) but scoped to 8 coins / 2s — the
 * goal-reached moment is a celebration but smaller than the chest open, so
 * we keep the burst proportional. Skipped entirely under
 * prefers-reduced-motion at the caller (pulse-gold is also disabled in CSS).
 */
function GoalReachedCoinBurst() {
  const [coins] = useState<CoinDrop[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 0.8,
    })),
  );
  return (
    <div
      aria-hidden="true"
      data-testid="goal-reached-coin-burst"
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
 * G2: GoalWishlistSkeleton — title row + progress bar + 2 line skeletons.
 * Renders while `isLoading` is true from context. F11 empty-state copy still
 * fires after hydration when goals.length === 0.
 */
function GoalWishlistSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="goal-wishlist-skeleton"
      className="mx-4 overflow-hidden rounded-2xl border border-sky-300/30 bg-sky-950/40 p-4 backdrop-blur-sm sm:mx-8"
    >
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl bg-sky-900/50" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 rounded bg-sky-900/50" />
          <Skeleton className="h-3 w-44 rounded bg-sky-900/30" />
        </div>
      </div>
      <div className="rounded-2xl border border-sky-300/20 bg-sky-900/40 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded bg-sky-900/50" />
          <Skeleton className="h-6 flex-1 rounded bg-sky-900/40" />
        </div>
        <Skeleton className="h-4 w-full rounded-full bg-sky-950" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24 rounded bg-sky-900/40" />
          <Skeleton className="h-4 w-20 rounded bg-sky-900/30" />
        </div>
      </div>
    </div>
  );
}

export function GoalWishlist({ childId }: GoalWishlistProps) {
  const { t } = useTranslation();
  const {
    isLoading,
    getActiveGoalForChild,
    getGoalsForChild,
    getWalletBalance,
    createGoal,
  } = usePocketMoney();

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [emoji, setEmoji] = useState<string>(emojiOptions[0]!);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // S5 (R4) — F10 6.6: collapse the swap form behind a "+ I want something
  // else!" toggle when an active goal exists. First-time / empty-goal kids
  // still see the form expanded so the very first goal is one tap away.
  const [showSwapForm, setShowSwapForm] = useState(false);

  // stop-test-1b: respect prefers-reduced-motion for the coin-rain overlay.
  // The pulse-gold class is already disabled by the existing CSS media
  // block (Wave 6), and the aria-live announcement always fires.
  const prefersReducedMotion = useReducedMotion();

  // stop-test-1b: track previous progress so the celebration fires once
  // per < 100 → ≥ 100 crossing, not on every re-render (locale toggle,
  // sibling Convex tick, etc.). Mirrors WeeklyTracker's Wave 2a pattern.
  const [celebratingFull, setCelebratingFull] = useState(false);
  const prevProgressRef = useRef<number>(0);
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announceTitleRef = useRef<string>("");

  const goals = getGoalsForChild(childId);
  const recentGoals = useMemo(
    () =>
      goals
        .filter((goal) => goal.status === "active")
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 3),
    [goals],
  );

  const saveBalance = getWalletBalance(childId, "save");
  const activeGoal = getActiveGoalForChild(childId);
  const target = activeGoal?.targetAmount ?? 0;
  const progress =
    target > 0 ? Math.min(100, Math.round((saveBalance / target) * 100)) : 0;
  const remaining = Math.max(0, target - saveBalance);
  const activeGoalTitle = activeGoal?.title ?? "";

  useEffect(() => {
    const prev = prevProgressRef.current;
    prevProgressRef.current = progress;
    if (prev < 100 && progress >= 100 && target > 0) {
      // Capture the goal title at crossing time so a downstream goal swap
      // doesn't change what we just announced.
      announceTitleRef.current = activeGoalTitle;
      // Defer the state write out of the effect body so we don't trigger a
      // synchronous cascading render — matches the queueMicrotask pattern
      // used by WeeklyTracker's Wave 2a celebration effect.
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
  }, [progress, target, activeGoalTitle]);

  useEffect(() => {
    return () => {
      if (celebrateTimerRef.current) {
        clearTimeout(celebrateTimerRef.current);
        celebrateTimerRef.current = null;
      }
    };
  }, []);

  // G2: skeleton while context hydrates. Placed after hooks so order stays stable.
  if (isLoading) return <GoalWishlistSkeleton />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const amount = Number(targetAmount);
    if (title.trim().length === 0) {
      setError(t("goal_error_title"));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t("goal_error_amount"));
      return;
    }

    setIsSaving(true);
    try {
      await createGoal({
        childId,
        title: title.trim(),
        targetAmount: Math.round(amount),
        emoji,
      });
      setTitle("");
      setTargetAmount("");
      setEmoji(emojiOptions[0]!); // safe: emojiOptions is a non-empty const array
      // S5 (R4) — F10 6.6: auto-collapse the form after a successful save so
      // the kid lands back on the (newly active) goal card instead of staring
      // at an empty form.
      setShowSwapForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("goal_error_generic"));
    } finally {
      setIsSaving(false);
    }
  };

  // S5 (R4) — F10 6.6: show the form whenever there's no active goal (so
  // first-time kids see one tap to a goal), OR when the kid taps the toggle.
  // Reusing the `activeGoal` already computed above.
  const showForm = !activeGoal || showSwapForm;

  return (
    <div className="mx-4 overflow-hidden rounded-2xl border border-sky-300/30 bg-sky-950/40 p-4 backdrop-blur-sm sm:mx-8">
      {/* stop-test-1b: coin-rain on goal-reached. Skipped under reduced motion
          — the aria-live announcement still fires below. */}
      {celebratingFull && !prefersReducedMotion && <GoalReachedCoinBurst />}
      {/* stop-test-1b: a11y announcement for the goal-reached crossing.
          Mirrors WeeklyTracker / LuckyChest patterns — hidden polite live
          region carries the same beat as the visual pulse + coin-burst. */}
      {celebratingFull && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          data-testid="goal-wishlist-a11y-announce"
        >
          {t("goal_reached_announce", {
            goalTitle: announceTitleRef.current,
          })}
        </div>
      )}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-100">
          <Target className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-sky-100">
            {t("goal_title")}
          </h2>
          <p className="text-sm text-sky-100/70">{t("goal_subtitle")}</p>
        </div>
      </div>

      {activeGoal ? (
        <div className="rounded-2xl border border-sky-300/20 bg-sky-900/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-4xl">{activeGoal.emoji}</span>
              <div className="min-w-0">
                <h3 className="truncate text-xl font-extrabold text-white">
                  {activeGoal.title}
                </h3>
                <p className="text-sm text-sky-100/70">
                  {t("goal_save_balance", {
                    amount: saveBalance.toLocaleString(),
                  })}
                </p>
              </div>
            </div>
            <p className="shrink-0 text-right text-sm font-bold text-sky-100">
              {CURRENCY}
              {activeGoal.targetAmount.toLocaleString()}
            </p>
          </div>

          <div
            className={`mt-4 h-4 overflow-hidden rounded-full bg-sky-950 ${
              celebratingFull ? "animate-pulse-gold" : ""
            }`}
            data-testid="goal-wishlist-progress"
            data-celebrating={celebratingFull ? "true" : "false"}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-300 to-emerald-300 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-sky-100">
              {progress}% {t("goal_funded")}
            </span>
            <span className="text-sky-100/70">
              {remaining === 0
                ? t("goal_ready")
                : t("goal_remaining", {
                    amount: remaining.toLocaleString(),
                  })}
            </span>
          </div>

          {/* F14a: Big-dream hint — when the goal is still >10x what's saved,
              show a gentle encouraging note instead of letting the progress
              bar look impossible. No fear, no penalty — just reassurance. */}
          {remaining > saveBalance * 10 && saveBalance >= 0 && (
            <p
              data-testid="goal-big-dream-hint"
              className="mt-3 rounded-xl bg-sky-500/10 px-3 py-2 text-xs text-sky-100/80"
            >
              <BudouXText>{t("goal_big_dream_hint")}</BudouXText>
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-900/40 px-6 py-10 text-center">
          <span className="text-5xl">🎯</span>
          <p className="text-lg font-bold text-sky-100">
            {t("goals_empty_title")}
          </p>
          <p className="text-sm text-sky-100/70">{t("goals_empty_hint")}</p>
        </div>
      )}

      {/* S5 (R4) — F10 6.6: when an active goal exists, collapse the swap form
          behind a "+ I want something else!" toggle. The kid still sees the
          form expanded on first-goal flow (no active goal) so the path to
          their FIRST goal is one tap. */}
      {activeGoal && (
        <button
          type="button"
          onClick={() => setShowSwapForm((prev) => !prev)}
          data-testid="goal-new-toggle"
          aria-expanded={showSwapForm}
          className="mt-4 w-full rounded-xl border-2 border-dashed border-sky-300/30 bg-sky-950/30 py-3 text-sm font-bold text-sky-100/80 transition-all hover:border-sky-200/50 hover:bg-sky-900/40 hover:text-sky-100"
        >
          {showSwapForm
            ? t("goal_new_toggle_close")
            : t("goal_new_toggle_open")}
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-3"
          data-testid="goal-create-form"
        >
          {/* F20: form inputs h-11 (was h-9 default) so the kid hits them
              cleanly. Emoji tiles bumped from 40×40 to 44×44. Submit Button
              also min-h-11. */}
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 border-sky-300/30 bg-sky-950/40 text-sky-50 placeholder:text-sky-100/40"
              placeholder={t("goal_name_placeholder")}
            />
            <Input
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              inputMode="numeric"
              type="number"
              min={1}
              className="h-11 border-sky-300/30 bg-sky-950/40 text-sky-50 placeholder:text-sky-100/40"
              placeholder={t("goal_amount_placeholder")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {emojiOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEmoji(option)}
                // Wave 6 a11y — these tiles are emoji-only, so without an
                // aria-label a screen reader announces only the emoji glyph
                // (locale-dependent, often poorly). aria-pressed exposes the
                // toggle state so the user hears "selected" / "not selected".
                aria-label={t("a11y_pick_emoji", { emoji: option })}
                aria-pressed={emoji === option}
                data-testid={`goal-emoji-${option}`}
                className={`flex size-11 items-center justify-center rounded-xl border text-xl transition-all ${
                  emoji === option
                    ? "border-sky-200 bg-sky-500/30"
                    : "border-sky-300/20 bg-sky-950/30"
                }`}
              >
                {option}
              </button>
            ))}
            <Button
              type="submit"
              disabled={isSaving}
              className="ml-auto min-h-11 bg-sky-500 font-bold text-white hover:bg-sky-600 disabled:opacity-60"
            >
              {isSaving ? t("goal_saving") : t("goal_create")}
            </Button>
          </div>

          {activeGoal && (
            <p className="text-xs text-sky-100/70">
              <BudouXText
                text={t("goal_swap_reassurance", {
                  amount: saveBalance.toLocaleString(),
                  name: title.trim() || activeGoal.title,
                })}
              />
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
        </form>
      )}

      {recentGoals.length > 1 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {recentGoals.map((goal) => (
            <div
              key={goal._id}
              className="rounded-xl border border-sky-300/15 bg-sky-950/30 p-3"
            >
              <p className="truncate text-sm font-bold text-sky-100">
                {goal.emoji} {goal.title}
              </p>
              <p className="mt-1 text-xs text-sky-100/60">
                {CURRENCY}
                {goal.targetAmount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
