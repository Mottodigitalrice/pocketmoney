"use client";

export function SharkAvatar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} width="120" height="120">
      {/* Body circle */}
      <circle cx="60" cy="60" r="45" fill="#607D8B" />
      {/* Belly */}
      <ellipse cx="60" cy="70" rx="30" ry="22" fill="#ECEFF1" />
      {/* Dorsal fin */}
      <path d="M55,15 L62,2 L68,15" fill="#546E7A" />
      {/* Side fins */}
      <path d="M18,65 L5,80 L22,72" fill="#546E7A" />
      <path d="M102,65 L115,80 L98,72" fill="#546E7A" />
      {/* Eyes - big and friendly */}
      <circle cx="42" cy="48" r="10" fill="white" />
      <circle cx="44" cy="48" r="6" fill="#263238" />
      <circle cx="46" cy="46" r="2.5" fill="white" />
      <circle cx="78" cy="48" r="10" fill="white" />
      <circle cx="80" cy="48" r="6" fill="#263238" />
      <circle cx="82" cy="46" r="2.5" fill="white" />
      {/* Big toothy grin */}
      <path d="M38,72 Q60,88 82,72" stroke="#263238" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Teeth */}
      <path d="M42,72 L44,77 L46,72" fill="white" stroke="#263238" strokeWidth="0.5" />
      <path d="M50,74 L52,79 L54,74" fill="white" stroke="#263238" strokeWidth="0.5" />
      <path d="M58,75 L60,80 L62,75" fill="white" stroke="#263238" strokeWidth="0.5" />
      <path d="M66,74 L68,79 L70,74" fill="white" stroke="#263238" strokeWidth="0.5" />
      <path d="M74,72 L76,77 L78,72" fill="white" stroke="#263238" strokeWidth="0.5" />
      {/* Gills */}
      <line x1="28" y1="55" x2="28" y2="65" stroke="#546E7A" strokeWidth="1.5" />
      <line x1="24" y1="56" x2="24" y2="64" stroke="#546E7A" strokeWidth="1.5" />
      <line x1="92" y1="55" x2="92" y2="65" stroke="#546E7A" strokeWidth="1.5" />
      <line x1="96" y1="56" x2="96" y2="64" stroke="#546E7A" strokeWidth="1.5" />
    </svg>
  );
}
