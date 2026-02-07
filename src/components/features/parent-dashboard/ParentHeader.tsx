"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { PirateAvatar } from "@/components/features/avatars/PirateAvatar";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useTranslation } from "@/hooks/use-translation";
import { ROUTES } from "@/lib/constants";

export function ParentHeader() {
  const { t } = useTranslation();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push(ROUTES.signIn);
  };

  return (
    <header className="flex items-center justify-between border-b border-amber-800/30 px-4 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-amber-300/80 transition-colors hover:text-amber-200">
          <span className="text-2xl">🏠</span>
          <span className="hidden text-sm font-medium sm:inline">{t("parent_home")}</span>
        </Link>
        <LanguageToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-amber-300/80 transition-all hover:bg-white/20 hover:text-amber-200 active:scale-95"
        >
          <span className="text-base">🚪</span>
          <span className="hidden sm:inline">{t("auth_logout")}</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
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
