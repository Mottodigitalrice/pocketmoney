"use client";

import { useState, useEffect } from "react";

export type CreatureType =
  | "sea-turtle"
  | "shark"
  | "manta-ray"
  | "whale-shark"
  | "dolphin"
  | "mosasaurus"
  | "starfish"
  | "snapping-turtle";

const ALL_CREATURES: CreatureType[] = [
  "sea-turtle",
  "shark",
  "manta-ray",
  "whale-shark",
  "dolphin",
  "mosasaurus",
  "starfish",
  "snapping-turtle",
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useRandomCreatures(count: number = 3) {
  const [creatures, setCreatures] = useState<CreatureType[]>([]);

  useEffect(() => {
    setCreatures(shuffle(ALL_CREATURES).slice(0, count));
  }, [count]);

  return creatures;
}
