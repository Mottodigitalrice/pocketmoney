"use client";

/**
 * BonusDialog — F21 split:
 *   - Trigger button stays in the static parent-dashboard bundle.
 *   - The Radix Dialog + form body lives in BonusDialogBody.tsx and is
 *     fetched lazily the first time the parent clicks the trigger. This
 *     keeps awards-related code out of the initial parent dashboard JS.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";

const BonusDialogBody = dynamic(
  () =>
    import("./BonusDialogBody").then((m) => ({ default: m.BonusDialogBody })),
  { ssr: false }
);

interface BonusDialogProps {
  childId: string;
  childName: string;
}

export function BonusDialog({ childId, childName }: BonusDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // Once the user opens the dialog, keep the body mounted so we don't refetch
  // the chunk on subsequent reopens.
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
        // H4 (Gap 5.14): screen readers hear "Award bonus to {child}" instead
        // of just "Bonus" — gives the action context without changing visuals.
        aria-label={t("bonus_open_for", { name: childName })}
        className="min-h-11 gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
      >
        <Sparkles className="size-4" />
        {t("bonus_open")}
      </Button>

      {hasOpened && (
        <BonusDialogBody
          childId={childId}
          childName={childName}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
