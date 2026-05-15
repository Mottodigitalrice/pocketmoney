"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BudouXText } from "@/components/shared/BudouXText";
import { useTranslation } from "@/hooks/use-translation";

/**
 * F12 — Pirate-toned bilingual global error boundary.
 *
 * Tone is reassuring, not panicky — the PRD principle is "trust requires
 * that failures are SEEN" but for a kid+parent audience the seen failure
 * must still feel like the ship is in friendly waters.
 *
 * Single CTA back to safety ("Try Again" — which calls `reset()` to remount
 * the failed route segment). For diagnostics the `digest` is logged to the
 * console; we deliberately do not show it on screen here (see F10 Gap 7.1 —
 * a later change can surface it behind a small copy affordance).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    // Log digest + message for any error reporting tooling.
    console.error("[error.tsx]", error.digest ?? "(no digest)", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-950 px-6 text-center">
      <div className="mx-auto max-w-md space-y-5">
        {/* Pirate-themed but reassuring icon — a friendly anchor not a skull. */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-800/40 text-5xl">
          ⚓
        </div>
        <h1 className="text-2xl font-extrabold text-amber-100">
          {t("error_page_title")}
        </h1>
        <p className="text-base text-amber-300/80">
          <BudouXText>{t("error_page_subtitle")}</BudouXText>
        </p>
        <Button
          onClick={reset}
          className="bg-amber-500 px-8 py-6 text-lg font-bold text-amber-950 hover:bg-amber-400"
          size="lg"
        >
          {t("error_page_cta")}
        </Button>
      </div>
    </div>
  );
}
