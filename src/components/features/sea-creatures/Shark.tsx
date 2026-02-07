"use client";

export function Shark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 70" className={className} width="120" height="60">
      {/* Body */}
      <ellipse cx="70" cy="38" rx="50" ry="22" fill="#607D8B" />
      <ellipse cx="70" cy="40" rx="45" ry="15" fill="#78909C" />
      {/* Belly */}
      <ellipse cx="75" cy="46" rx="35" ry="10" fill="#ECEFF1" />
      {/* Dorsal fin */}
      <path d="M60,16 L70,2 L78,16" fill="#546E7A" />
      {/* Tail */}
      <path d="M20,30 L5,15 L12,38 L5,55 L20,45" fill="#546E7A" />
      {/* Pectoral fins */}
      <path d="M85,48 L100,62 L80,55" fill="#546E7A" />
      <path d="M55,48 L40,62 L60,55" fill="#546E7A" />
      {/* Head shape */}
      <ellipse cx="110" cy="38" rx="20" ry="16" fill="#607D8B" />
      {/* Nose */}
      <ellipse cx="125" cy="38" rx="8" ry="10" fill="#6B8C99" />
      {/* Eye */}
      <circle cx="112" cy="32" r="5" fill="white" />
      <circle cx="113" cy="32" r="3" fill="#263238" />
      <circle cx="114" cy="31" r="1" fill="white" />
      {/* Big smile with teeth */}
      <path d="M108,44 Q118,52 128,42" stroke="#263238" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Teeth */}
      <path d="M112,44 L113,47 L114,44" fill="white" stroke="#263238" strokeWidth="0.5" />
      <path d="M117,46 L118,49 L119,46" fill="white" stroke="#263238" strokeWidth="0.5" />
      <path d="M122,45 L123,48 L124,45" fill="white" stroke="#263238" strokeWidth="0.5" />
      {/* Gills */}
      <line x1="95" y1="30" x2="95" y2="42" stroke="#546E7A" strokeWidth="1" />
      <line x1="92" y1="31" x2="92" y2="41" stroke="#546E7A" strokeWidth="1" />
      <line x1="89" y1="32" x2="89" y2="40" stroke="#546E7A" strokeWidth="1" />
    </svg>
  );
}
