"use client";

import dynamic from "next/dynamic";
import { LightRays } from "./LightRays";

// F21: heavy/decorative components moved off the initial bundle. ssr: false
// because they're purely visual flourishes — flicker-on-load is acceptable.
const BubbleEffect = dynamic(
  () => import("./BubbleEffect").then((m) => ({ default: m.BubbleEffect })),
  { ssr: false }
);
const WaveAnimation = dynamic(
  () => import("./WaveAnimation").then((m) => ({ default: m.WaveAnimation })),
  { ssr: false }
);
const CreaturePool = dynamic(
  () =>
    import("../sea-creatures/CreaturePool").then((m) => ({
      default: m.CreaturePool,
    })),
  { ssr: false }
);

interface OceanSceneProps {
  children: React.ReactNode;
  subtle?: boolean;
  showCreatures?: boolean;
}

export function OceanScene({ children, subtle = false, showCreatures = true }: OceanSceneProps) {
  return (
    <div className="ocean-gradient relative min-h-screen overflow-x-hidden">
      <WaveAnimation position="top" />
      <LightRays />
      <BubbleEffect count={subtle ? 8 : 15} />
      {showCreatures && <CreaturePool />}
      {/* Sand floor */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 sand-floor opacity-30" />
      {/* Content */}
      <div className="relative z-20">{children}</div>
    </div>
  );
}
