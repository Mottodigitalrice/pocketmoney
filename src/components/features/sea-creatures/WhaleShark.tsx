"use client";

export function WhaleShark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 80" className={className} width="130" height="65">
      <defs>
        <style>{`
          @keyframes ws-tail { 0%,100%{transform:rotate(0deg)}30%{transform:rotate(6deg)}70%{transform:rotate(-6deg)} }
          @keyframes ws-dorsal { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(-3deg)} }
          @keyframes ws-pec { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(6deg)} }
          @keyframes ws-body { 0%,100%{transform:scaleX(1)}50%{transform:scaleX(1.01)} }
          @keyframes ws-blink { 0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)} }
          @keyframes ws-mouth { 0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.15)} }
        `}</style>
      </defs>
      {/* Body — gentle breathing */}
      <g style={{ transformOrigin: "80px 42px", animation: "ws-body 4s ease-in-out infinite" }}>
        <ellipse cx="80" cy="42" rx="60" ry="28" fill="#37474F" />
        <ellipse cx="80" cy="44" rx="55" ry="22" fill="#455A64" />
        <ellipse cx="85" cy="52" rx="40" ry="12" fill="#CFD8DC" />
        {/* Spots */}
        <circle cx="50" cy="30" r="2" fill="#90A4AE" opacity="0.7" />
        <circle cx="60" cy="26" r="1.5" fill="#90A4AE" opacity="0.6" />
        <circle cx="70" cy="32" r="2" fill="#90A4AE" opacity="0.7" />
        <circle cx="80" cy="28" r="1.5" fill="#90A4AE" opacity="0.5" />
        <circle cx="90" cy="30" r="2" fill="#90A4AE" opacity="0.7" />
        <circle cx="100" cy="26" r="1.5" fill="#90A4AE" opacity="0.6" />
        <circle cx="65" cy="38" r="1.5" fill="#90A4AE" opacity="0.5" />
        <circle cx="85" cy="36" r="2" fill="#90A4AE" opacity="0.6" />
        <circle cx="105" cy="34" r="1.5" fill="#90A4AE" opacity="0.5" />
        <circle cx="55" cy="44" r="1.5" fill="#90A4AE" opacity="0.4" />
      </g>
      {/* Dorsal fin */}
      <g style={{ transformOrigin: "80px 14px", animation: "ws-dorsal 3s ease-in-out infinite" }}>
        <path d="M70,14 L80,2 L88,14" fill="#37474F" />
      </g>
      {/* Tail */}
      <g style={{ transformOrigin: "20px 40px", animation: "ws-tail 1s ease-in-out infinite" }}>
        <path d="M20,34 L5,18 L14,40 L5,60 L20,48" fill="#37474F" />
      </g>
      {/* Pectoral fin */}
      <g style={{ transformOrigin: "100px 52px", animation: "ws-pec 2s ease-in-out infinite" }}>
        <path d="M100,52 L115,68 L95,58" fill="#37474F" />
      </g>
      {/* Head */}
      <path d="M130,28 Q150,40 130,55 Q140,42 130,28" fill="#455A64" />
      {/* Eye */}
      <g style={{ transformOrigin: "126px 32px", animation: "ws-blink 6s ease-in-out infinite" }}>
        <circle cx="125" cy="32" r="4" fill="white" />
        <circle cx="126" cy="32" r="2.5" fill="#263238" />
        <circle cx="127" cy="31" r="0.8" fill="white" />
      </g>
      {/* Wide smile */}
      <g style={{ transformOrigin: "138px 47px", animation: "ws-mouth 3s ease-in-out infinite" }}>
        <path d="M128,48 Q138,52 148,42" stroke="#263238" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Gills */}
      <line x1="115" y1="30" x2="115" y2="48" stroke="#37474F" strokeWidth="1.2" />
      <line x1="112" y1="32" x2="112" y2="46" stroke="#37474F" strokeWidth="1" />
      <line x1="109" y1="33" x2="109" y2="45" stroke="#37474F" strokeWidth="1" />
    </svg>
  );
}
