"use client";

export function WaveAnimation({ position = "top" }: { position?: "top" | "bottom" }) {
  const isTop = position === "top";

  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 z-10 h-16 overflow-hidden ${
        isTop ? "top-0" : "bottom-0 rotate-180"
      }`}
    >
      <svg
        className="animate-wave absolute bottom-0 h-full"
        style={{ width: "200%" }}
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
      >
        <path
          d="M0,30 C240,50 480,10 720,30 C960,50 1200,10 1440,30 C1680,50 1920,10 2160,30 C2400,50 2640,10 2880,30 L2880,60 L0,60 Z"
          fill="rgba(255,255,255,0.15)"
        />
      </svg>
      <svg
        className="animate-wave-slow absolute bottom-0 h-full"
        style={{ width: "200%", animationDelay: "-3s" }}
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
      >
        <path
          d="M0,35 C200,15 440,45 720,25 C1000,5 1240,50 1440,35 C1640,15 1880,45 2160,25 C2440,5 2680,50 2880,35 L2880,60 L0,60 Z"
          fill="rgba(255,255,255,0.08)"
        />
      </svg>
    </div>
  );
}
