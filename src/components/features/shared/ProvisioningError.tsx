"use client";

import { useTranslation } from "@/hooks/use-translation";

/**
 * ProvisioningError — shown when Clerk sign-in succeeded but the Convex `users`
 * row could not be created after `PocketMoneyProvider`'s bounded retries, i.e.
 * the Clerk → Convex auth handshake is broken (most commonly a missing or
 * misconfigured Clerk "convex" JWT template, which makes every Convex request
 * arrive as `identityType: "unknown"`).
 *
 * This deliberately replaces the old infinite "Loading your crew" skeleton with
 * an actionable surface: retry (re-attempts provisioning) or log out (so a
 * different account can be tried). Presentational only — the provider owns the
 * retry logic and the page owns sign-out.
 */
export function ProvisioningError({
  onRetry,
  onLogout,
}: {
  onRetry: () => void;
  onLogout: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      data-testid="provisioning-error"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 px-6 text-center"
    >
      <div className="w-full max-w-md rounded-3xl border border-amber-800/40 bg-stone-900/80 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-4 text-5xl" aria-hidden="true">
          ⚓️
        </div>
        <h1 className="text-2xl font-extrabold text-amber-100">
          {t("home_provisioning_error_title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-amber-200/80">
          {t("home_provisioning_error_body")}
        </p>
        <button
          onClick={onRetry}
          className="mt-6 w-full rounded-xl bg-amber-600 px-4 py-3 font-bold text-white transition-all hover:bg-amber-500 active:scale-95"
        >
          {t("home_provisioning_error_retry")}
        </button>
        <button
          onClick={onLogout}
          className="mt-3 w-full rounded-xl bg-transparent px-4 py-2 text-sm font-medium text-amber-300/70 underline-offset-2 transition-colors hover:text-amber-200 hover:underline"
        >
          {t("home_provisioning_error_logout")}
        </button>
      </div>
    </div>
  );
}
