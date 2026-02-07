"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { OceanScene } from "@/components/features/ocean/OceanScene";
import { CharacterCard } from "@/components/features/character-select/CharacterCard";
import { PirateAvatar } from "@/components/features/avatars/PirateAvatar";
import { SharkAvatar } from "@/components/features/avatars/SharkAvatar";
import { DolphinAvatar } from "@/components/features/avatars/DolphinAvatar";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { MathChallenge } from "@/components/features/parent-dashboard/MathChallenge";
import { useTranslation } from "@/hooks/use-translation";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import { ROUTES, CHILD_ICON_CONFIG } from "@/lib/constants";
import type { ChildIcon } from "@/types";

function ChildAvatar({ icon }: { icon: string }) {
  switch (icon) {
    case "shark":
      return <SharkAvatar />;
    case "dolphin":
      return <DolphinAvatar />;
    default: {
      const config = CHILD_ICON_CONFIG[icon as ChildIcon];
      const emoji = config?.emoji ?? "🐟";
      return (
        <div className="flex h-full w-full items-center justify-center text-6xl">
          {emoji}
        </div>
      );
    }
  }
}

export default function HomePage() {
  const { t } = useTranslation();
  const { familyChildren, isLoading, userId } = usePocketMoney();
  const router = useRouter();
  const { signOut } = useClerk();
  const [mathOpen, setMathOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push(ROUTES.signIn);
  };

  // Redirect to onboarding if user is logged in but has no children
  useEffect(() => {
    if (!isLoading && userId && familyChildren.length === 0) {
      router.push(ROUTES.onboarding);
    }
  }, [isLoading, userId, familyChildren.length, router]);

  const handleMathSuccess = () => {
    setMathOpen(false);
    router.push(ROUTES.parent);
  };

  // Show nothing while checking onboarding status
  if (isLoading || (userId && familyChildren.length === 0)) {
    return (
      <OceanScene>
        <div className="flex min-h-screen items-center justify-center">
          <p className="animate-pulse text-2xl text-white/60">...</p>
        </div>
      </OceanScene>
    );
  }

  return (
    <OceanScene>
      {/* Logout button */}
      <div className="absolute left-4 top-4 z-30">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
        >
          <span className="text-base">🚪</span>
          <span className="hidden sm:inline">{t("auth_logout")}</span>
        </button>
      </div>

      {/* Language toggle */}
      <div className="absolute right-4 top-4 z-30">
        <LanguageToggle />
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Title */}
        <div className="mb-12 text-center">
          <h1 className="animate-float-up text-5xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-7xl">
            {t("app_name")}
          </h1>
          <p
            className="animate-float-up mt-4 text-xl font-medium text-white/80 drop-shadow"
            style={{ animationDelay: "0.2s" }}
          >
            {t("home_who_are_you")}
          </p>
        </div>

        {/* Character Cards */}
        <div
          className={`grid w-full max-w-4xl grid-cols-1 gap-8 ${
            familyChildren.length === 1
              ? "sm:grid-cols-2 max-w-2xl"
              : familyChildren.length === 2
              ? "sm:grid-cols-3"
              : "sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {/* Parent Card - click opens math gate */}
          <div className="animate-float-up" style={{ animationDelay: "0.3s" }}>
            <CharacterCard
              name={t("home_parent_name")}
              subtitle={t("home_parent_subtitle")}
              href="#"
              onClick={() => setMathOpen(true)}
              avatar={<PirateAvatar />}
              bgColor="bg-amber-900/80"
              borderColor="border-amber-600"
            />
          </div>

          {/* Dynamic Children Cards */}
          {familyChildren.map((child, idx) => {
            const iconConfig = CHILD_ICON_CONFIG[child.icon as ChildIcon];
            return (
              <div
                key={child._id}
                className="animate-float-up"
                style={{ animationDelay: `${0.5 + idx * 0.2}s` }}
              >
                <CharacterCard
                  name={child.name}
                  subtitle={iconConfig?.label ?? child.icon}
                  href={ROUTES.kid(child._id)}
                  avatar={<ChildAvatar icon={child.icon} />}
                  bgColor={iconConfig?.bgColor ?? "bg-blue-800/80"}
                  borderColor={iconConfig?.borderColor ?? "border-blue-400"}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Math Challenge Dialog */}
      <MathChallenge
        open={mathOpen}
        onSuccess={handleMathSuccess}
        onClose={() => setMathOpen(false)}
      />
    </OceanScene>
  );
}
