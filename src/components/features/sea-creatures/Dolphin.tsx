"use client";

export function Dolphin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 70" className={className} width="110" height="55">
      {/* Body */}
      <path
        d="M30,40 Q50,20 90,28 Q120,32 130,38 Q120,50 90,48 Q50,52 30,40"
        fill="#42A5F5"
      />
      {/* Belly */}
      <path
        d="M40,42 Q60,38 90,38 Q115,40 125,40 Q115,48 90,46 Q60,48 40,42"
        fill="#E3F2FD"
      />
      {/* Dorsal fin */}
      <path d="M70,20 L78,5 L85,20" fill="#1E88E5" />
      {/* Tail flukes */}
      <path d="M25,35 L8,22 L18,38 L8,52 L25,42" fill="#1E88E5" />
      {/* Pectoral fin */}
      <path d="M90,45 L100,58 L85,50" fill="#1E88E5" />
      {/* Beak/snout */}
      <path d="M125,36 Q140,38 138,40 Q136,42 125,40" fill="#42A5F5" />
      {/* Eye */}
      <circle cx="115" cy="34" r="4.5" fill="white" />
      <circle cx="116" cy="34" r="2.8" fill="#0D47A1" />
      <circle cx="117" cy="33" r="1" fill="white" />
      {/* Big happy smile */}
      <path d="M118,40 Q125,46 135,39" stroke="#0D47A1" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Blowhole */}
      <ellipse cx="100" cy="26" rx="2" ry="1" fill="#1E88E5" />
      {/* Cheek blush */}
      <circle cx="120" cy="40" r="3" fill="#F48FB1" opacity="0.3" />
    </svg>
  );
}
