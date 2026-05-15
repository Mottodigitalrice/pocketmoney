"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * F12 — Destructive-action confirmation dialog.
 *
 * Built on top of the existing Dialog primitive (we don't ship AlertDialog
 * separately). Two CTAs: destructive primary + safe cancel. The destructive
 * button is styled red so the cost is visually unambiguous.
 *
 * Used by:
 *   - ChildManager (delete child — wallet + history + scheduled jobs)
 *   - JobManager   (delete job — orphans scheduled instances)
 */
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string | ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** Optional testid for the confirm button (defaults to "confirm-dialog-confirm"). */
  confirmTestId?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel,
  confirmTestId = "confirm-dialog-confirm",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid="confirm-dialog"
        className="border-red-700/40 bg-amber-950 text-amber-100 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-red-200">{title}</DialogTitle>
          <DialogDescription className="pt-2 text-sm text-amber-200/80">
            {body}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-testid="confirm-dialog-cancel"
            className="flex-1 border-amber-700/50 text-amber-200 hover:bg-amber-800/40"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            data-testid={confirmTestId}
            className="flex-1 bg-red-600 font-bold text-white hover:bg-red-700"
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
