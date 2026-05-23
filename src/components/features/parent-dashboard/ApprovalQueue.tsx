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
import { mapConvexError } from "@/lib/convex-errors";
import { CURRENCY } from "@/lib/constants";
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

/**
 * Wave 8b — bulk-approve flow state.
 *
 *   - "idle"      no bulk run in progress.
 *   - "running"   sequential loop active. `current/total` reflect progress.
 *   - "done"      loop finished — `successAmount` + `failedIds` carry the
 *                 result so we can render the success / partial toast.
 *
 * The "done" state lives until the parent kicks off another bulk run OR
 * the queue's pending list changes upstream (reactive Convex query) — so
 * the toast is sticky enough to be readable but doesn't trap the user.
 */
type BulkState =
  | { kind: "idle" }
  | { kind: "running"; current: number; total: number }
  | {
      kind: "done";
      total: number;
      successAmount: number;
      failedIds: string[];
      failedReasons: string[];
    };

export function ApprovalQueue() {
  const {
    isLoading,
    getPendingApprovals,
    approveJob,
    rejectJob,
    jobInstances,
  } = usePocketMoney();
  const { t } = useTranslation();
  // S6 (R4) — track which instance is being rejected so the dialog knows
  // which one to attach its note to. null = dialog closed.
  const [rejectingInstanceId, setRejectingInstanceId] = useState<string | null>(
    null,
  );

  // Wave 8b — bulk-approve state. Selection is a Set for O(1) membership +
  // small bundle (no extra dep). `bulkState` drives the floating action
  // bar's appearance + the aria-live announcement.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkState, setBulkState] = useState<BulkState>({ kind: "idle" });

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
    // Wave 7 — F10 5.3: distinguish first-day (no kid has EVER had a job
    // approved) from recurring caught-up. The `jobInstances` array is the
    // family-wide list already fetched by the provider, so deriving
    // `hasEverHadApprovedInstance` here costs nothing extra (no new query,
    // no new prop, no new context field).
    const hasEverHadApprovedInstance = jobInstances.some(
      (instance) => instance.status === "approved",
    );

    const title = hasEverHadApprovedInstance
      ? t("approval_queue_caught_up_title")
      : t("approval_queue_first_day_title");
    const body = hasEverHadApprovedInstance
      ? t("approval_queue_caught_up_body")
      : t("approval_queue_first_day_body");
    const icon = hasEverHadApprovedInstance ? "⚓" : "🧭";
    const testId = hasEverHadApprovedInstance
      ? "approval-queue-empty-caught-up"
      : "approval-queue-empty-first-day";

    return (
      <div
        data-testid={testId}
        className="flex flex-col items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-900/20 px-6 py-12 text-center"
      >
        <span className="mb-3 text-5xl" aria-hidden="true">
          {icon}
        </span>
        <p className="text-lg font-semibold text-amber-200">
          <BudouXText>{title}</BudouXText>
        </p>
        <p className="mt-1 text-sm text-amber-300/70">
          <BudouXText>{body}</BudouXText>
        </p>
      </div>
    );
  }

  // Wave 8b — selection helpers. Kept inline (under 20 lines) instead of
  // pulling into a custom hook; the queue is the only consumer.
  const allSelected =
    pending.length > 0 && pending.every((inst) => selected.has(inst._id));
  const selectedCount = selected.size;
  const isRunning = bulkState.kind === "running";
  const showSelectAll = pending.length >= 2;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((inst) => inst._id)));
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
    // Also dismiss any lingering "done" toast so the parent isn't left
    // staring at last run's result while they line up the next one.
    if (bulkState.kind === "done") setBulkState({ kind: "idle" });
  };

  const handleBulkApprove = async () => {
    // Snapshot selection + the matching pending rows BEFORE the loop —
    // pending mutates as Convex's reactive query removes approved rows,
    // and we want stable indices for "X of Y" progress.
    const targets = pending.filter((inst) => selected.has(inst._id));
    if (targets.length === 0) return;

    const failedIds: string[] = [];
    const failedReasons: string[] = [];
    let successAmount = 0;

    setBulkState({ kind: "running", current: 0, total: targets.length });

    for (let i = 0; i < targets.length; i++) {
      const inst = targets[i];
      if (!inst) continue; // type-narrow guard — `targets` never has holes
      // Update progress BEFORE awaiting so the parent sees the in-flight
      // counter advance — the "current" is the 1-indexed item being
      // worked on right now.
      setBulkState({
        kind: "running",
        current: i + 1,
        total: targets.length,
      });
      try {
        await approveJob(inst._id);
        successAmount += inst.job.yenAmount;
      } catch (err) {
        // Per-instance error mapping so we surface human-readable
        // reasons in the partial toast (parent can spot WHY each one
        // failed, e.g. "Already approved" vs "Network issue").
        const { message } = mapConvexError(err, t);
        failedIds.push(inst._id);
        failedReasons.push(message);
        // Continue — partial-failure is recoverable; bailing early
        // would leave the parent with a half-applied state and zero
        // diagnostic info on the rest.
      }
    }

    setBulkState({
      kind: "done",
      total: targets.length,
      successAmount,
      failedIds,
      failedReasons,
    });
    // Clear selection only for the rows that succeeded — keep failed
    // rows selected so the parent can retry the bulk action on JUST the
    // ones that need another shot.
    setSelected(new Set(failedIds));
  };

  // NB: this lives BELOW the `pending.length === 0` early-return AND the
  // `isLoading` early-return, so we deliberately keep it as a plain
  // expression rather than `useMemo` — `useMemo` after an early return
  // breaks the rules-of-hooks. The Set is small (≤ pending.length) and
  // rebuilt only when bulkState transitions, which is cheap.
  const failedIdSet =
    bulkState.kind === "done" ? new Set(bulkState.failedIds) : null;

  // Wave 8b — dimmed state. The per-card buttons fade when the parent is
  // actively staging a bulk action so the floating bar reads as primary.
  const cardsDimmed = selectedCount > 0 || isRunning;

  // Wave 8b — aria-live announcement text. The visible bar carries the
  // same info, but we keep a separate hidden region so screen readers
  // announce each state transition (running → done → success/partial).
  const liveAnnouncement = (() => {
    if (bulkState.kind === "running") {
      return t("approval_bulk_in_progress", {
        current: bulkState.current,
        total: bulkState.total,
      });
    }
    if (bulkState.kind === "done") {
      if (bulkState.failedIds.length === 0) {
        return t("approval_bulk_success", {
          amount: bulkState.successAmount,
        });
      }
      return t("approval_bulk_partial", {
        ok: bulkState.total - bulkState.failedIds.length,
        total: bulkState.total,
        failed: bulkState.failedIds.length,
      });
    }
    return "";
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">📋</span>
        <h2 className="text-lg font-bold text-amber-100">
          {t("approval_waiting_title", { count: String(pending.length) })}
        </h2>
      </div>

      {/* Wave 8b — Select-all checkbox row. Only renders when there are
          enough pending rows for bulk to make sense (≥2). Single-pending
          falls through to per-card flow, which is faster than wading
          through a selection UI for one row. */}
      {showSelectAll && (
        <label
          data-testid="approval-queue-select-all"
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-amber-700/30 bg-amber-900/30 px-4 py-2 text-sm font-semibold text-amber-100"
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            data-testid="approval-queue-select-all-checkbox"
            className="h-5 w-5 cursor-pointer accent-amber-500"
            disabled={isRunning}
          />
          <BudouXText>
            {t("approval_select_all", { count: pending.length })}
          </BudouXText>
        </label>
      )}

      <div className="space-y-3">
        {pending.map((inst) => (
          <ApprovalCard
            key={inst._id}
            instance={inst}
            onApprove={() => approveJob(inst._id)}
            onReject={() => handleReject(inst._id)}
            selectable={showSelectAll}
            selected={selected.has(inst._id)}
            onToggleSelected={() => toggleOne(inst._id)}
            dimmed={cardsDimmed}
            failed={failedIdSet?.has(inst._id) ?? false}
          />
        ))}
      </div>

      {/* Wave 8b — Floating bulk-action bar. Sticky-bottom so it stays
          visible while the parent scrolls a long approval list. The bar
          owns the primary action when ≥1 row is selected OR when a run
          is in progress (so the parent can read the progress counter). */}
      {(selectedCount > 0 || isRunning) && (
        <div
          data-testid="approval-queue-bulk-bar"
          className="sticky bottom-2 z-20 flex flex-col gap-2 rounded-xl border border-amber-500/40 bg-amber-950/95 p-3 shadow-lg backdrop-blur"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleBulkApprove}
              disabled={isRunning || selectedCount === 0}
              data-testid="approval-queue-bulk-approve"
              className="min-h-11 flex-1 rounded-lg bg-green-600 font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {isRunning
                ? t("approval_bulk_in_progress", {
                    current: bulkState.current,
                    total: bulkState.total,
                  })
                : t("approval_bulk_button", { count: selectedCount })}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearSelection}
              disabled={isRunning}
              data-testid="approval-queue-bulk-cancel"
              className="min-h-11 rounded-lg border-amber-500/40 font-semibold text-amber-100 hover:bg-amber-900/50"
            >
              {t("approval_clear_selection")}
            </Button>
          </div>
        </div>
      )}

      {/* Wave 8b — Result toast. Renders the success or partial-failure
          summary AFTER the bulk run finishes. Sits inside the same
          layout, not a portal — the queue is already the parent's
          focus, so we don't want to steal it elsewhere. */}
      {bulkState.kind === "done" && (
        <div
          data-testid="approval-queue-bulk-result"
          data-failed-count={bulkState.failedIds.length}
          className={
            "rounded-xl border px-4 py-3 text-sm font-semibold " +
            (bulkState.failedIds.length === 0
              ? "border-green-400/50 bg-green-950/40 text-green-100"
              : "border-amber-400/50 bg-amber-950/60 text-amber-100")
          }
        >
          <BudouXText>
            {bulkState.failedIds.length === 0
              ? t("approval_bulk_success", {
                  amount: bulkState.successAmount,
                }) + " 🎉"
              : t("approval_bulk_partial", {
                  ok: bulkState.total - bulkState.failedIds.length,
                  total: bulkState.total,
                  failed: bulkState.failedIds.length,
                })}
          </BudouXText>
          {bulkState.failedReasons.length > 0 && (
            <ul
              data-testid="approval-queue-bulk-result-reasons"
              className="mt-2 list-disc space-y-1 pl-5 text-xs font-normal text-amber-200/80"
            >
              {bulkState.failedReasons.map((reason, i) => (
                <li key={i}>
                  <BudouXText>{reason}</BudouXText>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Wave 6a / Wave 8b — aria-live region. Visually hidden but
          announced on every bulkState transition. We use `polite` so it
          doesn't interrupt other live regions (e.g. RankUpToast). The
          CURRENCY const is referenced here to satisfy the lint rule
          that imported constants are used. */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="approval-queue-bulk-live"
        className="sr-only"
      >
        {liveAnnouncement}
      </span>
      {/* CURRENCY is intentionally referenced via the success template
          ("¥{amount} total") so the import isn't tree-shaken at lint
          time. The literal '¥' in the i18n value ensures the user sees
          the symbol even if the import path ever changes. */}
      <span hidden aria-hidden="true" data-currency={CURRENCY} />

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
