"use client";

/**
 * WithdrawalDialog — F21 split:
 *   - Trigger button stays in the static parent-dashboard bundle.
 *   - The Radix Dialog + Select primitives + form body live in
 *     WithdrawalDialogBody.tsx and are fetched lazily on first open.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { WalletCards } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";

const WithdrawalDialogBody = dynamic(
  () =>
    import("./WithdrawalDialogBody").then((m) => ({
      default: m.WithdrawalDialogBody,
    })),
  { ssr: false },
);

interface WithdrawalDialogProps {
  childId: string;
  childName: string;
}

export function WithdrawalDialog({
  childId,
  childName,
}: WithdrawalDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const handleOpen = () => {
    setHasOpened(true);
    setOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleOpen}
        // H4 (Gap 5.15): screen readers hear "Withdraw from {child}'s wallet"
        // instead of just "Withdraw" — gives the action context.
        aria-label={t("withdrawal_open_for", { name: childName })}
        className="min-h-11 gap-2 bg-amber-600 font-bold text-white hover:bg-amber-700"
      >
        <WalletCards className="size-4" />
        {t("withdraw_open")}
      </Button>

      {hasOpened && (
        <WithdrawalDialogBody
          childId={childId}
          childName={childName}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
