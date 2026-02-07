"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface Bubble {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  isBig: boolean;
  wobbleX: number[];
}

export function BubbleEffect({ count = 15 }: { count?: number }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const generated: Bubble[] = Array.from({ length: count }, (_, i) => {
      const isBig = Math.random() < 0.1; // 1 in 10 is a big bubble
      const wobbleAmount = 8 + Math.random() * 12;
      return {
        id: i,
        left: Math.random() * 100,
        size: isBig ? 16 + Math.random() * 10 : 4 + Math.random() * 12,
        duration: isBig ? 8 + Math.random() * 4 : 4 + Math.random() * 6,
        delay: Math.random() * 8,
        isBig,
        wobbleX: [0, wobbleAmount, -wobbleAmount * 0.7, wobbleAmount * 0.4, 0],
      };
    });
    setBubbles(generated);
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            background: b.isBig
              ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), rgba(255,255,255,0.15))"
              : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0.1))",
          }}
          initial={{ y: 0, x: 0, scale: 0.4, opacity: 0 }}
          animate={{
            y: [0, "-100vh"],
            x: b.wobbleX,
            scale: b.isBig ? [0.5, 0.8, 1.2, 1.4, 0] : [0.4, 0.7, 1],
            opacity: b.isBig ? [0, 0.7, 0.5, 0.3, 0] : [0, 0.6, 0.4, 0],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
            x: {
              duration: b.duration,
              delay: b.delay,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />
      ))}
    </div>
  );
}
