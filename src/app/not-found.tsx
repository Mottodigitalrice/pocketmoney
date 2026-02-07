"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">{t("not_found_title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("not_found_description")}
        </p>
        <Link href="/">
          <Button className="mt-6">{t("not_found_go_home")}</Button>
        </Link>
      </div>
    </div>
  );
}
