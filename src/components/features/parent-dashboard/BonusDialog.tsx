"use client";

import { FormEvent, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
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

interface BonusDialogProps {
  childId: string;
  childName: string;
}

export function BonusDialog({ childId, childName }: BonusDialogProps) {
  const { t } = useTranslation();
  const { awardBonus } = usePocketMoney();
  const [open, setOpen] = useState(false);
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
    setOpen(nextOpen);
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
      await awardBonus({
        childId,
        amount: Math.round(amountNumber),
        note: note.trim() || undefined,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("bonus_error_generic"));
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
      >
        <Sparkles className="size-4" />
        {t("bonus_open")}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="border-emerald-700/50 bg-emerald-950 text-emerald-100 sm:max-w-md">
          {/* F20: form wraps header/body/footer so the submit button in
              DialogFooter is part of the same form. DialogBody scrolls if
              the iOS keyboard squashes the viewport; DialogFooter stays
              fixed at the bottom with safe-area padding. */}
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
    </>
  );
}
