"use client";

import { useEffect, useState } from "react";
import { ChildId } from "@/types";
import { CURRENCY } from "@/lib/constants";

interface DolphinCelebrationProps {
  yenAmount: number;
  childId: ChildId;
  onClose: () => void;
}

interface Coin {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

export function DolphinCelebration({ yenAmount, childId, onClose }: DolphinCelebrationProps) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const generated: Coin[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      delay: Math.random() * 1,
      duration: 1.5 + Math.random() * 1.5,
    }));
    setCoins(generated);

    const textTimer = setTimeout(() => setShowText(true), 500);
    const closeTimer = setTimeout(onClose, 3500);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Coin rain */}
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="animate-coin-rain absolute text-3xl"
          style={{
            left: `${coin.left}%`,
            top: -40,
            animationDelay: `${coin.delay}s`,
            animationDuration: `${coin.duration}s`,
          }}
        >
          🪙
        </div>
      ))}

      {/* Jumping creature */}
      <div className="animate-dolphin-jump absolute" style={{ bottom: "30%" }}>
        <span className="text-8xl">
          {childId === "tyler" ? "🐬" : "🦈"}
        </span>
      </div>

      {/* Splash effect */}
      <div className="absolute animate-splash" style={{ bottom: "25%", left: "50%", transform: "translateX(-50%)" }}>
        <div className="h-16 w-16 rounded-full bg-blue-300/60" />
      </div>

      {/* Text overlay */}
      {showText && (
        <div className="animate-scale-bounce text-center">
          <p className="text-6xl font-extrabold text-white drop-shadow-lg sm:text-8xl">
            GREAT JOB!
          </p>
          <p className="mt-4 text-4xl font-bold text-amber-300 drop-shadow sm:text-5xl">
            {CURRENCY}{yenAmount}
          </p>
          <p className="mt-2 text-lg text-white/80">
            Waiting for Mummy or Daddy to check
          </p>
        </div>
      )}
    </div>
  );
}
