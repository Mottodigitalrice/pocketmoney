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

import { useEffect, useRef, useState } from "react";
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
  // Wave 6 — a11y: when we fire a rank-up toast, also flash a hidden polite
  // live region. sonner's toast container has `role="status"` so most
  // assistive tech announces it, but the toast's structure (title +
  // description in two nodes) can announce as one fragmented utterance.
  // This dedicated live region gives a single clean announcement and
  // doesn't depend on sonner's portal being in the a11y tree at toast time.
  const [announceRank, setAnnounceRank] = useState<PirateRank | null>(null);
  // Single shared timer for the announce flash so unmount cleans up cleanly.
  const cleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // Mirror to the polite live region. Defer the state write out of the
      // effect body via queueMicrotask so we don't trigger a synchronous
      // cascading render (matches the pattern used by WeeklyTracker's
      // celebrate effect). Clear after 5s so the same key can re-announce
      // later if the kid actually ranks up again on the same mount.
      queueMicrotask(() => {
        setAnnounceRank(currentRank);
      });
      if (cleanupTimer.current) clearTimeout(cleanupTimer.current);
      cleanupTimer.current = setTimeout(() => {
        setAnnounceRank(null);
        cleanupTimer.current = null;
      }, 5000);
    }

    // Either way (up OR sideways/down) — sync localStorage so the next
    // comparison starts from the latest known truth.
    writeStoredRank(childId, currentRank);
    lastFiredFor.current = currentRank;
  }, [childId, currentRank, t]);

  useEffect(() => {
    return () => {
      if (cleanupTimer.current) {
        clearTimeout(cleanupTimer.current);
        cleanupTimer.current = null;
      }
    };
  }, []);

  return (
    <>
      {/* Wave 6 — hidden polite live region. Renders only when a rank-up
          just fired (announceRank !== null). One clean utterance, no
          double-announce. */}
      {announceRank && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          data-testid="rank-up-a11y-announce"
        >
          {t("a11y_rank_up", { nextRank: announceRank })}
        </div>
      )}
      {/* Invisible motion wrapper purely to keep the celebratory animation
          primitives co-located. The toast itself is portal'd by sonner. */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0 }}
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      />
    </>
  );
}
