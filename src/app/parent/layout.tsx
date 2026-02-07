"use client";

import { BubbleEffect } from "@/components/features/ocean/BubbleEffect";
import { WaveAnimation } from "@/components/features/ocean/WaveAnimation";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pirate-gradient relative min-h-screen overflow-hidden">
      <WaveAnimation position="top" />
      <BubbleEffect count={8} />
      <div className="relative z-20">{children}</div>
    </div>
  );
}
