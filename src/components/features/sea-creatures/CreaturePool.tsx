"use client";

import { useRandomCreatures } from "@/hooks/use-random-creatures";
import { SwimmingCreature } from "./SwimmingCreature";
import { useEffect, useState, useCallback } from "react";

interface CreatureConfig {
  direction: "left" | "right";
  speed: number;
  yPosition: number;
  delay: number;
  scale: number;
  key: number; // unique key to force remount on respawn
}

function generateConfig(index: number, total: number): CreatureConfig {
  const ySpread = 65 / total;
  return {
    direction: (index % 2 === 0 ? "right" : "left") as "left" | "right",
    speed: 14 + Math.random() * 10, // 14-24s — tighter, more lively range
    yPosition: 15 + index * ySpread + Math.random() * (ySpread * 0.6),
    delay: index * 2 + Math.random() * 3, // staggered 0-13s
    scale: 0.6 + Math.random() * 0.7, // 0.6-1.3 for depth variety
    key: Date.now() + index,
  };
}

export function CreaturePool() {
  const creatures = useRandomCreatures(5);
  const [configs, setConfigs] = useState<CreatureConfig[]>([]);

  useEffect(() => {
    if (creatures.length === 0) return;
    setConfigs(creatures.map((_, i) => generateConfig(i, creatures.length)));
  }, [creatures]);

  const handleRespawn = useCallback(
    (index: number) => {
      setConfigs((prev) => {
        const next = [...prev];
        next[index] = {
          ...generateConfig(index, creatures.length),
          delay: Math.random() * 2, // short delay on respawn
        };
        return next;
      });
    },
    [creatures.length]
  );

  if (creatures.length === 0 || configs.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 10 }}>
      {creatures.map((creature, i) =>
        configs[i] ? (
          <SwimmingCreature
            key={configs[i].key}
            type={creature}
            direction={configs[i].direction}
            speed={configs[i].speed}
            yPosition={configs[i].yPosition}
            delay={configs[i].delay}
            scale={configs[i].scale}
            onComplete={() => handleRespawn(i)}
          />
        ) : null
      )}
    </div>
  );
}
