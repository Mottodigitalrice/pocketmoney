"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface Ray {
  id: number;
  left: number;
  width: number;
  rotation: number;
  duration: number;
  delay: number;
  maxOpacity: number;
}

export function LightRays() {
  const [rays, setRays] = useState<Ray[]>([]);

  useEffect(() => {
    setRays(
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: 15 + i * 18 + Math.random() * 8, // spread across top
        width: 30 + Math.random() * 50, // 30-80px wide
        rotation: 15 + Math.random() * 15, // 15-30 degrees
        duration: 8 + Math.random() * 7, // 8-15s cycle
        delay: Math.random() * 5,
        maxOpacity: 0.04 + Math.random() * 0.06, // 0.04-0.10 very subtle
      }))
    );
  }, []);

  if (rays.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 5 }}>
      {rays.map((ray) => (
        <motion.div
          key={ray.id}
          className="absolute top-0"
          style={{
            left: `${ray.left}%`,
            width: ray.width,
            height: "120%",
            background: `linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 40%, transparent 80%)`,
            transformOrigin: "top center",
            rotate: `${ray.rotation}deg`,
          }}
          initial={{ opacity: 0.02 }}
          animate={{
            opacity: [0.02, ray.maxOpacity, 0.02],
          }}
          transition={{
            duration: ray.duration,
            delay: ray.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
