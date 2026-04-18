"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { PirateAvatar } from "@/components/features/avatars/PirateAvatar";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { Switch } from "@/components/ui/switch";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { useTranslation } from "@/hooks/use-translation";
import { hasClerkEnv } from "@/lib/env";
import { ROUTES } from "@/lib/constants";

export function ParentHeader() {
  if (!hasClerkEnv) {
    return <ParentHeaderInnerWithoutClerk />;
  }

  return <ParentHeaderInner />;
}

function ParentHeaderInner() {
  const { t } = useTranslation();
  const { captainCodeEnabled, setCaptainCodeEnabled } = usePocketMoney();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    await signOut();
    router.push(ROUTES.signIn);
  };

  const handleCaptainCodeToggle = (enabled: boolean) => {
    startTransition(() => {
      void setCaptainCodeEnabled(enabled);
    });
  };

  return (
    <header className="flex flex-col gap-4 border-b border-amber-800/30 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-amber-300/80 transition-colors hover:text-amber-200">
          <span className="text-2xl">🏠</span>
          <span className="hidden text-sm font-medium sm:inline">{t("parent_home")}</span>
        </Link>
        <LanguageToggle />
        <div className="flex items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 text-amber-200/90">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
              {t("parent_captain_code")}
            </p>
            <p className="text-[11px] text-amber-300/70">
              {captainCodeEnabled ? t("parent_captain_code_on") : t("parent_captain_code_off")}
            </p>
          </div>
          <Switch
            checked={captainCodeEnabled}
            disabled={isPending}
            onCheckedChange={handleCaptainCodeToggle}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-amber-300/80 transition-all hover:bg-white/20 hover:text-amber-200 active:scale-95"
        >
          <span className="text-base">🚪</span>
          <span className="hidden sm:inline">{t("auth_logout")}</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100 drop-shadow-lg sm:text-3xl">
            {t("parent_header_title")}
          </h1>
          <p className="text-right text-sm text-amber-300/70">
            {t("parent_header_subtitle")}
          </p>
        </div>
        <div className="h-12 w-12">
          <PirateAvatar />
        </div>
      </div>
    </header>
  );
}

function ParentHeaderInnerWithoutClerk() {
  const { t } = useTranslation();
  const { captainCodeEnabled, setCaptainCodeEnabled } = usePocketMoney();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    router.push(ROUTES.signIn);
  };

  const handleCaptainCodeToggle = (enabled: boolean) => {
    startTransition(() => {
      void setCaptainCodeEnabled(enabled);
    });
  };

  return (
    <header className="flex flex-col gap-4 border-b border-amber-800/30 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-amber-300/80 transition-colors hover:text-amber-200">
          <span className="text-2xl">🏠</span>
          <span className="hidden text-sm font-medium sm:inline">{t("parent_home")}</span>
        </Link>
        <LanguageToggle />
        <div className="flex items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 text-amber-200/90">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
              {t("parent_captain_code")}
            </p>
            <p className="text-[11px] text-amber-300/70">
              {captainCodeEnabled ? t("parent_captain_code_on") : t("parent_captain_code_off")}
            </p>
          </div>
          <Switch
            checked={captainCodeEnabled}
            disabled={isPending}
            onCheckedChange={handleCaptainCodeToggle}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-amber-300/80 transition-all hover:bg-white/20 hover:text-amber-200 active:scale-95"
        >
          <span className="text-base">🚪</span>
          <span className="hidden sm:inline">{t("auth_logout")}</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <div>
          <h1 className="text-2xl font-extrabold text-amber-100 drop-shadow-lg sm:text-3xl">
            {t("parent_header_title")}
          </h1>
          <p className="text-right text-sm text-amber-300/70">
            {t("parent_header_subtitle")}
          </p>
        </div>
        <div className="h-12 w-12">
          <PirateAvatar />
        </div>
      </div>
    </header>
  );
}
