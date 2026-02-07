"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";

interface CharacterCardProps {
  name: string;
  subtitle: string;
  href: string;
  avatar: ReactNode;
  bgColor: string;
  borderColor: string;
}

export function CharacterCard({
  name,
  subtitle,
  href,
  avatar,
  bgColor,
  borderColor,
}: CharacterCardProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Link href={href} className="block">
      <div
        className={`animate-bob group relative cursor-pointer rounded-3xl border-4 p-6 transition-all duration-300 hover:scale-110 active:scale-95 ${bgColor} ${borderColor}`}
        style={{
          animationDelay: `${Math.random() * 2}s`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          transform: pressed ? "scale(0.95)" : undefined,
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-shimmer" />

        {/* Avatar */}
        <div className="relative mx-auto mb-4 flex h-32 w-32 items-center justify-center">
          {avatar}
        </div>

        {/* Name */}
        <h2 className="text-center text-2xl font-bold text-white drop-shadow-lg">
          {name}
        </h2>
        <p className="mt-1 text-center text-sm font-medium text-white/80">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}
