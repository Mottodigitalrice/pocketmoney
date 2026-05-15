"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CURRENCY } from "@/lib/constants";
import { useTranslation } from "@/hooks/use-translation";
import type { WalletJar } from "@/types";
import type { TranslationKey } from "@/lib/i18n/translations";

const jarConfig: Record<
  WalletJar,
  { labelKey: TranslationKey; icon: string; color: string; bg: string; glow: string }
> = {
  spend: {
    labelKey: "wallet_spend",
    icon: "🪙",
    color: "text-amber-100",
    bg: "bg-amber-800/40",
    glow: "0 0 24px rgba(251, 191, 36, 0.65)",
  },
  save: {
    labelKey: "wallet_save",
    icon: "🏦",
    color: "text-sky-100",
    bg: "bg-sky-900/35",
    glow: "0 0 24px rgba(56, 189, 248, 0.65)",
  },
  give: {
    labelKey: "wallet_give",
    icon: "🎁",
    color: "text-emerald-100",
    bg: "bg-emerald-900/35",
    glow: "0 0 24px rgba(52, 211, 153, 0.65)",
  },
};

interface WalletJarBalancesProps {
  balances: Record<WalletJar, number>;
  total?: number;
  compact?: boolean;
}

interface DeltaTicket {
  id: number;
  amount: number;
}

// Animation specs (single source of truth — also documented in work-log):
//   - Pulse: scale [1, 1.05, 1] + box-shadow glow, 0.4s, ease-out
//   - Delta label: 250ms fade-in, 500ms hold, 500ms fade-up-and-out (1.25s total)
const PULSE_DURATION_SEC = 0.4;
const DELTA_LIFETIME_MS = 1250;

export function WalletJarBalances({
  balances,
  total,
  compact = false,
}: WalletJarBalancesProps) {
  const jars: WalletJar[] = ["spend", "save", "give"];
  const { t } = useTranslation();

  // Track previous balance per jar so we can detect *increases* only.
  // Withdrawals (decreases) stay silent — no animation, no delta label.
  const prevBalancesRef = useRef<Record<WalletJar, number> | null>(null);
  const deltaIdRef = useRef(0);
  const [pulseToken, setPulseToken] = useState<Record<WalletJar, number>>({
    spend: 0,
    save: 0,
    give: 0,
  });
  const [deltas, setDeltas] = useState<Record<WalletJar, DeltaTicket | null>>({
    spend: null,
    save: null,
    give: null,
  });

  useEffect(() => {
    const prev = prevBalancesRef.current;
    if (prev === null) {
      // First mount — seed silently, never fake-celebrate on initial render.
      prevBalancesRef.current = { ...balances };
      return;
    }

    const newPulse = { ...pulseToken };
    const newDeltas = { ...deltas };
    let changed = false;

    for (const jar of jars) {
      const before = prev[jar] ?? 0;
      const after = balances[jar] ?? 0;
      if (after > before) {
        deltaIdRef.current += 1;
        newPulse[jar] = deltaIdRef.current;
        newDeltas[jar] = { id: deltaIdRef.current, amount: after - before };
        changed = true;
      }
    }

    if (changed) {
      setPulseToken(newPulse);
      setDeltas(newDeltas);
    }

    prevBalancesRef.current = { ...balances };
    // We intentionally only depend on `balances` — pulseToken/deltas are
    // internal write-only state and including them would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balances]);

  // Clean up delta tickets after their lifetime so the DOM stays tidy.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    (Object.keys(deltas) as WalletJar[]).forEach((jar) => {
      const d = deltas[jar];
      if (!d) return;
      const ticketId = d.id;
      const timer = setTimeout(() => {
        setDeltas((prev) => {
          // Only clear if this exact ticket is still showing — a newer one
          // may have superseded it.
          if (prev[jar]?.id !== ticketId) return prev;
          return { ...prev, [jar]: null };
        });
      }, DELTA_LIFETIME_MS);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [deltas]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {jars.map((jar) => {
          const config = jarConfig[jar];
          const token = pulseToken[jar];
          const delta = deltas[jar];
          return (
            <motion.div
              key={jar}
              data-testid="wallet-jar"
              data-jar={jar}
              data-balance={balances[jar]}
              className={`relative rounded-xl border border-white/10 ${config.bg} ${
                compact ? "p-2" : "p-3"
              } text-center`}
              animate={
                token > 0
                  ? {
                      scale: [1, 1.05, 1],
                      boxShadow: ["0 0 0 rgba(0,0,0,0)", config.glow, "0 0 0 rgba(0,0,0,0)"],
                    }
                  : undefined
              }
              transition={{ duration: PULSE_DURATION_SEC, ease: "easeOut" }}
              // `key`-ing the animate prop on token forces motion to re-run
              // the keyframes when the balance increases again.
              {...(token > 0 ? { "data-pulse-token": token } : {})}
            >
              <p className={compact ? "text-xl" : "text-2xl"}>{config.icon}</p>
              <p
                className={`mt-1 font-extrabold ${config.color} ${
                  compact ? "text-lg" : "text-2xl"
                }`}
              >
                {CURRENCY}
                {balances[jar].toLocaleString()}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/60">
                {t(config.labelKey)}
              </p>

              {/* +¥X delta label — fades up + out */}
              <AnimatePresence>
                {delta && (
                  <motion.span
                    key={delta.id}
                    data-testid="wallet-jar-delta"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [4, -2, -2, -18] }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: DELTA_LIFETIME_MS / 1000,
                      times: [0, 0.2, 0.6, 1],
                      ease: "easeOut",
                    }}
                    className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-400/90 px-2 py-0.5 text-xs font-extrabold text-amber-950 shadow-lg"
                  >
                    +{CURRENCY}
                    {delta.amount.toLocaleString()}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
            {total !== undefined && (
        <div
          data-testid="wallet-total"
          data-balance={total}
          className="rounded-xl border border-amber-500/20 bg-amber-950/40 px-3 py-2 text-center"
        >
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/70">
            {t("wallet_total")}
          </p>
          <p className="text-xl font-extrabold text-amber-100">
            {CURRENCY}
            {total.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
