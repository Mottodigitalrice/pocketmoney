"use client";

export function Starfish({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} width="60" height="60">
      <defs>
        <style>{`
          @keyframes star-breathe { 0%,100%{transform:scale(1)}50%{transform:scale(1.06)} }
          @keyframes star-wiggle { 0%,100%{transform:rotate(0deg)}25%{transform:rotate(3deg)}75%{transform:rotate(-3deg)} }
          @keyframes star-blink { 0%,87%,100%{transform:scaleY(1)}93%{transform:scaleY(0.1)} }
          @keyframes star-bump { 0%,100%{transform:scale(1)}50%{transform:scale(1.3)} }
        `}</style>
      </defs>
      {/* Star body — breathing + slight wiggle */}
      <g style={{ transformOrigin: "40px 40px", animation: "star-breathe 3s ease-in-out infinite" }}>
        <g style={{ transformOrigin: "40px 40px", animation: "star-wiggle 4s ease-in-out infinite" }}>
          <path d="M40,5 L47,28 L72,28 L52,42 L58,65 L40,52 L22,65 L28,42 L8,28 L33,28 Z" fill="#FF7043" />
          <path d="M40,12 L45,28 L65,30 L50,42 L55,60 L40,50 L25,60 L30,42 L15,30 L35,28 Z" fill="#FF8A65" />
        </g>
      </g>
      {/* Center */}
      <circle cx="40" cy="38" r="6" fill="#FFAB91" />
      {/* Eyes */}
      <g style={{ transformOrigin: "37px 35px", animation: "star-blink 5s ease-in-out infinite" }}>
        <circle cx="36" cy="35" r="3" fill="white" />
        <circle cx="37" cy="35" r="1.8" fill="#BF360C" />
        <circle cx="37.5" cy="34.5" r="0.6" fill="white" />
      </g>
      <g style={{ transformOrigin: "45px 35px", animation: "star-blink 5s ease-in-out infinite 0.15s" }}>
        <circle cx="44" cy="35" r="3" fill="white" />
        <circle cx="45" cy="35" r="1.8" fill="#BF360C" />
        <circle cx="45.5" cy="34.5" r="0.6" fill="white" />
      </g>
      {/* Smile */}
      <path d="M37,41 Q40,44 43,41" stroke="#BF360C" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Bumps on arms — pulsing */}
      <g style={{ transformOrigin: "40px 10px", animation: "star-bump 2s ease-in-out infinite" }}>
        <circle cx="40" cy="10" r="1" fill="#FFAB91" />
      </g>
      <g style={{ transformOrigin: "65px 28px", animation: "star-bump 2s ease-in-out infinite 0.4s" }}>
        <circle cx="65" cy="28" r="1" fill="#FFAB91" />
      </g>
      <g style={{ transformOrigin: "55px 60px", animation: "star-bump 2s ease-in-out infinite 0.8s" }}>
        <circle cx="55" cy="60" r="1" fill="#FFAB91" />
      </g>
      <g style={{ transformOrigin: "25px 60px", animation: "star-bump 2s ease-in-out infinite 1.2s" }}>
        <circle cx="25" cy="60" r="1" fill="#FFAB91" />
      </g>
      <g style={{ transformOrigin: "15px 28px", animation: "star-bump 2s ease-in-out infinite 1.6s" }}>
        <circle cx="15" cy="28" r="1" fill="#FFAB91" />
      </g>
      {/* Cheeks */}
      <circle cx="33" cy="40" r="2" fill="#F48FB1" opacity="0.3" />
      <circle cx="47" cy="40" r="2" fill="#F48FB1" opacity="0.3" />
    </svg>
  );
}
