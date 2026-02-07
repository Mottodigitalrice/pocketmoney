"use client";

export function Mosasaurus({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 70" className={className} width="130" height="57">
      <defs>
        <style>{`
          @keyframes mosa-tail { 0%,100%{transform:rotate(0deg)}25%{transform:rotate(10deg)}75%{transform:rotate(-10deg)} }
          @keyframes mosa-ridge { 0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.2)} }
          @keyframes mosa-flip { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(8deg)} }
          @keyframes mosa-jaw { 0%,100%{transform:rotate(0deg)}40%{transform:rotate(3deg)}60%{transform:rotate(-1deg)} }
          @keyframes mosa-body { 0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)} }
          @keyframes mosa-blink { 0%,88%,100%{transform:scaleY(1)}94%{transform:scaleY(0.1)} }
        `}</style>
      </defs>
      {/* Body — slight undulation */}
      <g style={{ transformOrigin: "80px 38px", animation: "mosa-body 2.5s ease-in-out infinite" }}>
        <path d="M20,38 Q40,22 80,30 Q120,35 145,35 Q150,42 145,48 Q120,50 80,45 Q40,50 20,38" fill="#7B1FA2" />
        <path d="M30,40 Q50,38 80,38 Q120,40 142,42 Q120,48 80,44 Q50,46 30,40" fill="#CE93D8" />
      </g>
      {/* Dorsal ridges */}
      <g style={{ transformOrigin: "55px 26px", animation: "mosa-ridge 1.5s ease-in-out infinite" }}>
        <path d="M50,26 L55,18 L60,26" fill="#6A1B9A" />
      </g>
      <g style={{ transformOrigin: "70px 24px", animation: "mosa-ridge 1.5s ease-in-out infinite 0.2s" }}>
        <path d="M65,24 L70,16 L75,24" fill="#6A1B9A" />
      </g>
      <g style={{ transformOrigin: "84px 26px", animation: "mosa-ridge 1.5s ease-in-out infinite 0.4s" }}>
        <path d="M80,26 L84,20 L88,26" fill="#6A1B9A" />
      </g>
      {/* Tail */}
      <g style={{ transformOrigin: "15px 36px", animation: "mosa-tail 0.6s ease-in-out infinite" }}>
        <path d="M15,32 L5,20 L12,36 L5,52 L15,42" fill="#6A1B9A" />
      </g>
      {/* Flippers */}
      <g style={{ transformOrigin: "100px 46px", animation: "mosa-flip 1.8s ease-in-out infinite" }}>
        <path d="M100,46 L112,58 L95,50" fill="#6A1B9A" />
      </g>
      <g style={{ transformOrigin: "60px 44px", animation: "mosa-flip 1.8s ease-in-out infinite 0.4s" }}>
        <path d="M60,44 L50,56 L65,48" fill="#6A1B9A" />
      </g>
      {/* Head */}
      <path d="M140,32 Q158,38 155,42 Q152,46 140,45" fill="#7B1FA2" />
      {/* Eye */}
      <g style={{ transformOrigin: "139px 35px", animation: "mosa-blink 3.5s ease-in-out infinite" }}>
        <circle cx="138" cy="35" r="4" fill="#FFF9C4" />
        <circle cx="139" cy="35" r="2.5" fill="#4A148C" />
        <circle cx="140" cy="34" r="0.8" fill="white" />
      </g>
      {/* Jaw + teeth */}
      <g style={{ transformOrigin: "148px 42px", animation: "mosa-jaw 1s ease-in-out infinite" }}>
        <path d="M142,42 Q150,46 157,40" stroke="#4A148C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M145,42 L145.5,44.5 L146,42" fill="white" />
        <path d="M149,43 L149.5,45.5 L150,43" fill="white" />
        <path d="M153,42 L153.5,44.5 L154,42" fill="white" />
      </g>
      {/* Scales/spots */}
      <circle cx="70" cy="34" r="1.5" fill="#9C27B0" opacity="0.4" />
      <circle cx="90" cy="36" r="1.5" fill="#9C27B0" opacity="0.4" />
      <circle cx="110" cy="38" r="1.5" fill="#9C27B0" opacity="0.4" />
    </svg>
  );
}
