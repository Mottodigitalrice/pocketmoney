"use client";

import { FormEvent, useState } from "react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { BudouXText } from "@/components/shared/BudouXText";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApprovalCard } from "./ApprovalCard";

/**
 * G2: ApprovalQueueSkeleton — 3 row placeholders (avatar + label + button).
 */
function ApprovalQueueSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="approval-queue-skeleton"
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Skeleton className="size-7 rounded bg-amber-900/40" />
        <Skeleton className="h-5 w-44 rounded bg-amber-900/40" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-amber-700/20 bg-amber-900/30 p-3"
          >
            <Skeleton className="size-10 rounded-full bg-amber-900/50" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 rounded bg-amber-900/40" />
              <Skeleton className="h-3 w-24 rounded bg-amber-900/30" />
            </div>
            <Skeleton className="h-10 w-20 rounded-xl bg-amber-900/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * S6 (R4) — F10 5.17: RejectNoteDialog replaces the prior `window.prompt`
 * with a styled Radix dialog. Reasons:
 *   - `window.prompt` is browser-chrome modal; visually breaks brand.
 *   - On iOS the prompt has no auto-capitalize / no resize / no submit
 *     affordance.
 *   - Screen-reader experience is inconsistent across browsers.
 *
 * The dialog still gates `onSubmit` on a non-empty trimmed note (same
 * contract as before) so the kid-side rejection-note UI never receives an
 * empty string. Cancel closes without firing the callback.
 */
interface RejectNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (note: string) => void;
}

function RejectNoteDialog({
  open,
  onOpenChange,
  onSubmit,
}: RejectNoteDialogProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [showError, setShowError] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setNote("");
      setShowError(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) {
      setShowError(true);
      return;
    }
    onSubmit(trimmed);
    // Caller flips the open flag — we just clear state for next open.
    setNote("");
    setShowError(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="border-amber-700/40 bg-amber-950 text-amber-100 sm:max-w-md"
        data-testid="reject-note-dialog"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle className="text-amber-100">
              {t("approval_reject_dialog_title")}
            </DialogTitle>
            <p className="mt-1 text-sm text-amber-200/80">
              <BudouXText>{t("approval_reject_dialog_subtitle")}</BudouXText>
            </p>
          </DialogHeader>

          <DialogBody className="space-y-3">
            <Textarea
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                if (showError && event.target.value.trim()) {
                  setShowError(false);
                }
              }}
              placeholder={t("approval_reject_dialog_placeholder")}
              className="min-h-24 border-amber-700/40 bg-amber-900/40 text-amber-50 placeholder:text-amber-100/40"
              data-testid="reject-note-textarea"
              aria-label={t("approval_reject_dialog_title")}
              autoFocus
            />
            {showError && (
              <p
                className="rounded-lg border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-200"
                data-testid="reject-note-empty-error"
              >
                {t("approval_reject_dialog_empty_error")}
              </p>
            )}
          </DialogBody>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="min-h-11 flex-1 text-amber-100 hover:bg-amber-900/50"
              data-testid="reject-note-cancel"
            >
              {t("approval_reject_dialog_cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 flex-1 bg-amber-600 font-bold text-white hover:bg-amber-700"
              data-testid="reject-note-submit"
            >
              {t("approval_reject_dialog_submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ApprovalQueue() {
  const { isLoading, getPendingApprovals, approveJob, rejectJob } =
    usePocketMoney();
  const { t } = useTranslation();
  // S6 (R4) — track which instance is being rejected so the dialog knows
  // which one to attach its note to. null = dialog closed.
  const [rejectingInstanceId, setRejectingInstanceId] = useState<string | null>(
    null,
  );

  if (isLoading) return <ApprovalQueueSkeleton />;

  const pending = getPendingApprovals();

  const handleReject = (instanceId: string) => {
    setRejectingInstanceId(instanceId);
  };

  const handleRejectSubmit = (note: string) => {
    if (rejectingInstanceId) {
      rejectJob(rejectingInstanceId, note);
    }
    setRejectingInstanceId(null);
  };

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-900/20 px-6 py-12 text-center">
        <span className="mb-3 text-5xl">⚓</span>
        <p className="text-lg font-semibold text-amber-200">
          {t("approvals_empty_title")}
        </p>
        <p className="mt-1 text-sm text-amber-300/70">
          <BudouXText>{t("approvals_empty_hint")}</BudouXText>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">📋</span>
        <h2 className="text-lg font-bold text-amber-100">
          {t("approval_waiting_title", { count: String(pending.length) })}
        </h2>
      </div>
      <div className="space-y-3">
        {pending.map((inst) => (
          <ApprovalCard
            key={inst._id}
            instance={inst}
            onApprove={() => approveJob(inst._id)}
            onReject={() => handleReject(inst._id)}
          />
        ))}
      </div>
      <RejectNoteDialog
        open={rejectingInstanceId !== null}
        onOpenChange={(open) => {
          if (!open) setRejectingInstanceId(null);
        }}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
}
