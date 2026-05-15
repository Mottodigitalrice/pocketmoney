"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BudouXText } from "@/components/shared/BudouXText";
import { useTranslation } from "@/hooks/use-translation";

/**
 * F12 — Pirate-toned bilingual 404.
 *
 * "This map leads nowhere!" — playful, not punishing. CTA always sends the
 * user to `/`, where middleware bounces them to either `/landing` (signed
 * out) or character-select (signed in). Same wording works in both states.
 */
export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-950 px-6 text-center">
      <div className="mx-auto max-w-md space-y-5">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-800/40 text-5xl">
          🗺️
        </div>
        <h1 className="text-2xl font-extrabold text-amber-100">
          {t("not_found_page_title")}
        </h1>
        <p className="text-base text-amber-300/80">
          <BudouXText>{t("not_found_page_subtitle")}</BudouXText>
        </p>
        <Link href="/">
          <Button
            className="bg-amber-500 px-8 py-6 text-lg font-bold text-amber-950 hover:bg-amber-400"
            size="lg"
          >
            {t("not_found_page_cta")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
