"use client";

export function Shark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 70" className={className} width="120" height="60">
      <defs>
        <style>{`
          @keyframes shark-tail { 0%,100%{transform:rotate(0deg)}25%{transform:rotate(8deg)}75%{transform:rotate(-8deg)} }
          @keyframes shark-dorsal { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(-3deg)} }
          @keyframes shark-pec { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(5deg)} }
          @keyframes shark-jaw { 0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)} }
          @keyframes shark-eye-blink { 0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(0.1)} }
        `}</style>
      </defs>
      {/* Body */}
      <ellipse cx="70" cy="38" rx="50" ry="22" fill="#607D8B" />
      <ellipse cx="70" cy="40" rx="45" ry="15" fill="#78909C" />
      {/* Belly */}
      <ellipse cx="75" cy="46" rx="35" ry="10" fill="#ECEFF1" />
      {/* Dorsal fin */}
      <g style={{ transformOrigin: "70px 16px", animation: "shark-dorsal 2s ease-in-out infinite" }}>
        <path d="M60,16 L70,2 L78,16" fill="#546E7A" />
      </g>
      {/* Tail */}
      <g style={{ transformOrigin: "20px 38px", animation: "shark-tail 0.8s ease-in-out infinite" }}>
        <path d="M20,30 L5,15 L12,38 L5,55 L20,45" fill="#546E7A" />
      </g>
      {/* Pectoral fins */}
      <g style={{ transformOrigin: "85px 48px", animation: "shark-pec 1.5s ease-in-out infinite" }}>
        <path d="M85,48 L100,62 L80,55" fill="#546E7A" />
      </g>
      <g style={{ transformOrigin: "55px 48px", animation: "shark-pec 1.5s ease-in-out infinite 0.3s" }}>
        <path d="M55,48 L40,62 L60,55" fill="#546E7A" />
      </g>
      {/* Head shape */}
      <ellipse cx="110" cy="38" rx="20" ry="16" fill="#607D8B" />
      {/* Nose */}
      <ellipse cx="125" cy="38" rx="8" ry="10" fill="#6B8C99" />
      {/* Eye */}
      <g style={{ transformOrigin: "113px 32px", animation: "shark-eye-blink 4s ease-in-out infinite" }}>
        <circle cx="112" cy="32" r="5" fill="white" />
        <circle cx="113" cy="32" r="3" fill="#263238" />
        <circle cx="114" cy="31" r="1" fill="white" />
      </g>
      {/* Jaw + teeth */}
      <g style={{ transformOrigin: "118px 44px", animation: "shark-jaw 1.2s ease-in-out infinite" }}>
        <path d="M108,44 Q118,52 128,42" stroke="#263238" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M112,44 L113,47 L114,44" fill="white" stroke="#263238" strokeWidth="0.5" />
        <path d="M117,46 L118,49 L119,46" fill="white" stroke="#263238" strokeWidth="0.5" />
        <path d="M122,45 L123,48 L124,45" fill="white" stroke="#263238" strokeWidth="0.5" />
      </g>
      {/* Gills */}
      <line x1="95" y1="30" x2="95" y2="42" stroke="#546E7A" strokeWidth="1" />
      <line x1="92" y1="31" x2="92" y2="41" stroke="#546E7A" strokeWidth="1" />
      <line x1="89" y1="32" x2="89" y2="40" stroke="#546E7A" strokeWidth="1" />
    </svg>
  );
}
