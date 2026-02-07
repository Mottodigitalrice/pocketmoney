"use client";

import { useEffect, useState } from "react";
import { CURRENCY, CHILD_ICON_CONFIG } from "@/lib/constants";
import { usePocketMoney } from "@/hooks/use-pocket-money";
import type { ChildIcon } from "@/types";
import { useTranslation } from "@/hooks/use-translation";

interface DolphinCelebrationProps {
  yenAmount: number;
  childId: string;
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
  const { t } = useTranslation();
  const { getChildById } = usePocketMoney();
  const child = getChildById(childId);
  const iconConfig = child ? CHILD_ICON_CONFIG[child.icon as ChildIcon] : null;

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
          {iconConfig?.emoji ?? "🐟"}
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
            {t("celebration_great_job")}
          </p>
          <p className="mt-4 text-4xl font-bold text-amber-300 drop-shadow sm:text-5xl">
            {CURRENCY}{yenAmount}
          </p>
          <p className="mt-2 text-lg text-white/80">
            {t("celebration_waiting")}
          </p>
        </div>
      )}
    </div>
  );
}
