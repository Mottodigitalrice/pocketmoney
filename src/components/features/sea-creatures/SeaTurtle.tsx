"use client";

export function SeaTurtle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} width="100" height="67">
      {/* Shell */}
      <ellipse cx="60" cy="42" rx="35" ry="28" fill="#4CAF50" />
      <ellipse cx="60" cy="42" rx="30" ry="23" fill="#66BB6A" />
      {/* Shell pattern */}
      <path d="M45,30 Q60,25 75,30" stroke="#388E3C" strokeWidth="2" fill="none" />
      <path d="M42,42 Q60,35 78,42" stroke="#388E3C" strokeWidth="2" fill="none" />
      <path d="M45,52 Q60,48 75,52" stroke="#388E3C" strokeWidth="2" fill="none" />
      {/* Head */}
      <ellipse cx="95" cy="38" rx="14" ry="11" fill="#81C784" />
      {/* Eyes */}
      <circle cx="100" cy="34" r="3.5" fill="white" />
      <circle cx="101" cy="34" r="2" fill="#1B5E20" />
      <circle cx="101.5" cy="33.5" r="0.7" fill="white" />
      {/* Smile */}
      <path d="M98,40 Q102,44 106,40" stroke="#1B5E20" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Flippers */}
      <ellipse cx="38" cy="25" rx="15" ry="6" fill="#81C784" transform="rotate(-30 38 25)" />
      <ellipse cx="82" cy="25" rx="15" ry="6" fill="#81C784" transform="rotate(30 82 25)" />
      <ellipse cx="35" cy="58" rx="12" ry="5" fill="#81C784" transform="rotate(20 35 58)" />
      <ellipse cx="85" cy="58" rx="12" ry="5" fill="#81C784" transform="rotate(-20 85 58)" />
      {/* Tail */}
      <path d="M25,42 L15,40 L20,45 Z" fill="#81C784" />
    </svg>
  );
}
