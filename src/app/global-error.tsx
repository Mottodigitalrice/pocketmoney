"use client";

/**
 * Next.js top-level error boundary. Wraps the entire app (including
 * `layout.tsx`) so we can render fallback UI for crashes that escape the
 * per-segment `error.tsx`.
 *
 * Sentry hook is env-gated: `captureException` is a no-op when no DSN was
 * configured at startup, so stub mode is safe.
 *
 * Reference: https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      Sentry.captureException(error, {
        tags: {
          type: "global-boundary",
          digest: error.digest,
        },
      });
    } catch {
      // Sentry not initialized (stub mode) — swallow silently. Console is
      // still populated by Next.js's own error logger.
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#451a03",
          color: "#fef3c7",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
            }}
            aria-hidden="true"
          >
            ⚓
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              marginBottom: "0.75rem",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
            The ship hit choppy waters. Please reload the page.
          </p>
          {error.digest && (
            <p
              data-testid="global-error-digest"
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: "0.75rem",
                opacity: 0.6,
              }}
            >
              ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
