"use client";

/**
 * RankUpToast — fires a one-shot celebratory toast when the kid's
 * `currentRank` increases (e.g. Noob → Normal).
 *
 * SCHEMA IS LOCKED — we cannot add `lastSeenRank` to the wallet doc.
 * Instead we persist a per-device, per-child record in localStorage:
 *
 *   Key:   pm:lastSeenRank:<childId>
 *   Value: one of the PirateRank strings ("Noob" | "Normal" | "Pro" | "Master" | "Hacker")
 *
 * Behaviour:
 *  - First mount with NO stored value → silently store currentRank (no toast).
 *    This avoids fake-celebrating an existing rank on first install.
 *  - Stored rank matches currentRank → no-op.
 *  - currentRank moved UP the tier ladder → fire toast + store new rank.
 *  - currentRank moved DOWN (theoretically impossible — defensive) → no toast,
 *    but quietly sync localStorage so we don't keep comparing against a stale
 *    higher rank.
 *  - localStorage unavailable (private mode, quota) → wrapped in try/catch,
 *    component renders nothing and never throws.
 *
 * Animation: a small motion-scale "pop" on the toast container via custom
 * className. Ranks stay English in both locales (per F18 plan).
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import type { PirateRank } from "@/types";
import { useTranslation } from "@/hooks/use-translation";

interface RankUpToastProps {
  childId: string;
  currentRank: PirateRank;
}

const RANK_ORDER: readonly PirateRank[] = [
  "Noob",
  "Normal",
  "Pro",
  "Master",
  "Hacker",
] as const;

const STORAGE_PREFIX = "pm:lastSeenRank:";

function storageKey(childId: string): string {
  return `${STORAGE_PREFIX}${childId}`;
}

function readStoredRank(childId: string): PirateRank | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(storageKey(childId));
    if (!raw) return null;
    if ((RANK_ORDER as readonly string[]).includes(raw)) {
      return raw as PirateRank;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredRank(childId: string, rank: PirateRank): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey(childId), rank);
  } catch {
    // Quota full / private mode / disabled — silently no-op.
  }
}

function tierIndex(rank: PirateRank): number {
  return RANK_ORDER.indexOf(rank);
}

export function RankUpToast({ childId, currentRank }: RankUpToastProps) {
  const { t } = useTranslation();
  // Track the rank we've already reacted to in *this session* so React
  // strict-mode double-invokes or rapid re-renders don't fire twice.
  const lastFiredFor = useRef<PirateRank | null>(null);

  useEffect(() => {
    if (!currentRank) return;
    if (lastFiredFor.current === currentRank) return;

    const stored = readStoredRank(childId);

    // First-ever mount on this device for this child: silently seed.
    if (stored === null) {
      writeStoredRank(childId, currentRank);
      lastFiredFor.current = currentRank;
      return;
    }

    // Already in sync — nothing to do.
    if (stored === currentRank) {
      lastFiredFor.current = currentRank;
      return;
    }

    const storedIdx = tierIndex(stored);
    const currentIdx = tierIndex(currentRank);

    // Defensive: only celebrate a strict tier increase. If the stored value
    // is unknown (storedIdx === -1) we fall through and treat it as a rank-up.
    if (storedIdx === -1 || currentIdx > storedIdx) {
      toast.success(t("rank_up_toast_title"), {
        description: t("rank_up_toast_body", { rank: currentRank }),
        className: "pm-rank-up-toast",
        duration: 5000,
      });
    }

    // Either way (up OR sideways/down) — sync localStorage so the next
    // comparison starts from the latest known truth.
    writeStoredRank(childId, currentRank);
    lastFiredFor.current = currentRank;
  }, [childId, currentRank, t]);

  // Render an invisible motion wrapper purely to keep the celebratory
  // animation primitives co-located. The toast itself is portal'd by sonner.
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0 }}
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    />
  );
}
