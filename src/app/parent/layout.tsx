"use client";

import dynamic from "next/dynamic";

// F21: decorative ocean flourishes are below-the-fold and not critical for
// first paint. Lazy-load to keep the parent dashboard initial JS lean.
const BubbleEffect = dynamic(
  () =>
    import("@/components/features/ocean/BubbleEffect").then((m) => ({
      default: m.BubbleEffect,
    })),
  { ssr: false }
);
const WaveAnimation = dynamic(
  () =>
    import("@/components/features/ocean/WaveAnimation").then((m) => ({
      default: m.WaveAnimation,
    })),
  { ssr: false }
);

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pirate-gradient relative min-h-screen overflow-hidden">
      <WaveAnimation position="top" />
      <BubbleEffect count={8} />
      <div className="relative z-20">{children}</div>
    </div>
  );
}
