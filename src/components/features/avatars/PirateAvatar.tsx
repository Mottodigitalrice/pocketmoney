"use client";

export function PirateAvatar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} width="120" height="120">
      {/* Hat */}
      <path
        d="M20,45 Q25,15 60,10 Q95,15 100,45 L20,45"
        fill="#2C1810"
      />
      <path d="M15,45 L105,45 L100,50 L20,50 Z" fill="#3D2317" />
      {/* Skull and crossbones on hat */}
      <circle cx="60" cy="30" r="7" fill="#F5F5DC" />
      <circle cx="56" cy="28" r="1.5" fill="#2C1810" />
      <circle cx="64" cy="28" r="1.5" fill="#2C1810" />
      <path d="M57,33 Q60,36 63,33" stroke="#2C1810" strokeWidth="1" fill="none" />
      <path d="M50,35 L70,35" stroke="#F5F5DC" strokeWidth="2" />
      <path d="M52,32 L68,38" stroke="#F5F5DC" strokeWidth="2" />
      {/* Face */}
      <circle cx="60" cy="65" r="25" fill="#FFCC80" />
      {/* Eye patch */}
      <circle cx="47" cy="60" r="8" fill="#1A1A1A" />
      <line x1="47" y1="52" x2="80" y2="45" stroke="#1A1A1A" strokeWidth="2" />
      {/* Good eye */}
      <circle cx="73" cy="60" r="5" fill="white" />
      <circle cx="74" cy="60" r="3" fill="#4E342E" />
      <circle cx="75" cy="59" r="1" fill="white" />
      {/* Eyebrow */}
      <path d="M68,54 Q73,51 78,54" stroke="#4E342E" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Big pirate grin */}
      <path d="M48,75 Q60,85 72,75" stroke="#4E342E" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Gold tooth */}
      <rect x="58" y="75" width="4" height="4" fill="#FFD700" rx="1" />
      {/* Beard stubble dots */}
      <circle cx="45" cy="78" r="0.8" fill="#795548" />
      <circle cx="50" cy="82" r="0.8" fill="#795548" />
      <circle cx="55" cy="84" r="0.8" fill="#795548" />
      <circle cx="65" cy="84" r="0.8" fill="#795548" />
      <circle cx="70" cy="82" r="0.8" fill="#795548" />
      <circle cx="75" cy="78" r="0.8" fill="#795548" />
      {/* Bandana tails */}
      <path d="M15,48 Q10,55 8,65" stroke="#E53935" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M18,50 Q14,58 12,68" stroke="#E53935" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Earring */}
      <circle cx="35" cy="70" r="3" fill="none" stroke="#FFD700" strokeWidth="2" />
    </svg>
  );
}
