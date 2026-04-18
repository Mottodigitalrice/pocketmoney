"use client";

import { SignUp } from "@clerk/nextjs";
import { OceanScene } from "@/components/features/ocean/OceanScene";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { hasClerkEnv } from "@/lib/env";
import { useTranslation } from "@/hooks/use-translation";

export default function SignUpPage() {
  const { t } = useTranslation();

  return (
    <OceanScene subtle showCreatures={false}>
      <div className="absolute right-4 top-4 z-30">
        <LanguageToggle />
      </div>

      <div className="flex min-h-dvh flex-col items-center justify-start px-4 pt-16 pb-12 sm:justify-center sm:pt-12">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-white drop-shadow-lg sm:text-4xl md:text-5xl">
            {t("auth_sign_up_title")}
          </h1>
          <p className="mt-2 text-lg text-amber-200/80 drop-shadow">
            {t("auth_sign_up_subtitle")}
          </p>
        </div>

        {hasClerkEnv ? (
          <SignUp
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-stone-900/90 border border-amber-800/40 shadow-2xl backdrop-blur-sm",
              },
            }}
          />
        ) : (
          <div className="rounded-2xl border border-amber-800/40 bg-stone-900/90 px-6 py-5 text-center text-amber-100 shadow-2xl backdrop-blur-sm">
            Clerk environment variables are required before sign-up can be used.
          </div>
        )}
      </div>
    </OceanScene>
  );
}
