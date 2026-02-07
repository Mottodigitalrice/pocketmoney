"use client";

export function Starfish({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} width="60" height="60">
      {/* Star shape */}
      <path
        d="M40,5 L47,28 L72,28 L52,42 L58,65 L40,52 L22,65 L28,42 L8,28 L33,28 Z"
        fill="#FF7043"
      />
      <path
        d="M40,12 L45,28 L65,30 L50,42 L55,60 L40,50 L25,60 L30,42 L15,30 L35,28 Z"
        fill="#FF8A65"
      />
      {/* Center */}
      <circle cx="40" cy="38" r="6" fill="#FFAB91" />
      {/* Eyes */}
      <circle cx="36" cy="35" r="3" fill="white" />
      <circle cx="37" cy="35" r="1.8" fill="#BF360C" />
      <circle cx="37.5" cy="34.5" r="0.6" fill="white" />
      <circle cx="44" cy="35" r="3" fill="white" />
      <circle cx="45" cy="35" r="1.8" fill="#BF360C" />
      <circle cx="45.5" cy="34.5" r="0.6" fill="white" />
      {/* Smile */}
      <path d="M37,41 Q40,44 43,41" stroke="#BF360C" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Bumps on arms */}
      <circle cx="40" cy="10" r="1" fill="#FFAB91" />
      <circle cx="65" cy="28" r="1" fill="#FFAB91" />
      <circle cx="55" cy="60" r="1" fill="#FFAB91" />
      <circle cx="25" cy="60" r="1" fill="#FFAB91" />
      <circle cx="15" cy="28" r="1" fill="#FFAB91" />
      {/* Cheeks */}
      <circle cx="33" cy="40" r="2" fill="#F48FB1" opacity="0.3" />
      <circle cx="47" cy="40" r="2" fill="#F48FB1" opacity="0.3" />
    </svg>
  );
}
