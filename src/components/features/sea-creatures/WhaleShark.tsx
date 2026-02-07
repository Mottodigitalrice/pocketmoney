"use client";

export function WhaleShark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 80" className={className} width="130" height="65">
      {/* Body */}
      <ellipse cx="80" cy="42" rx="60" ry="28" fill="#37474F" />
      <ellipse cx="80" cy="44" rx="55" ry="22" fill="#455A64" />
      {/* Belly */}
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
      {/* Dorsal fin */}
      <path d="M70,14 L80,2 L88,14" fill="#37474F" />
      {/* Tail */}
      <path d="M20,34 L5,18 L14,40 L5,60 L20,48" fill="#37474F" />
      {/* Pectoral fin */}
      <path d="M100,52 L115,68 L95,58" fill="#37474F" />
      {/* Head - wide flat mouth */}
      <path d="M130,28 Q150,40 130,55 Q140,42 130,28" fill="#455A64" />
      {/* Eye */}
      <circle cx="125" cy="32" r="4" fill="white" />
      <circle cx="126" cy="32" r="2.5" fill="#263238" />
      <circle cx="127" cy="31" r="0.8" fill="white" />
      {/* Wide smile */}
      <path d="M128,48 Q138,52 148,42" stroke="#263238" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Gills */}
      <line x1="115" y1="30" x2="115" y2="48" stroke="#37474F" strokeWidth="1.2" />
      <line x1="112" y1="32" x2="112" y2="46" stroke="#37474F" strokeWidth="1" />
      <line x1="109" y1="33" x2="109" y2="45" stroke="#37474F" strokeWidth="1" />
    </svg>
  );
}
