"use client";

/**
 * Body of the BonusDialog — the form + dialog primitives + react-hook-form
 * imports. Split out so the parent dashboard can keep the trigger button
 * in the initial bundle while the form/dialog code is fetched only when the
 * dialog is actually opened.
 */

import { FormEvent, useMemo, useState } from "react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { BudouXText } from "@/components/shared/BudouXText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BonusDialogBodyProps {
  childId: string;
  childName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BonusDialogBody({
  childId,
  childName,
  open,
  onOpenChange,
}: BonusDialogBodyProps) {
  const { t } = useTranslation();
  const { awardBonus } = usePocketMoney();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const amountNumber = useMemo(() => Number(amount), [amount]);

  const reset = () => {
    setAmount("");
    setNote("");
    setError(null);
    setIsSaving(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setError(t("bonus_error_amount"));
      return;
    }

    setIsSaving(true);
    try {
      const trimmedNote = note.trim();
      await awardBonus({
        childId,
        amount: Math.round(amountNumber),
        ...(trimmedNote ? { note: trimmedNote } : {}),
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("bonus_error_generic"));
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-emerald-700/50 bg-emerald-950 text-emerald-100 sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle className="text-emerald-100">
              {t("bonus_title", { name: childName })}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-emerald-100">
                {t("bonus_amount")}
              </span>
              <Input
                inputMode="numeric"
                min={1}
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-11 border-emerald-700/40 bg-emerald-900/40 text-emerald-100"
                placeholder="100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-emerald-100">
                {t("bonus_note")}
              </span>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="border-emerald-700/40 bg-emerald-900/40 text-emerald-100"
                placeholder={t("bonus_note_placeholder")}
              />
            </label>

            <p className="rounded-xl border border-emerald-300/20 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-100/80">
              <BudouXText>{t("bonus_split_hint")}</BudouXText>
            </p>

            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSaving}
              className="min-h-11 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSaving ? t("bonus_saving") : t("bonus_submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
