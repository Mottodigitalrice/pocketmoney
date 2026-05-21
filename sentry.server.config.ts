/**
 * Sentry server-side init.
 *
 * Env-gate (rule 1 of the Wave 3 spec): if NEXT_PUBLIC_SENTRY_DSN is unset
 * or empty, Sentry.init() is NEVER called and the SDK registers no global
 * handlers. Zero network traffic. This file is loaded by Next.js via
 * `src/instrumentation.ts` when `NEXT_RUNTIME === "nodejs"`.
 */
import * as Sentry from "@sentry/nextjs";

if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Stub mode — no DSN, no init, no network. Intentional no-op.
} else {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    // Honor explicit debug opt-in only; default to silent.
    debug: false,
  });
}
