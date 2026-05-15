"use client";

import { FormEvent, useMemo, useState } from "react";
import { Target } from "lucide-react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CURRENCY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudouXText } from "@/components/shared/BudouXText";

interface GoalWishlistProps {
  childId: string;
}

const emojiOptions = ["🎮", "⚽", "🧸", "📚", "🚲", "🎧", "🎁", "🏴‍☠️"];

export function GoalWishlist({ childId }: GoalWishlistProps) {
  const { t } = useTranslation();
  const {
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

  const saveBalance = getWalletBalance(childId, "save");
  const activeGoal = getActiveGoalForChild(childId);
  const goals = getGoalsForChild(childId);
  const target = activeGoal?.targetAmount ?? 0;
  const progress = target > 0 ? Math.min(100, Math.round((saveBalance / target) * 100)) : 0;
  const remaining = Math.max(0, target - saveBalance);

  const recentGoals = useMemo(
    () =>
      goals
        .filter((goal) => goal.status === "active")
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 3),
    [goals]
  );

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
    } catch (err) {
      setError(err instanceof Error ? err.message : t("goal_error_generic"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-4 overflow-hidden rounded-2xl border border-sky-300/30 bg-sky-950/40 p-4 backdrop-blur-sm sm:mx-8">
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

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-sky-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-300 to-emerald-300 transition-all duration-700"
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
          <p className="text-sm text-sky-100/70">
            {t("goals_empty_hint")}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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
