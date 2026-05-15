"use client";

import { FormEvent, useMemo, useState } from "react";
import { WalletCards } from "lucide-react";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { CURRENCY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BudouXText } from "@/components/shared/BudouXText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WalletJar, WithdrawalReason } from "@/types";
import type { TranslationKey } from "@/lib/i18n/translations";

interface WithdrawalDialogProps {
  childId: string;
  childName: string;
}

const jarOptions: WalletJar[] = ["spend", "save", "give"];
const reasonOptions: WithdrawalReason[] = [
  "cashOut",
  "penalty",
  "correction",
  "other",
];
const jarLabelKeys: Record<WalletJar, TranslationKey> = {
  spend: "wallet_spend",
  save: "wallet_save",
  give: "wallet_give",
};
const reasonLabelKeys: Record<WithdrawalReason, TranslationKey> = {
  cashOut: "withdraw_reason_cashOut",
  penalty: "withdraw_reason_penalty",
  correction: "withdraw_reason_correction",
  other: "withdraw_reason_other",
};

export function WithdrawalDialog({
  childId,
  childName,
}: WithdrawalDialogProps) {
  const { t } = useTranslation();
  const { getWalletBalance, withdrawFromWallet } = usePocketMoney();
  const [open, setOpen] = useState(false);
  const [jar, setJar] = useState<WalletJar>("spend");
  const [reason, setReason] = useState<WithdrawalReason>("cashOut");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const balance = getWalletBalance(childId, jar);
  const amountNumber = useMemo(() => Number(amount), [amount]);

  const reset = () => {
    setJar("spend");
    setReason("cashOut");
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
      setError(t("withdraw_error_amount"));
      return;
    }
    if (amountNumber > balance) {
      setError(t("withdraw_error_balance"));
      return;
    }
    if (reason === "other" && note.trim().length === 0) {
      setError(t("withdraw_error_note"));
      return;
    }

    setIsSaving(true);
    try {
      await withdrawFromWallet({
        childId,
        jar,
        amount: Math.round(amountNumber),
        reason,
        note: note.trim() || undefined,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("withdraw_error_generic"));
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="gap-2 bg-amber-600 font-bold text-white hover:bg-amber-700"
      >
        <WalletCards className="size-4" />
        {t("withdraw_open")}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="border-amber-700/50 bg-amber-950 text-amber-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-100">
              {t("withdraw_title", { name: childName })}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-amber-200">
                  {t("withdraw_jar")}
                </span>
                <Select
                  value={jar}
                  onValueChange={(value) => setJar(value as WalletJar)}
                >
                  <SelectTrigger className="w-full border-amber-700/40 bg-amber-900/40 text-amber-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-amber-700/40 bg-amber-950 text-amber-100">
                    {jarOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(jarLabelKeys[option])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-amber-200">
                  {t("withdraw_amount")}
                </span>
                <Input
                  inputMode="numeric"
                  min={1}
                  max={balance}
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="border-amber-700/40 bg-amber-900/40 text-amber-100"
                  placeholder="500"
                />
              </label>
            </div>

            <div className="rounded-xl border border-amber-700/20 bg-amber-900/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/70">
                {t("withdraw_available")}
              </p>
              <p className="text-2xl font-extrabold text-amber-100">
                {CURRENCY}
                {balance.toLocaleString()}
              </p>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-amber-200">
                {t("withdraw_reason")}
              </span>
              <Select
                value={reason}
                onValueChange={(value) => setReason(value as WithdrawalReason)}
              >
                <SelectTrigger className="w-full border-amber-700/40 bg-amber-900/40 text-amber-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-amber-700/40 bg-amber-950 text-amber-100">
                  {reasonOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(reasonLabelKeys[option])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-amber-200">
                {t("withdraw_note")}
              </span>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="border-amber-700/40 bg-amber-900/40 text-amber-100"
                placeholder={t("withdraw_note_placeholder")}
              />
            </label>

            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                <BudouXText text={error} />
              </p>
            )}

            <Button
              type="submit"
              disabled={isSaving || balance <= 0}
              className="w-full bg-amber-600 font-bold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {isSaving ? t("withdraw_saving") : t("withdraw_submit")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
