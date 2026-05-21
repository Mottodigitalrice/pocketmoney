/**
 * Next.js instrumentation entry point.
 *
 * Loaded once at server start. Routes to the correct Sentry config based on
 * the runtime that's booting. The configs themselves are env-gated, so this
 * file is safe to keep wired in stub mode (no DSN → no Sentry.init()).
 *
 * Reference: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * Sentry v10 hook for capturing errors thrown inside RSCs and route handlers.
 * Env-gated — the dynamic import only runs when a DSN is present, so this is
 * a true no-op in stub mode (no SDK code is even loaded).
 */
type RequestInfo = {
  path: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
};

type ErrorContext = {
  routerKind: string;
  routePath: string;
  routeType: string;
};

export async function onRequestError(
  err: unknown,
  request: RequestInfo,
  context: ErrorContext,
): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
}
