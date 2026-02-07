"use client";

import { useEffect, useState } from "react";

interface Bubble {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

export function BubbleEffect({ count = 15 }: { count?: number }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const generated: Bubble[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 4 + Math.random() * 12,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 8,
    }));
    setBubbles(generated);
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="animate-bubble absolute bottom-0 rounded-full"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0.1))",
            ["--bubble-duration" as string]: `${b.duration}s`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
