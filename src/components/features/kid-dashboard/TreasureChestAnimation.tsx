"use client";

import { useEffect, useState } from "react";
import { CURRENCY } from "@/lib/constants";
import { useTranslation } from "@/hooks/use-translation";

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

interface Sparkle {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export function TreasureChestAnimation({
  totalYen,
  onClose,
}: TreasureChestAnimationProps) {
  const [coins, setCoins] = useState<FlyingCoin[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [showTotal, setShowTotal] = useState(false);
  const [countUp, setCountUp] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    setCoins(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        delay: Math.random() * 1.5,
        size: 20 + Math.random() * 20,
      }))
    );

    setSparkles(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 80,
        y: 20 + Math.random() * 50,
        delay: Math.random() * 3,
        duration: 1 + Math.random() * 2,
      }))
    );

    const showTimer = setTimeout(() => setShowTotal(true), 800);
    return () => clearTimeout(showTimer);
  }, []);

  // Count-up effect
  useEffect(() => {
    if (!showTotal) return;
    if (totalYen === 0) {
      setCountUp(0);
      return;
    }

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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      onClick={onClose}
    >
      {/* Ocean sky background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-cyan-500 to-blue-800" />

      {/* Sun glow */}
      <div
        className="absolute left-1/2 top-[-80px] h-[280px] w-[280px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,223,100,0.8) 0%, transparent 70%)",
        }}
      />

      {/* Flying coins */}
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="animate-coin-rain absolute z-20"
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

      {/* Sparkles */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="animate-sparkle absolute z-30"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path
              d="M10 0L12 7.5L20 10L12 12.5L10 20L7.5 12.5L0 10L7.5 7.5Z"
              fill="#FFE44D"
              opacity="0.9"
            />
          </svg>
        </div>
      ))}

      {/* Treasure island scene */}
      <div className="animate-scale-bounce relative z-10 mb-2">
        <div className="h-64 w-72 sm:h-80 sm:w-96">
          <TreasureIslandScene />
        </div>
      </div>

      {/* Total */}
      {showTotal && (
        <div
          className="animate-scale-bounce relative z-30 text-center"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="text-2xl font-bold text-amber-300 drop-shadow-lg">
            {t("treasure_your_treasure")}
          </p>
          <p
            className="mt-2 text-7xl font-extrabold text-white sm:text-8xl"
            style={{
              textShadow:
                "0 0 30px rgba(255,215,0,0.5), 0 4px 8px rgba(0,0,0,0.3)",
            }}
          >
            {CURRENCY}
            {countUp.toLocaleString()}
          </p>
          <p className="mt-4 text-lg text-white/70">
            {t("treasure_tap_to_close")}
          </p>
        </div>
      )}

      {/* Ocean waves at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-20">
        <svg
          viewBox="0 0 1440 120"
          className="animate-wave-slow absolute bottom-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C360,80 720,0 1080,40 C1260,60 1440,20 1440,20 L1440,120 L0,120 Z"
            fill="rgba(10,36,99,0.5)"
          />
        </svg>
        <svg
          viewBox="0 0 1440 120"
          className="animate-wave absolute bottom-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C240,20 480,80 720,40 C960,0 1200,60 1440,40 L1440,120 L0,120 Z"
            fill="rgba(30,87,153,0.4)"
          />
        </svg>
      </div>
    </div>
  );
}

function TreasureIslandScene() {
  return (
    <svg
      viewBox="0 0 320 280"
      className="h-full w-full drop-shadow-2xl"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FAEBD7" />
          <stop offset="100%" stopColor="#D2B48C" />
        </linearGradient>
        <linearGradient id="chestBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A0522D" />
          <stop offset="100%" stopColor="#5C2E00" />
        </linearGradient>
        <linearGradient id="chestLid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C0703C" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>
      </defs>

      {/* Gold glow behind everything */}
      <ellipse cx="160" cy="155" rx="130" ry="110" fill="url(#goldGlow)" />

      {/* Water ring around island */}
      <ellipse cx="160" cy="250" rx="155" ry="28" fill="#3A7BD5" opacity="0.5" />
      <ellipse cx="160" cy="252" rx="148" ry="24" fill="#5BC0EB" opacity="0.3" />

      {/* Sandy island */}
      <ellipse cx="160" cy="242" rx="125" ry="35" fill="url(#sandGrad)" />
      <ellipse cx="160" cy="238" rx="110" ry="26" fill="#FAEBD7" />

      {/* Palm tree */}
      <path
        d="M72,240 Q60,182 68,118"
        fill="none"
        stroke="#8B6914"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M72,240 Q60,182 68,118"
        fill="none"
        stroke="#A07A1A"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Leaves */}
      <path
        d="M68,118 Q30,98 8,120"
        fill="none"
        stroke="#228B22"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M68,118 Q45,80 20,74"
        fill="none"
        stroke="#2E8B2E"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M68,118 Q85,80 108,82"
        fill="none"
        stroke="#228B22"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M68,118 Q95,94 115,102"
        fill="none"
        stroke="#2E8B2E"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M68,118 Q52,88 38,92"
        fill="none"
        stroke="#1E7B1E"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Coconuts */}
      <circle cx="66" cy="121" r="4" fill="#8B4513" />
      <circle cx="73" cy="123" r="3.5" fill="#6B3410" />

      {/* Scattered coins on sand */}
      <ellipse cx="100" cy="234" rx="8" ry="3" fill="#FFD700" stroke="#B8860B" strokeWidth="0.8" />
      <ellipse cx="215" cy="236" rx="7" ry="3" fill="#FFC800" stroke="#B8860B" strokeWidth="0.8" />
      <ellipse cx="240" cy="240" rx="7" ry="3" fill="#FFD700" stroke="#B8860B" strokeWidth="0.8" />
      <ellipse cx="85" cy="240" rx="6" ry="2.5" fill="#FFE44D" stroke="#B8860B" strokeWidth="0.8" />
      <ellipse cx="200" cy="230" rx="8" ry="3" fill="#FFD700" stroke="#B8860B" strokeWidth="0.8" />

      {/* Gold pile under chest */}
      <ellipse cx="160" cy="218" rx="55" ry="18" fill="#DAA520" />
      <ellipse cx="160" cy="215" rx="50" ry="14" fill="#FFD700" />
      <ellipse cx="160" cy="212" rx="44" ry="10" fill="#FFE44D" />
      {/* Coins on pile */}
      <ellipse cx="135" cy="216" rx="9" ry="4" fill="#FFD700" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="185" cy="217" rx="9" ry="4" fill="#FFC800" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="155" cy="219" rx="8" ry="3.5" fill="#FFE44D" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="170" cy="213" rx="9" ry="4" fill="#FFD700" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="145" cy="221" rx="8" ry="3.5" fill="#FFC800" stroke="#B8860B" strokeWidth="0.6" />

      {/* === TREASURE CHEST === */}

      {/* Chest body */}
      <rect
        x="115"
        y="158"
        width="90"
        height="52"
        rx="4"
        fill="url(#chestBody)"
        stroke="#3D1F00"
        strokeWidth="2"
      />
      {/* Wood grain */}
      <line x1="115" y1="175" x2="205" y2="175" stroke="#4A2008" strokeWidth="0.7" opacity="0.4" />
      <line x1="115" y1="191" x2="205" y2="191" stroke="#4A2008" strokeWidth="0.7" opacity="0.4" />
      {/* Gold horizontal bands */}
      <rect x="112" y="156" width="96" height="5" rx="2" fill="#FFD700" stroke="#B8860B" strokeWidth="0.8" />
      <rect x="112" y="205" width="96" height="5" rx="2" fill="#FFD700" stroke="#B8860B" strokeWidth="0.8" />
      {/* Center vertical band */}
      <rect x="156" y="156" width="8" height="54" fill="#FFD700" stroke="#B8860B" strokeWidth="0.6" />
      {/* Lock plate */}
      <rect x="155" y="163" width="10" height="14" rx="2" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
      <circle cx="160" cy="172" r="2.5" fill="#B8860B" />
      <circle cx="160" cy="172" r="1.2" fill="#7A5A0A" />

      {/* Chest Lid - open, hinged at back */}
      <g transform="rotate(-42, 160, 158)">
        <path
          d="M115,158 L115,125 Q160,98 205,125 L205,158 Z"
          fill="url(#chestLid)"
          stroke="#3D1F00"
          strokeWidth="2"
        />
        {/* Lid wood grain */}
        <path d="M120,143 Q160,121 200,143" fill="none" stroke="#4A2008" strokeWidth="0.7" opacity="0.4" />
        {/* Gold bands on lid */}
        <rect x="112" y="153" width="96" height="5" rx="2" fill="#FFD700" stroke="#B8860B" strokeWidth="0.8" />
        <path d="M113,125 Q160,99 207,125" fill="none" stroke="#FFD700" strokeWidth="4" />
        <path d="M113,125 Q160,99 207,125" fill="none" stroke="#B8860B" strokeWidth="0.8" opacity="0.5" />
        {/* Vertical band on lid */}
        <rect x="156" y="109" width="8" height="49" rx="1.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.6" />
      </g>

      {/* Gold coins overflowing from chest */}
      <ellipse cx="130" cy="160" rx="9" ry="4" fill="#FFD700" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="150" cy="156" rx="8" ry="4" fill="#FFC800" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="170" cy="158" rx="9" ry="4" fill="#FFE44D" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="188" cy="161" rx="8" ry="3.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="140" cy="153" rx="8" ry="4" fill="#FFD700" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="162" cy="151" rx="8" ry="4" fill="#FFC800" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="120" cy="162" rx="7" ry="3.5" fill="#FFE44D" stroke="#B8860B" strokeWidth="0.6" />
      <ellipse cx="195" cy="163" rx="7" ry="3.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.6" />

      {/* Gems */}
      <polygon points="138,147 143,135 148,147" fill="#FF3B3B" stroke="#CC0000" strokeWidth="0.8" />
      <polygon points="168,143 173,131 178,143" fill="#50FF50" stroke="#006400" strokeWidth="0.8" />
      <polygon points="125,153 130,143 135,153" fill="#5070FF" stroke="#0000CC" strokeWidth="0.8" />
      {/* Diamond */}
      <polygon
        points="156,141 161,129 166,141 161,146"
        fill="#E8E8FF"
        stroke="#8888FF"
        strokeWidth="0.8"
      />
      {/* Pearl */}
      <circle cx="180" cy="149" r="4" fill="#FAFAFA" stroke="#DDD" strokeWidth="0.5" />
      <circle cx="178.5" cy="147.5" r="1.5" fill="white" opacity="0.8" />
    </svg>
  );
}
