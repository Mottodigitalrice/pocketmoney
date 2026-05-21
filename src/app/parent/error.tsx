"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BudouXText } from "@/components/shared/BudouXText";
import { useTranslation } from "@/hooks/use-translation";

/**
 * Wave 2 — Parent segment error boundary.
 *
 * Scoped to `/parent/*` — isolates parent-dashboard mutations (approval,
 * overdraft, ownership, network) from the rest of the app so a failure in
 * the approval queue doesn't blow up the whole tree.
 *
 * Tone matches the global `error.tsx` (pirate-themed but reassuring). Dual
 * CTA: `reset()` to remount the failed segment, plus a Link back to the
 * parent home as a safe escape if retry keeps failing.
 *
 * Digest visibility follows the global boundary's Gap 7.1 pattern — render
 * the `<code>` block only when the runtime supplied a digest.
 */
export default function ParentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error(
      "[parent/error.tsx]",
      error.digest ?? "(no digest)",
      error,
    );
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-950 px-6 text-center">
      <div className="mx-auto max-w-md space-y-5">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-800/40 text-5xl">
          ⚠️
        </div>
        <h1 className="text-2xl font-extrabold text-amber-100">
          {t("error_segment_parent_title")}
        </h1>
        <p className="text-base text-amber-300/80">
          <BudouXText>{t("error_segment_parent_subtitle")}</BudouXText>
        </p>
        <div className="flex gap-3">
          <Button
            onClick={reset}
            className="flex-1 bg-amber-500 px-6 py-5 font-bold text-amber-950 hover:bg-amber-400"
          >
            {t("error_segment_parent_retry")}
          </Button>
          <Link href="/parent" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-amber-500 text-amber-100 hover:bg-amber-900/30"
            >
              {t("error_segment_parent_home")}
            </Button>
          </Link>
        </div>
        {error.digest && (
          <p
            data-testid="error-digest"
            className="pt-2 text-xs text-amber-400/60"
          >
            {t("error_digest_label")}{" "}
            <code className="select-all rounded bg-amber-900/40 px-1.5 py-0.5 font-mono text-amber-200/80">
              {error.digest}
            </code>
          </p>
        )}
      </div>
    </div>
  );
}
