"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, useAnimationControls } from "motion/react";
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

// Per-creature click reaction animation configs
type Easing = "easeIn" | "easeOut" | "easeInOut" | "linear";
const CLICK_ANIMATIONS: Record<CreatureType, {
  keyframes: Record<string, number[]>;
  transition: { duration: number; ease?: Easing };
}> = {
  shark: {
    keyframes: { x: [0, 30, -5, 0], scale: [1, 1.15, 1, 1] },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  dolphin: {
    keyframes: { y: [0, -80, -70, 0], rotate: [0, -15, 360, 0], scale: [1, 1.1, 1.1, 1] },
    transition: { duration: 0.8, ease: "easeInOut" },
  },
  "sea-turtle": {
    keyframes: { scale: [1, 0.6, 0.6, 1], opacity: [1, 0.7, 0.7, 1] },
    transition: { duration: 0.7, ease: "easeInOut" },
  },
  "manta-ray": {
    keyframes: { rotateY: [0, 180, 360], scale: [1, 1.05, 1] },
    transition: { duration: 0.8, ease: "easeInOut" },
  },
  "whale-shark": {
    keyframes: { scaleY: [1, 1.2, 1], scaleX: [1, 0.95, 1], rotate: [0, 3, -2, 0] },
    transition: { duration: 0.9, ease: "easeInOut" },
  },
  mosasaurus: {
    keyframes: { x: [0, 40, -10, 0], scale: [1, 1.3, 0.95, 1] },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  starfish: {
    keyframes: { rotate: [0, 360, 720], scale: [1, 1.2, 0.9, 1.05, 1] },
    transition: { duration: 0.7, ease: "easeOut" },
  },
  "snapping-turtle": {
    keyframes: { x: [0, 25, -10, 0], scale: [1, 1.1, 0.95, 1] },
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

interface SwimmingCreatureProps {
  type: CreatureType;
  direction?: "left" | "right";
  speed?: number;
  yPosition?: number;
  delay?: number;
  scale?: number;
  onComplete?: () => void;
}

// Bubble burst particle component
function BubbleBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const particles = useRef(
    Array.from({ length: 5 }, () => ({
      dx: (Math.random() - 0.5) * 40,
      dy: (Math.random() - 0.5) * 40,
      size: 4 + Math.random() * 6,
    }))
  ).current;

  return (
    <div className="pointer-events-none fixed z-50" style={{ left: x, top: y }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(173,216,230,0.3))",
            left: -p.size / 2,
            top: -p.size / 2,
          }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 0.8 }}
          animate={{ scale: [0, 1.2, 0], x: p.dx, y: p.dy, opacity: [0.8, 0.6, 0] }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          onAnimationComplete={i === 0 ? onDone : undefined}
        />
      ))}
    </div>
  );
}

export function SwimmingCreature({
  type,
  direction = "right",
  speed = 20,
  yPosition = 50,
  delay = 0,
  scale = 1,
  onComplete,
}: SwimmingCreatureProps) {
  const [isReacting, setIsReacting] = useState(false);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const reactionControls = useAnimationControls();
  const CreatureComponent = CREATURE_COMPONENTS[type];

  useEffect(() => {
    setMounted(true);
    setViewportWidth(window.innerWidth);
  }, []);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isReacting) return;

      // Spawn bubble burst at click point
      setBurst({ x: e.clientX, y: e.clientY });

      setIsReacting(true);
      const config = CLICK_ANIMATIONS[type];
      if (config) {
        await reactionControls.start({
          ...config.keyframes,
          transition: config.transition,
        });
      }
      setIsReacting(false);
    },
    [isReacting, type, reactionControls]
  );

  if (!mounted) return null;

  const isRight = direction === "right";
  const startX = isRight ? -150 : viewportWidth + 150;
  const endX = isRight ? viewportWidth + 150 : -150;

  return (
    <>
      {/* Main swimming container — handles horizontal movement */}
      <motion.div
        className="pointer-events-auto absolute cursor-pointer"
        style={{
          top: `${yPosition}%`,
          zIndex: 10,
          willChange: "transform",
        }}
        initial={{ x: startX }}
        animate={{ x: [startX, endX] }}
        transition={{
          x: {
            duration: speed,
            ease: "linear",
            delay: delay,
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 0.5,
          },
        }}
        onAnimationComplete={() => {
          if (onComplete) onComplete();
        }}
        onClick={handleClick}
      >
        {/* Bobbing layer — handles vertical oscillation + rotation */}
        <motion.div
          animate={{
            y: [0, -20, 8, -15, 5, -10, 0],
            rotate: isRight
              ? [0, -2, 1.5, -1, 0.5, -1.5, 0]
              : [0, 2, -1.5, 1, -0.5, 1.5, 0],
          }}
          transition={{
            y: {
              duration: speed / 3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            },
            rotate: {
              duration: speed / 3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            },
          }}
        >
          {/* Click reaction layer — uses animation controls */}
          <motion.div
            animate={reactionControls}
            style={{
              transform: `scale(${scale}) scaleX(${isRight ? 1 : -1})`,
            }}
          >
            <CreatureComponent />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bubble burst effect */}
      {burst && (
        <BubbleBurst x={burst.x} y={burst.y} onDone={() => setBurst(null)} />
      )}
    </>
  );
}
