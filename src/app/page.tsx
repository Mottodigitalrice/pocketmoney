"use client";

import { OceanScene } from "@/components/features/ocean/OceanScene";
import { CharacterCard } from "@/components/features/character-select/CharacterCard";
import { PirateAvatar } from "@/components/features/avatars/PirateAvatar";
import { SharkAvatar } from "@/components/features/avatars/SharkAvatar";
import { DolphinAvatar } from "@/components/features/avatars/DolphinAvatar";
import { ROUTES } from "@/lib/constants";

export default function HomePage() {
  return (
    <OceanScene>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Title */}
        <div className="mb-12 text-center">
          <h1 className="animate-float-up text-5xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-7xl">
            PocketMoney
          </h1>
          <p className="animate-float-up mt-4 text-xl font-medium text-white/80 drop-shadow" style={{ animationDelay: "0.2s" }}>
            Who are you?
          </p>
        </div>

        {/* Character Cards */}
        <div className="grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="animate-float-up" style={{ animationDelay: "0.3s" }}>
            <CharacterCard
              name="Mummy & Daddy"
              subtitle="The Pirate Crew"
              href={ROUTES.parent}
              avatar={<PirateAvatar />}
              bgColor="bg-amber-900/80"
              borderColor="border-amber-600"
            />
          </div>

          <div className="animate-float-up" style={{ animationDelay: "0.5s" }}>
            <CharacterCard
              name="Jayden"
              subtitle="Great White Shark - Age 7"
              href={ROUTES.kid("jayden")}
              avatar={<SharkAvatar />}
              bgColor="bg-blue-800/80"
              borderColor="border-blue-400"
            />
          </div>

          <div className="animate-float-up" style={{ animationDelay: "0.7s" }}>
            <CharacterCard
              name="Tyler"
              subtitle="Dolphin - Age 4"
              href={ROUTES.kid("tyler")}
              avatar={<DolphinAvatar />}
              bgColor="bg-cyan-700/80"
              borderColor="border-cyan-400"
            />
          </div>
        </div>
      </div>
    </OceanScene>
  );
}
