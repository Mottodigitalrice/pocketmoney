"use client";

import { usePocketMoney } from "@/hooks/use-pocket-money";
import { CHILD_ICON_CONFIG } from "@/lib/constants";
import { SharkAvatar } from "@/components/features/avatars/SharkAvatar";
import { DolphinAvatar } from "@/components/features/avatars/DolphinAvatar";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useTranslation } from "@/hooks/use-translation";
import Link from "next/link";
import type { ChildIcon } from "@/types";

interface KidHeaderProps {
  childId: string;
}

function ChildHeaderAvatar({ icon }: { icon: string }) {
  switch (icon) {
    case "shark":
      return <SharkAvatar />;
    case "dolphin":
      return <DolphinAvatar />;
    default: {
      const config = CHILD_ICON_CONFIG[icon as ChildIcon];
      return (
        <div className="flex h-full w-full items-center justify-center text-4xl">
          {config?.emoji ?? "🐟"}
        </div>
      );
    }
  }
}

export function KidHeader({ childId }: KidHeaderProps) {
  const { getChildById } = usePocketMoney();
  const { t } = useTranslation();
  const child = getChildById(childId);

  if (!child) return null;

  const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];

  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
        >
          <span className="text-2xl">🏠</span>
          <span className="hidden text-sm font-medium sm:inline">
            {t("kid_home")}
          </span>
        </Link>
        <LanguageToggle />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12">
          <ChildHeaderAvatar icon={child.icon} />
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-extrabold text-white drop-shadow-lg sm:text-3xl">
            {t("kid_header_jobs", { name: child.name })}
          </h1>
          <p className="text-sm text-white/70">
            {iconConfig?.label ?? child.icon}
          </p>
        </div>
      </div>
    </header>
  );
}
