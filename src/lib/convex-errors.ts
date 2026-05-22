/**
 * F12 — Typed Convex error mapper.
 *
 * Translates raw errors thrown from Convex mutations / network failures into
 * a stable {code, severity, message} shape that the UI can render directly.
 *
 * Design note: this module is intentionally pure — no React, no hook deps.
 * Callers pass in their own `t` function (from `useTranslation`). This keeps
 * `mapConvexError` testable outside React, importable from non-React modules
 * (e.g. photo-proof.ts), and trivially mockable in Playwright/Vitest.
 *
 * For a React-friendly shape, see the `useMapConvexError` hook at the bottom
 * of this file — it wraps the pure function with the current locale's `t`.
 *
 * Backend errors covered (from convex/functions/**.ts):
 *   - `OVERDRAFT: balance ¥X cannot cover withdrawal ¥Y`  (transactions.ts)
 *   - `LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK`             (luckyChests.ts)
 *   - `LUCKY_CHEST_COOLDOWN`                             (luckyChests.ts — MED-1)
 *   - `CHILD_DELETED_AFTER_COMPLETION`                   (jobInstances.ts)
 *   - `CANNOT_REJECT_APPROVED_INSTANCE`                  (jobInstances.ts)
 *   - `PARENT_NOTE_TOO_LONG`                             (inputValidation.ts — MED-2)
 *   - `JOB_TITLE_TOO_LONG: <label>`                      (inputValidation.ts — MED-3)
 *   - `JOB_TITLE_JA_TOO_LONG`                            (inputValidation.ts — MED-3)
 *   - `JOB_YEN_AMOUNT_OUT_OF_BOUNDS`                     (inputValidation.ts — MED-3)
 *   - `INVALID_DATE_FORMAT: <label>`                     (dateValidation.ts — MED-4)
 *   - `Not your X`                                       (assertOwnedBy)
 *   - `Not authenticated`                                (Convex auth)
 *   - Any network-layer fetch failure                    (browser)
 */

import type { TranslationKey } from "@/lib/i18n/translations";

export type ErrorCode =
  | "AUTH_LOST"
  | "NETWORK"
  | "OVERDRAFT"
  | "LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK"
  | "LUCKY_CHEST_COOLDOWN"
  | "CHILD_DELETED_AFTER_COMPLETION"
  | "CANNOT_REJECT_APPROVED_INSTANCE"
  | "PARENT_NOTE_TOO_LONG"
  | "JOB_TITLE_TOO_LONG"
  | "JOB_TITLE_JA_TOO_LONG"
  | "JOB_YEN_AMOUNT_OUT_OF_BOUNDS"
  | "INVALID_DATE_FORMAT"
  | "OWNERSHIP"
  | "VALIDATION"
  | "UNKNOWN";

export type ErrorSeverity =
  | "auth"
  | "network"
  | "validation"
  | "ownership"
  | "unknown";

export interface MappedError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  /** Original raw text — useful for logging / debugging only. Never render. */
  raw: string;
}

type TFn = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

/** Map each ErrorCode → translation key + severity. */
const CODE_META: Record<
  ErrorCode,
  { key: TranslationKey; severity: ErrorSeverity }
> = {
  AUTH_LOST: { key: "error_auth_lost", severity: "auth" },
  NETWORK: { key: "error_network", severity: "network" },
  OVERDRAFT: { key: "error_overdraft", severity: "validation" },
  LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK: {
    key: "error_lucky_chest_locked",
    severity: "validation",
  },
  LUCKY_CHEST_COOLDOWN: {
    key: "error_lucky_chest_cooldown",
    severity: "validation",
  },
  CHILD_DELETED_AFTER_COMPLETION: {
    key: "error_child_deleted",
    severity: "validation",
  },
  CANNOT_REJECT_APPROVED_INSTANCE: {
    key: "error_already_approved",
    severity: "validation",
  },
  PARENT_NOTE_TOO_LONG: {
    key: "error_parent_note_too_long",
    severity: "validation",
  },
  JOB_TITLE_TOO_LONG: {
    key: "error_job_title_too_long",
    severity: "validation",
  },
  JOB_TITLE_JA_TOO_LONG: {
    key: "error_job_title_ja_too_long",
    severity: "validation",
  },
  JOB_YEN_AMOUNT_OUT_OF_BOUNDS: {
    key: "error_job_yen_amount_out_of_bounds",
    severity: "validation",
  },
  INVALID_DATE_FORMAT: {
    key: "error_invalid_date_format",
    severity: "validation",
  },
  OWNERSHIP: { key: "error_ownership", severity: "ownership" },
  VALIDATION: { key: "error_validation", severity: "validation" },
  UNKNOWN: { key: "error_unknown", severity: "unknown" },
};

/** Extract a readable string from an unknown error shape. */
function extractRaw(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const maybeError = err as {
      message?: unknown;
      data?: unknown;
      toString?: () => string;
    };
    if (typeof maybeError.message === "string") return maybeError.message;
    if (typeof maybeError.data === "string") return maybeError.data;
    if (
      maybeError.data &&
      typeof maybeError.data === "object" &&
      typeof (maybeError.data as { message?: unknown }).message === "string"
    ) {
      return (maybeError.data as { message: string }).message;
    }
    try {
      const s = String(err);
      if (s && s !== "[object Object]") return s;
    } catch {
      /* fallthrough */
    }
  }
  return "";
}

/** Classify a raw error string → ErrorCode. */
function classify(raw: string): ErrorCode {
  if (!raw) return "UNKNOWN";

  // Convex auth — exact match plus loose pattern.
  if (
    /not authenticated|unauthenticated|auth.*expired|invalid token/i.test(raw)
  ) {
    return "AUTH_LOST";
  }

  // Network / fetch failures (browser-side).
  if (/network|fetch|failed to fetch|offline|net::|err_internet/i.test(raw)) {
    return "NETWORK";
  }

  // Structured backend codes — most-specific first.
  if (/^OVERDRAFT:/i.test(raw) || /overdraft/i.test(raw)) return "OVERDRAFT";
  if (/LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK/.test(raw)) {
    return "LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK";
  }
  if (/LUCKY_CHEST_COOLDOWN/.test(raw)) {
    return "LUCKY_CHEST_COOLDOWN";
  }
  if (/CHILD_DELETED_AFTER_COMPLETION/.test(raw)) {
    return "CHILD_DELETED_AFTER_COMPLETION";
  }
  if (/CANNOT_REJECT_APPROVED_INSTANCE/.test(raw)) {
    return "CANNOT_REJECT_APPROVED_INSTANCE";
  }
  if (/PARENT_NOTE_TOO_LONG/.test(raw)) return "PARENT_NOTE_TOO_LONG";
  // JOB_TITLE_JA_TOO_LONG before JOB_TITLE_TOO_LONG (prefix) — more specific.
  if (/JOB_TITLE_JA_TOO_LONG/.test(raw)) return "JOB_TITLE_JA_TOO_LONG";
  // JOB_TITLE_TOO_LONG is thrown with a label suffix (`JOB_TITLE_TOO_LONG: <label>`).
  if (/JOB_TITLE_TOO_LONG/.test(raw)) return "JOB_TITLE_TOO_LONG";
  if (/JOB_YEN_AMOUNT_OUT_OF_BOUNDS/.test(raw)) {
    return "JOB_YEN_AMOUNT_OUT_OF_BOUNDS";
  }
  // INVALID_DATE_FORMAT is thrown with a label suffix (`INVALID_DATE_FORMAT: <label>`).
  if (/INVALID_DATE_FORMAT/.test(raw)) return "INVALID_DATE_FORMAT";

  // `assertOwnedBy` throws "Not your <thing>".
  if (/not your /i.test(raw)) return "OWNERSHIP";

  // Convex validator messages (from `v.*` validators) typically include
  // "ArgumentValidationError" or "Validator error".
  if (/argumentvalidationerror|validator error|validation/i.test(raw)) {
    return "VALIDATION";
  }

  return "UNKNOWN";
}

/**
 * Pure mapping function — accepts an unknown error and a `t` translator and
 * returns a {code, message, severity, raw} record ready to render.
 *
 * Usage:
 *   const { message, code } = mapConvexError(err, t);
 *   toast.error(message);
 */
export function mapConvexError(err: unknown, t: TFn): MappedError {
  const raw = extractRaw(err);
  const code = classify(raw);
  const meta = CODE_META[code];
  return {
    code,
    message: t(meta.key),
    severity: meta.severity,
    raw,
  };
}

/**
 * Translation-key-only variant. Useful when the caller has a `t` available
 * at render time but not at the moment of error catch (e.g. throw-and-catch
 * across an async boundary that returns a code).
 */
export function classifyConvexError(err: unknown): {
  code: ErrorCode;
  raw: string;
} {
  const raw = extractRaw(err);
  return { code: classify(raw), raw };
}

/** Get the translation key for a given code (useful for React hook variants). */
export function errorCodeToTranslationKey(code: ErrorCode): TranslationKey {
  return CODE_META[code].key;
}

/** Get the severity for a code (for toast styling — error vs warning). */
export function errorCodeSeverity(code: ErrorCode): ErrorSeverity {
  return CODE_META[code].severity;
}
