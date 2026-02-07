"use client";

import { useEffect, useState } from "react";
import { CURRENCY } from "@/lib/constants";

interface TreasureChestAnimationProps {
  totalYen: number;
  onClose: () => void;
}

interface FlyingCoin {
  id: number;
  left: number;
  delay: number;
  size: number;
}

export function TreasureChestAnimation({ totalYen, onClose }: TreasureChestAnimationProps) {
  const [coins, setCoins] = useState<FlyingCoin[]>([]);
  const [showTotal, setShowTotal] = useState(false);
  const [countUp, setCountUp] = useState(0);

  useEffect(() => {
    setCoins(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        delay: Math.random() * 1.5,
        size: 20 + Math.random() * 20,
      }))
    );

    const showTimer = setTimeout(() => setShowTotal(true), 800);

    return () => clearTimeout(showTimer);
  }, []);

  // Count-up effect
  useEffect(() => {
    if (!showTotal) return;
    if (totalYen === 0) { setCountUp(0); return; }

    const steps = 20;
    const increment = totalYen / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= totalYen) {
        setCountUp(totalYen);
        clearInterval(interval);
      } else {
        setCountUp(Math.floor(current));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [showTotal, totalYen]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-amber-900/90 to-amber-950/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Flying coins */}
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="animate-coin-rain absolute"
          style={{
            left: `${coin.left}%`,
            top: -50,
            fontSize: coin.size,
            animationDelay: `${coin.delay}s`,
            animationDuration: `${2 + Math.random()}s`,
          }}
        >
          🪙
        </div>
      ))}

      {/* Treasure chest */}
      <div className="animate-scale-bounce mb-8 text-center">
        <span className="text-9xl">🧳</span>
      </div>

      {/* Total */}
      {showTotal && (
        <div className="animate-scale-bounce text-center" style={{ animationDelay: "0.3s" }}>
          <p className="text-2xl font-bold text-amber-300">Your Treasure</p>
          <p className="mt-2 text-7xl font-extrabold text-white drop-shadow-lg sm:text-8xl">
            {CURRENCY}{countUp.toLocaleString()}
          </p>
          <p className="mt-4 text-lg text-amber-200/80">Tap anywhere to close</p>
        </div>
      )}
    </div>
  );
}
