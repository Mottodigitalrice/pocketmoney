"use client";

export function MantaRay({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 80" className={className} width="120" height="64">
      <defs>
        <style>{`
          @keyframes manta-wing-l { 0%,100%{transform:rotate(0deg) skewY(0deg)}50%{transform:rotate(-6deg) skewY(3deg)} }
          @keyframes manta-wing-r { 0%,100%{transform:rotate(0deg) skewY(0deg)}50%{transform:rotate(6deg) skewY(-3deg)} }
          @keyframes manta-tail { 0%,100%{transform:rotate(0deg)}30%{transform:rotate(6deg)}70%{transform:rotate(-6deg)} }
          @keyframes manta-ceph { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(5deg)} }
          @keyframes manta-blink { 0%,85%,100%{transform:scaleY(1)}92%{transform:scaleY(0.1)} }
        `}</style>
      </defs>
      {/* Left wing */}
      <g style={{ transformOrigin: "75px 40px", animation: "manta-wing-l 2s ease-in-out infinite" }}>
        <path d="M75,40 Q40,10 10,30 Q30,45 75,50" fill="#5C6BC0" />
        <path d="M75,42 Q45,20 20,32 Q35,43 75,48" fill="#7986CB" />
        <circle cx="50" cy="35" r="2" fill="#9FA8DA" opacity="0.6" />
        <circle cx="40" cy="40" r="1.5" fill="#9FA8DA" opacity="0.4" />
      </g>
      {/* Right wing */}
      <g style={{ transformOrigin: "75px 40px", animation: "manta-wing-r 2s ease-in-out infinite" }}>
        <path d="M75,40 Q110,10 140,30 Q120,45 75,50" fill="#5C6BC0" />
        <path d="M75,42 Q105,20 130,32 Q115,43 75,48" fill="#7986CB" />
        <circle cx="100" cy="35" r="2" fill="#9FA8DA" opacity="0.6" />
        <circle cx="110" cy="40" r="1.5" fill="#9FA8DA" opacity="0.4" />
      </g>
      {/* Body center */}
      <ellipse cx="75" cy="42" rx="18" ry="12" fill="#5C6BC0" />
      <ellipse cx="75" cy="45" rx="14" ry="8" fill="#E8EAF6" />
      {/* Head bumps (cephalic fins) */}
      <g style={{ transformOrigin: "65px 32px", animation: "manta-ceph 2.5s ease-in-out infinite" }}>
        <path d="M68,32 L62,20 Q65,28 68,32" fill="#5C6BC0" />
      </g>
      <g style={{ transformOrigin: "85px 32px", animation: "manta-ceph 2.5s ease-in-out infinite 0.2s" }}>
        <path d="M82,32 L88,20 Q85,28 82,32" fill="#5C6BC0" />
      </g>
      {/* Eyes */}
      <g style={{ transformOrigin: "67px 36px", animation: "manta-blink 5s ease-in-out infinite" }}>
        <circle cx="66" cy="36" r="3.5" fill="white" />
        <circle cx="67" cy="36" r="2" fill="#1A237E" />
        <circle cx="67.5" cy="35.5" r="0.7" fill="white" />
      </g>
      <g style={{ transformOrigin: "85px 36px", animation: "manta-blink 5s ease-in-out infinite 0.3s" }}>
        <circle cx="84" cy="36" r="3.5" fill="white" />
        <circle cx="85" cy="36" r="2" fill="#1A237E" />
        <circle cx="85.5" cy="35.5" r="0.7" fill="white" />
      </g>
      {/* Smile */}
      <path d="M70,46 Q75,50 80,46" stroke="#1A237E" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Tail */}
      <g style={{ transformOrigin: "75px 54px", animation: "manta-tail 1s ease-in-out infinite" }}>
        <path d="M75,54 L75,72 L73,70 L77,70 L75,72" fill="#5C6BC0" />
      </g>
    </svg>
  );
}
