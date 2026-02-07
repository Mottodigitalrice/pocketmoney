"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";

interface MathChallengeProps {
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

type Operator = "+" | "-";

interface Problem {
  a: number;
  b: number;
  operator: Operator;
  answer: number;
}

function generateProblem(): Problem {
  const operator: Operator = Math.random() > 0.5 ? "+" : "-";
  let a: number;
  let b: number;

  if (operator === "+") {
    a = Math.floor(Math.random() * 26) + 5; // 5-30
    b = Math.floor(Math.random() * 26) + 5; // 5-30
  } else {
    // For subtraction, ensure a > b so the answer is always positive
    a = Math.floor(Math.random() * 16) + 15; // 15-30
    b = Math.floor(Math.random() * 10) + 5; // 5-14
  }

  const answer = operator === "+" ? a + b : a - b;

  return { a, b, operator, answer };
}

export function MathChallenge({ open, onSuccess, onClose }: MathChallengeProps) {
  const { t } = useTranslation();
  const [problem, setProblem] = useState<Problem>(generateProblem);
  const [userAnswer, setUserAnswer] = useState("");
  const [error, setError] = useState(false);

  const resetChallenge = useCallback(() => {
    setProblem(generateProblem());
    setUserAnswer("");
    setError(false);
  }, []);

  // Reset when the dialog opens
  useEffect(() => {
    if (open) {
      resetChallenge();
    }
  }, [open, resetChallenge]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = parseInt(userAnswer, 10);
    if (isNaN(parsed)) {
      setError(true);
      return;
    }

    if (parsed === problem.answer) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      // Generate a new problem after a wrong answer
      setTimeout(() => {
        setProblem(generateProblem());
        setUserAnswer("");
      }, 1200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-amber-700/50 bg-amber-950 text-amber-100 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-amber-100">
            <span className="text-2xl">🏴‍☠️</span>{" "}
            <span className="text-xl">{t("math_challenge_title")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-center text-sm text-amber-300/70">
            {t("math_challenge_subtitle")}
          </p>

          {/* Math problem display */}
          <div className="flex items-center justify-center gap-3 rounded-xl border border-amber-700/30 bg-amber-900/40 p-6">
            <span className="text-4xl font-extrabold text-amber-100 drop-shadow-lg">
              {problem.a}
            </span>
            <span className="text-3xl font-bold text-amber-400">
              {problem.operator}
            </span>
            <span className="text-4xl font-extrabold text-amber-100 drop-shadow-lg">
              {problem.b}
            </span>
            <span className="text-3xl font-bold text-amber-400">=</span>
            <span className="text-3xl font-bold text-amber-400">?</span>
          </div>

          {/* Answer form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-amber-200">{t("math_challenge_placeholder")}</Label>
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => {
                  setUserAnswer(e.target.value);
                  setError(false);
                }}
                placeholder={t("math_challenge_placeholder")}
                className="mt-1 border-amber-700/50 bg-amber-900/50 text-center text-xl font-bold text-amber-100 placeholder:text-amber-500"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-center text-sm font-semibold text-red-400">
                {t("math_challenge_wrong")}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-amber-700/50 text-amber-300 hover:bg-amber-800/40"
              >
                {t("math_challenge_hint")}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-600 font-bold text-white hover:bg-amber-700"
              >
                {t("math_challenge_submit")}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
