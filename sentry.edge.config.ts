/**
 * Sentry edge runtime init (Vercel Edge Functions + Middleware).
 *
 * Env-gate: zero traffic when NEXT_PUBLIC_SENTRY_DSN is empty. Loaded by
 * Next.js via `src/instrumentation.ts` when `NEXT_RUNTIME === "edge"`.
 */
import * as Sentry from "@sentry/nextjs";

import { SENTRY_TRACES_SAMPLE_RATE } from "./sentry.constants";

if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Stub mode — no DSN, no init, no network. Intentional no-op.
} else {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate:
      process.env.NODE_ENV === "development" ? 1.0 : SENTRY_TRACES_SAMPLE_RATE,
    debug: false,
  });
}
