/**
 * Sentry client-side init (browser).
 *
 * Env-gate: if NEXT_PUBLIC_SENTRY_DSN is missing/empty, Sentry.init() is
 * never called and the SDK registers no global handlers / fetch wrappers /
 * navigation listeners. Zero network traffic in stub mode.
 *
 * Sentry v10 adds `captureRouterTransitionStart` for the App Router — we
 * conditionally export it so router transitions are instrumented when Sentry
 * is active, and a plain no-op when it isn't.
 *
 * Reference: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
import * as Sentry from "@sentry/nextjs";

if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Stub mode — no DSN, no init, no network. Intentional no-op.
} else {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    debug: false,
    // Reasonable default for stub: only capture session replays on error in
    // case we flip a DSN on later. Keep replay sample rates at 0 so no replay
    // traffic occurs without an explicit prod tune.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

// Sentry v10 App Router transition hook. When Sentry is disabled, this is a
// no-op function — Next.js still calls it but nothing happens client-side.
export const onRouterTransitionStart = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? Sentry.captureRouterTransitionStart
  : () => {};
