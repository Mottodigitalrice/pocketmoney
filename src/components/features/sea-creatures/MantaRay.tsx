"use client";

export function MantaRay({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 80" className={className} width="120" height="64">
      {/* Wings */}
      <path
        d="M75,40 Q40,10 10,30 Q30,45 75,50 Q120,45 140,30 Q110,10 75,40"
        fill="#5C6BC0"
      />
      <path
        d="M75,42 Q45,20 20,32 Q35,43 75,48 Q115,43 130,32 Q105,20 75,42"
        fill="#7986CB"
      />
      {/* Body center */}
      <ellipse cx="75" cy="42" rx="18" ry="12" fill="#5C6BC0" />
      {/* Belly */}
      <ellipse cx="75" cy="45" rx="14" ry="8" fill="#E8EAF6" />
      {/* Head bumps (cephalic fins) */}
      <path d="M68,32 L62,20 Q65,28 68,32" fill="#5C6BC0" />
      <path d="M82,32 L88,20 Q85,28 82,32" fill="#5C6BC0" />
      {/* Eyes */}
      <circle cx="66" cy="36" r="3.5" fill="white" />
      <circle cx="67" cy="36" r="2" fill="#1A237E" />
      <circle cx="67.5" cy="35.5" r="0.7" fill="white" />
      <circle cx="84" cy="36" r="3.5" fill="white" />
      <circle cx="85" cy="36" r="2" fill="#1A237E" />
      <circle cx="85.5" cy="35.5" r="0.7" fill="white" />
      {/* Smile */}
      <path d="M70,46 Q75,50 80,46" stroke="#1A237E" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Tail */}
      <path d="M75,54 L75,72 L73,70 L77,70 L75,72" fill="#5C6BC0" />
      {/* Spots */}
      <circle cx="50" cy="35" r="2" fill="#9FA8DA" opacity="0.6" />
      <circle cx="100" cy="35" r="2" fill="#9FA8DA" opacity="0.6" />
      <circle cx="40" cy="40" r="1.5" fill="#9FA8DA" opacity="0.4" />
      <circle cx="110" cy="40" r="1.5" fill="#9FA8DA" opacity="0.4" />
    </svg>
  );
}
