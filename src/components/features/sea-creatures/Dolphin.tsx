"use client";

export function Dolphin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 70" className={className} width="110" height="55">
      <defs>
        <style>{`
          @keyframes dolph-tail { 0%,100%{transform:rotate(0deg)}30%{transform:rotate(12deg)}70%{transform:rotate(-12deg)} }
          @keyframes dolph-dorsal { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(-4deg)} }
          @keyframes dolph-pec { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(8deg)} }
          @keyframes dolph-body { 0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)} }
          @keyframes dolph-blink { 0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)} }
          @keyframes dolph-smile { 0%,100%{transform:scale(1)}50%{transform:scale(1.05)} }
        `}</style>
      </defs>
      {/* Body — subtle undulation */}
      <g style={{ transformOrigin: "80px 40px", animation: "dolph-body 2s ease-in-out infinite" }}>
        <path d="M30,40 Q50,20 90,28 Q120,32 130,38 Q120,50 90,48 Q50,52 30,40" fill="#42A5F5" />
        <path d="M40,42 Q60,38 90,38 Q115,40 125,40 Q115,48 90,46 Q60,48 40,42" fill="#E3F2FD" />
      </g>
      {/* Dorsal fin */}
      <g style={{ transformOrigin: "78px 20px", animation: "dolph-dorsal 2.5s ease-in-out infinite" }}>
        <path d="M70,20 L78,5 L85,20" fill="#1E88E5" />
      </g>
      {/* Tail flukes */}
      <g style={{ transformOrigin: "25px 38px", animation: "dolph-tail 0.7s ease-in-out infinite" }}>
        <path d="M25,35 L8,22 L18,38 L8,52 L25,42" fill="#1E88E5" />
      </g>
      {/* Pectoral fin */}
      <g style={{ transformOrigin: "90px 45px", animation: "dolph-pec 1.8s ease-in-out infinite" }}>
        <path d="M90,45 L100,58 L85,50" fill="#1E88E5" />
      </g>
      {/* Beak/snout */}
      <path d="M125,36 Q140,38 138,40 Q136,42 125,40" fill="#42A5F5" />
      {/* Eye */}
      <g style={{ transformOrigin: "116px 34px", animation: "dolph-blink 5s ease-in-out infinite" }}>
        <circle cx="115" cy="34" r="4.5" fill="white" />
        <circle cx="116" cy="34" r="2.8" fill="#0D47A1" />
        <circle cx="117" cy="33" r="1" fill="white" />
      </g>
      {/* Happy smile */}
      <g style={{ transformOrigin: "126px 42px", animation: "dolph-smile 3s ease-in-out infinite" }}>
        <path d="M118,40 Q125,46 135,39" stroke="#0D47A1" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Blowhole */}
      <ellipse cx="100" cy="26" rx="2" ry="1" fill="#1E88E5" />
      {/* Cheek blush */}
      <circle cx="120" cy="40" r="3" fill="#F48FB1" opacity="0.3" />
    </svg>
  );
}
