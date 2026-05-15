"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BudouXText } from "@/components/shared/BudouXText";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";

export function LuckyChestSettings() {
  const { t } = useTranslation();
  const { luckyChestMaxAmount, setLuckyChestMaxAmount } = usePocketMoney();
  const [amount, setAmount] = useState(luckyChestMaxAmount);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAmount(luckyChestMaxAmount);
  }, [luckyChestMaxAmount]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await setLuckyChestMaxAmount(amount);
    } finally {
      setIsSaving(false);
    }
  };

  // S2 (R4) — F10 5.19: render the live amount in the schedule explainer so
  // parents understand both the timing (every Monday) and the live range. We
  // pin the *currently saved* amount (not the in-flight `amount` state) so the
  // explainer reflects what kids will actually roll until Save is pressed.
  const scheduleExplainer = t("lucky_chest_schedule_explainer", {
    max: luckyChestMaxAmount,
  });

  return (
    <div className="rounded-2xl border border-yellow-300/25 bg-yellow-950/20 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/20 text-yellow-100">
            <Gift className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-yellow-100">
              {t("lucky_chest_parent_title")}
            </h2>
            <p className="mt-1 text-sm text-yellow-100/70">
              <BudouXText>{t("lucky_chest_parent_subtitle")}</BudouXText>
            </p>
          </div>
        </div>

        <div className="flex w-full items-end gap-2 sm:w-auto">
          <div className="min-w-0 flex-1 sm:w-36">
            <Label className="text-yellow-100/80">
              {t("lucky_chest_max_label")}
            </Label>
            <Input
              type="number"
              min={0}
              step={10}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="mt-1 border-yellow-700/50 bg-yellow-950/40 text-yellow-50"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-yellow-500 font-bold text-yellow-950 hover:bg-yellow-400 disabled:opacity-60"
          >
            {isSaving ? "..." : t("lucky_chest_save")}
          </Button>
        </div>
      </div>
      {/* S2 (R4) — F10 5.19: schedule explainer. Reads the LIVE saved max so a
          parent sees the actual range kids will roll, not the in-flight unsaved
          value. */}
      <p
        className="mt-3 text-xs text-yellow-100/60"
        data-testid="lucky-chest-schedule-explainer"
      >
        <BudouXText>{scheduleExplainer}</BudouXText>
      </p>
    </div>
  );
}
