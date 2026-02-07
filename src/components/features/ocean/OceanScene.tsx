"use client";

import { BubbleEffect } from "./BubbleEffect";
import { WaveAnimation } from "./WaveAnimation";
import { CreaturePool } from "../sea-creatures/CreaturePool";

interface OceanSceneProps {
  children: React.ReactNode;
  subtle?: boolean;
  showCreatures?: boolean;
}

export function OceanScene({ children, subtle = false, showCreatures = true }: OceanSceneProps) {
  return (
    <div className="ocean-gradient relative min-h-screen overflow-hidden">
      <WaveAnimation position="top" />
      <BubbleEffect count={subtle ? 8 : 15} />
      {showCreatures && <CreaturePool />}
      {/* Sand floor */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 sand-floor opacity-30" />
      {/* Content */}
      <div className="relative z-20">{children}</div>
    </div>
  );
}
