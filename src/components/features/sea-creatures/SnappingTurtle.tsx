"use client";

export function SnappingTurtle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} width="100" height="67">
      <defs>
        <style>{`
          @keyframes snap-leg-fl { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(-12deg)} }
          @keyframes snap-leg-fr { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(12deg)} }
          @keyframes snap-leg-bl { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(8deg)} }
          @keyframes snap-leg-br { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(-8deg)} }
          @keyframes snap-head { 0%,70%,100%{transform:translate(0,0)}80%{transform:translate(4px,-1px)}90%{transform:translate(-1px,0)} }
          @keyframes snap-tail { 0%,100%{transform:rotate(0deg)}25%{transform:rotate(8deg)}75%{transform:rotate(-6deg)} }
          @keyframes snap-jaw { 0%,60%,100%{transform:rotate(0deg)}70%{transform:rotate(5deg)}80%{transform:rotate(-2deg)} }
          @keyframes snap-blink { 0%,85%,100%{transform:scaleY(1)}92%{transform:scaleY(0.1)} }
        `}</style>
      </defs>
      {/* Shell */}
      <path d="M35,25 Q60,12 85,25 Q95,42 85,58 Q60,68 35,58 Q25,42 35,25" fill="#5D4037" />
      <path d="M38,28 Q60,17 82,28 Q90,42 82,55 Q60,63 38,55 Q30,42 38,28" fill="#795548" />
      {/* Shell scutes */}
      <path d="M50,22 Q60,18 70,22" stroke="#4E342E" strokeWidth="1.5" fill="none" />
      <path d="M42,32 Q60,26 78,32" stroke="#4E342E" strokeWidth="1.5" fill="none" />
      <path d="M38,42 Q60,36 82,42" stroke="#4E342E" strokeWidth="1.5" fill="none" />
      <path d="M42,52 Q60,48 78,52" stroke="#4E342E" strokeWidth="1.5" fill="none" />
      {/* Head — snapping motion */}
      <g style={{ transformOrigin: "98px 40px", animation: "snap-head 2s ease-in-out infinite" }}>
        <ellipse cx="98" cy="40" rx="16" ry="13" fill="#8D6E63" />
        {/* Beak/jaw */}
        <g style={{ transformOrigin: "108px 40px", animation: "snap-jaw 2s ease-in-out infinite" }}>
          <path d="M108,38 L118,40 L108,43" fill="#6D4C41" />
        </g>
        {/* Eye */}
        <g style={{ transformOrigin: "103px 34px", animation: "snap-blink 4s ease-in-out infinite" }}>
          <circle cx="102" cy="34" r="4.5" fill="white" />
          <circle cx="103" cy="34" r="2.8" fill="#3E2723" />
          <circle cx="104" cy="33" r="1" fill="white" />
        </g>
        {/* Angry-cute eyebrow */}
        <line x1="98" y1="29" x2="106" y2="30" stroke="#3E2723" strokeWidth="1.5" strokeLinecap="round" />
        {/* Grin */}
        <path d="M104,44 Q110,48 116,43" stroke="#3E2723" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>
      {/* Front left leg */}
      <g style={{ transformOrigin: "45px 32px", animation: "snap-leg-fl 1s ease-in-out infinite" }}>
        <ellipse cx="38" cy="28" rx="12" ry="7" fill="#8D6E63" transform="rotate(-20 38 28)" />
        <circle cx="28" cy="24" r="1.5" fill="#5D4037" />
        <circle cx="30" cy="22" r="1.5" fill="#5D4037" />
      </g>
      {/* Front right leg */}
      <g style={{ transformOrigin: "75px 32px", animation: "snap-leg-fr 1s ease-in-out infinite 0.15s" }}>
        <ellipse cx="82" cy="28" rx="12" ry="7" fill="#8D6E63" transform="rotate(20 82 28)" />
        <circle cx="90" cy="22" r="1.5" fill="#5D4037" />
        <circle cx="92" cy="24" r="1.5" fill="#5D4037" />
      </g>
      {/* Back left leg */}
      <g style={{ transformOrigin: "42px 53px", animation: "snap-leg-bl 1.3s ease-in-out infinite 0.3s" }}>
        <ellipse cx="35" cy="56" rx="10" ry="6" fill="#8D6E63" transform="rotate(15 35 56)" />
      </g>
      {/* Back right leg */}
      <g style={{ transformOrigin: "78px 53px", animation: "snap-leg-br 1.3s ease-in-out infinite 0.45s" }}>
        <ellipse cx="85" cy="56" rx="10" ry="6" fill="#8D6E63" transform="rotate(-15 85 56)" />
      </g>
      {/* Spiky tail */}
      <g style={{ transformOrigin: "25px 42px", animation: "snap-tail 0.8s ease-in-out infinite" }}>
        <path d="M25,42 L10,38 L14,42 L8,44 L15,44 L12,48 L25,42" fill="#8D6E63" />
      </g>
    </svg>
  );
}
