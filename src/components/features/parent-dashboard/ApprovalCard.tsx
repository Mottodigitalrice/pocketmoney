"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Job, JobInstance } from "@/types";
import { Button } from "@/components/ui/button";
import { CURRENCY, CHILD_ICON_CONFIG } from "@/lib/constants";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import type { ChildIcon } from "@/types";
import type { TranslationKey } from "@/lib/i18n/translations";

interface ApprovalCardProps {
  instance: JobInstance & { job: Job };
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalCard({
  instance,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const { t, locale } = useTranslation();
  const { getChildById } = usePocketMoney();
  const child = getChildById(instance.childId);
  const iconConfig = child ? CHILD_ICON_CONFIG[child.icon as ChildIcon] : null;
  // F20 Goal D: tap-to-enlarge proof image. Opens a full-screen overlay
  // with ESC + tap-outside-image + close-button dismiss. Hand-rolled
  // portal-style overlay (fixed inset-0 z-[60]) rather than wrapping in
  // shadcn Dialog — we want minimum chrome, just the image and a close X.
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while the overlay is up so the underlying parent
    // dashboard doesn't move when the user pinches/pans the image.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [previewOpen]);

  const completedTime = instance.completedAt
    ? new Date(instance.completedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      data-testid="approval-card"
      data-instance-id={instance._id}
      data-child-id={instance.childId}
      data-job-id={instance.job._id}
      className="overflow-hidden rounded-xl border border-amber-700/30 bg-amber-900/40 p-4 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{instance.job.icon}</span>
          <div>
            <h3 className="font-bold text-amber-100">
              {instance.job.titleKey
                ? t(instance.job.titleKey as TranslationKey)
                : locale === "ja" && instance.job.titleJa
                  ? instance.job.titleJa
                  : instance.job.title}
            </h3>
            <p className="text-sm text-amber-300/70">
              {child?.name ?? "Unknown"} ({iconConfig?.emoji ?? "👤"}) -{" "}
              {completedTime}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-300">
          {CURRENCY}
          {instance.job.yenAmount}
        </span>
      </div>

      {instance.proofUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-sky-400/30 bg-sky-950/30">
          <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-bold text-sky-100">
            <div className="flex items-center gap-2">
              <span>📷</span>
              <span>{t("approval_photo_proof")}</span>
            </div>
            <span className="text-xs font-semibold text-sky-200/70">
              {t("approval_photo_tap_to_enlarge")}
            </span>
          </div>
          {/* F20 Goal D: image is now a tappable button. min-h-11 is
              already satisfied (image is max-h-80), but we explicitly
              flag it as a button so screen readers announce action. */}
          <button
            type="button"
            data-testid="approval-card-proof-button"
            onClick={() => setPreviewOpen(true)}
            aria-label={t("approval_photo_tap_to_enlarge")}
            className="block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <img
              src={instance.proofUrl}
              alt={t("approval_photo_proof_alt")}
              className="max-h-80 w-full object-cover"
            />
          </button>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          onClick={onApprove}
          className="min-h-11 flex-1 rounded-lg bg-green-600 font-bold text-white hover:bg-green-700"
        >
          {t("approval_approve")}
        </Button>
        <Button
          onClick={onReject}
          variant="outline"
          className="min-h-11 flex-1 rounded-lg border-red-500/50 font-bold text-red-400 hover:bg-red-500/10"
        >
          {t("approval_reject")}
        </Button>
      </div>

      {/* F20 Goal D — Full-screen proof preview overlay.
          ESC, tap-outside, and the close button all dismiss. */}
      {previewOpen && instance.proofUrl && (
        <div
          data-testid="approval-card-proof-preview"
          role="dialog"
          aria-modal="true"
          aria-label={t("approval_photo_proof_alt")}
          onClick={() => setPreviewOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
        >
          <button
            type="button"
            data-testid="approval-card-proof-preview-close"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewOpen(false);
            }}
            aria-label={t("approval_photo_preview_close")}
            // Top-right floating close — 44×44, safe-area-aware. Above
            // the image so it doesn't fight pinch/zoom on the image.
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={instance.proofUrl}
            alt={t("approval_photo_proof_alt")}
            // Stop click from bubbling to the overlay so the user can
            // tap the image itself without dismissing.
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
