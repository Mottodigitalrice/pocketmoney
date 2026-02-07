"use client";

import { useRandomCreatures } from "@/hooks/use-random-creatures";
import { SwimmingCreature } from "./SwimmingCreature";
import { useEffect, useState } from "react";

interface CreatureConfig {
  direction: "left" | "right";
  speed: number;
  yPosition: number;
  delay: number;
  scale: number;
}

export function CreaturePool() {
  const creatures = useRandomCreatures(3);
  const [configs, setConfigs] = useState<CreatureConfig[]>([]);

  useEffect(() => {
    if (creatures.length === 0) return;
    setConfigs(
      creatures.map((_, i) => ({
        direction: (i % 2 === 0 ? "right" : "left") as "left" | "right",
        speed: 18 + Math.random() * 12,
        yPosition: 20 + i * 25 + Math.random() * 10,
        delay: i * 4 + Math.random() * 3,
        scale: 0.7 + Math.random() * 0.5,
      }))
    );
  }, [creatures]);

  if (creatures.length === 0 || configs.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 15 }}>
      {creatures.map((creature, i) => (
        <SwimmingCreature
          key={`${creature}-${i}`}
          type={creature}
          {...configs[i]}
        />
      ))}
    </div>
  );
}
