"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import { ReactNode } from "react";
import { useTranslation } from "@/hooks/use-translation";

const clerkAppearance = {
  variables: {
    colorPrimary: "#d97706",
    colorText: "#fef3c7",
    colorTextSecondary: "#fcd34d",
    colorBackground: "#1c1917",
    colorInputBackground: "#292524",
    colorInputText: "#fef3c7",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "bg-stone-900/90 border border-amber-800/40 shadow-2xl backdrop-blur-sm",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "bg-stone-800 border-amber-800/30 text-amber-100 hover:bg-stone-700",
    formButtonPrimary:
      "bg-amber-600 hover:bg-amber-500 text-white font-bold",
    formFieldLabel: "text-amber-200",
    formFieldInput:
      "bg-stone-800 border-amber-800/40 text-amber-100 focus:border-amber-500",
    footerActionLink: "text-amber-400 hover:text-amber-300",
    identityPreview: "bg-stone-800 border-amber-800/30",
    dividerLine: "bg-amber-800/30",
    dividerText: "text-amber-300/50",
    footer: "opacity-40",
  },
};

export function ClerkClientProvider({ children }: { children: ReactNode }) {
  const { locale } = useTranslation();

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <BaseClerkProvider
      appearance={clerkAppearance}
      localization={locale === "ja" ? jaJP : undefined}
    >
      {children}
    </BaseClerkProvider>
  );
}
