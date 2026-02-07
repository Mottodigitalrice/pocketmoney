"use client";

import { useTranslation } from "@/hooks/use-translation";

export function LanguageToggle() {
  const { locale, toggleLocale } = useTranslation();

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
      aria-label={locale === "en" ? "日本語に切り替え" : "Switch to English"}
    >
      <span className="text-base">{locale === "en" ? "🇯🇵" : "🇬🇧"}</span>
      <span>{locale === "en" ? "日本語" : "English"}</span>
    </button>
  );
}
