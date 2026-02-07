"use client";

import { useState, useCallback } from "react";
import { CreatureType } from "@/hooks/use-random-creatures";
import { SeaTurtle } from "./SeaTurtle";
import { Shark } from "./Shark";
import { MantaRay } from "./MantaRay";
import { WhaleShark } from "./WhaleShark";
import { Dolphin } from "./Dolphin";
import { Mosasaurus } from "./Mosasaurus";
import { Starfish } from "./Starfish";
import { SnappingTurtle } from "./SnappingTurtle";

const CREATURE_COMPONENTS: Record<CreatureType, React.FC<{ className?: string }>> = {
  "sea-turtle": SeaTurtle,
  shark: Shark,
  "manta-ray": MantaRay,
  "whale-shark": WhaleShark,
  dolphin: Dolphin,
  mosasaurus: Mosasaurus,
  starfish: Starfish,
  "snapping-turtle": SnappingTurtle,
};

interface SwimmingCreatureProps {
  type: CreatureType;
  direction?: "left" | "right";
  speed?: number;
  yPosition?: number;
  delay?: number;
  scale?: number;
}

export function SwimmingCreature({
  type,
  direction = "right",
  speed = 20,
  yPosition = 50,
  delay = 0,
  scale = 1,
}: SwimmingCreatureProps) {
  const [wiggling, setWiggling] = useState(false);
  const CreatureComponent = CREATURE_COMPONENTS[type];

  const handleClick = useCallback(() => {
    setWiggling(true);
    setTimeout(() => setWiggling(false), 600);
  }, []);

  return (
    <div
      className={`pointer-events-auto absolute cursor-pointer ${
        direction === "right" ? "animate-swim-right" : "animate-swim-left"
      }`}
      style={{
        top: `${yPosition}%`,
        animationDuration: `${speed}s`,
        animationDelay: `${delay}s`,
        transform: `scale(${scale})`,
        zIndex: 15,
      }}
      onClick={handleClick}
    >
      <div className={wiggling ? "animate-wiggle" : ""}>
        <CreatureComponent />
      </div>
    </div>
  );
}
