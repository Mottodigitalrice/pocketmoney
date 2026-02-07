"use client";

export function DolphinAvatar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} width="120" height="120">
      {/* Body circle */}
      <circle cx="60" cy="60" r="45" fill="#42A5F5" />
      {/* Belly */}
      <ellipse cx="60" cy="68" rx="28" ry="22" fill="#E3F2FD" />
      {/* Dorsal fin */}
      <path d="M55,15 L62,2 L68,15" fill="#1E88E5" />
      {/* Side fins / flippers */}
      <path d="M16,60 L2,72 L20,68" fill="#1E88E5" />
      <path d="M104,60 L118,72 L100,68" fill="#1E88E5" />
      {/* Snout / beak */}
      <ellipse cx="60" cy="82" rx="12" ry="6" fill="#42A5F5" />
      {/* Eyes - super big and cute */}
      <circle cx="42" cy="50" r="12" fill="white" />
      <circle cx="45" cy="50" r="7" fill="#0D47A1" />
      <circle cx="47" cy="47" r="3" fill="white" />
      <circle cx="78" cy="50" r="12" fill="white" />
      <circle cx="81" cy="50" r="7" fill="#0D47A1" />
      <circle cx="83" cy="47" r="3" fill="white" />
      {/* Happy smile */}
      <path d="M45,75 Q60,86 75,75" stroke="#0D47A1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Rosy cheeks */}
      <circle cx="35" cy="65" r="5" fill="#F48FB1" opacity="0.35" />
      <circle cx="85" cy="65" r="5" fill="#F48FB1" opacity="0.35" />
      {/* Blowhole */}
      <ellipse cx="60" cy="22" rx="3" ry="1.5" fill="#1E88E5" />
      {/* Little sparkle near eye */}
      <path d="M30,38 L32,34 L34,38 L32,42 Z" fill="white" opacity="0.6" />
    </svg>
  );
}
