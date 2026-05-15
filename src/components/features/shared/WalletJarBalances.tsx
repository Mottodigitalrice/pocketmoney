"use client";

import { CURRENCY } from "@/lib/constants";
import { useTranslation } from "@/hooks/use-translation";
import type { WalletJar } from "@/types";
import type { TranslationKey } from "@/lib/i18n/translations";

const jarConfig: Record<
  WalletJar,
  { labelKey: TranslationKey; icon: string; color: string; bg: string }
> = {
  spend: {
    labelKey: "wallet_spend",
    icon: "🪙",
    color: "text-amber-100",
    bg: "bg-amber-800/40",
  },
  save: {
    labelKey: "wallet_save",
    icon: "🏦",
    color: "text-sky-100",
    bg: "bg-sky-900/35",
  },
  give: {
    labelKey: "wallet_give",
    icon: "🎁",
    color: "text-emerald-100",
    bg: "bg-emerald-900/35",
  },
};

interface WalletJarBalancesProps {
  balances: Record<WalletJar, number>;
  total?: number;
  compact?: boolean;
}

export function WalletJarBalances({
  balances,
  total,
  compact = false,
}: WalletJarBalancesProps) {
  const jars: WalletJar[] = ["spend", "save", "give"];
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {jars.map((jar) => {
          const config = jarConfig[jar];
          return (
            <div
              key={jar}
              data-testid="wallet-jar"
              data-jar={jar}
              data-balance={balances[jar]}
              className={`rounded-xl border border-white/10 ${config.bg} ${
                compact ? "p-2" : "p-3"
              } text-center`}
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
            </div>
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
