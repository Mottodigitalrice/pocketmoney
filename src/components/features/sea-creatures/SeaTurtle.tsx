"use client";

export function SeaTurtle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} width="100" height="67">
      <defs>
        <style>{`
          @keyframes turtle-fl { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(15deg)} }
          @keyframes turtle-fr { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(-15deg)} }
          @keyframes turtle-bl { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(-10deg)} }
          @keyframes turtle-br { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(10deg)} }
          @keyframes turtle-head { 0%,100%{transform:translate(0,0)}50%{transform:translate(2px,-1px)} }
          @keyframes turtle-blink { 0%,88%,100%{transform:scaleY(1)}94%{transform:scaleY(0.1)} }
          @keyframes turtle-tail { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(8deg)} }
        `}</style>
      </defs>
      {/* Shell */}
      <ellipse cx="60" cy="42" rx="35" ry="28" fill="#4CAF50" />
      <ellipse cx="60" cy="42" rx="30" ry="23" fill="#66BB6A" />
      {/* Shell pattern */}
      <path d="M45,30 Q60,25 75,30" stroke="#388E3C" strokeWidth="2" fill="none" />
      <path d="M42,42 Q60,35 78,42" stroke="#388E3C" strokeWidth="2" fill="none" />
      <path d="M45,52 Q60,48 75,52" stroke="#388E3C" strokeWidth="2" fill="none" />
      {/* Head */}
      <g style={{ transformOrigin: "95px 38px", animation: "turtle-head 3s ease-in-out infinite" }}>
        <ellipse cx="95" cy="38" rx="14" ry="11" fill="#81C784" />
        {/* Eyes */}
        <g style={{ transformOrigin: "101px 34px", animation: "turtle-blink 6s ease-in-out infinite" }}>
          <circle cx="100" cy="34" r="3.5" fill="white" />
          <circle cx="101" cy="34" r="2" fill="#1B5E20" />
          <circle cx="101.5" cy="33.5" r="0.7" fill="white" />
        </g>
        {/* Smile */}
        <path d="M98,40 Q102,44 106,40" stroke="#1B5E20" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      {/* Front left flipper */}
      <g style={{ transformOrigin: "50px 30px", animation: "turtle-fl 1.2s ease-in-out infinite" }}>
        <ellipse cx="38" cy="25" rx="15" ry="6" fill="#81C784" transform="rotate(-30 38 25)" />
      </g>
      {/* Front right flipper */}
      <g style={{ transformOrigin: "70px 30px", animation: "turtle-fr 1.2s ease-in-out infinite 0.15s" }}>
        <ellipse cx="82" cy="25" rx="15" ry="6" fill="#81C784" transform="rotate(30 82 25)" />
      </g>
      {/* Back left flipper */}
      <g style={{ transformOrigin: "45px 55px", animation: "turtle-bl 1.5s ease-in-out infinite 0.3s" }}>
        <ellipse cx="35" cy="58" rx="12" ry="5" fill="#81C784" transform="rotate(20 35 58)" />
      </g>
      {/* Back right flipper */}
      <g style={{ transformOrigin: "75px 55px", animation: "turtle-br 1.5s ease-in-out infinite 0.45s" }}>
        <ellipse cx="85" cy="58" rx="12" ry="5" fill="#81C784" transform="rotate(-20 85 58)" />
      </g>
      {/* Tail */}
      <g style={{ transformOrigin: "25px 42px", animation: "turtle-tail 1s ease-in-out infinite" }}>
        <path d="M25,42 L15,40 L20,45 Z" fill="#81C784" />
      </g>
    </svg>
  );
}
