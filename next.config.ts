import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

/**
 * Sentry wrapping — env-gated so it's a structural no-op in stub mode:
 *  - org/project default to empty strings (no upload destination)
 *  - source-map upload only runs when SENTRY_AUTH_TOKEN is present
 *  - silent mode keeps `next build` logs clean
 *
 * This wrapping does NOT cause network traffic at build time when
 * SENTRY_AUTH_TOKEN is unset — the Sentry webpack/turbopack plugin skips
 * upload entirely without credentials.
 */
const sentryBuildOptions = {
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
  // authToken is intentionally spread-in only when present — under
  // `exactOptionalPropertyTypes: true` we can't pass `undefined` for it.
  ...(process.env.SENTRY_AUTH_TOKEN
    ? { authToken: process.env.SENTRY_AUTH_TOKEN }
    : {}),
  silent: true,
  widenClientFileUpload: true,
  // Source-map upload is gated on the auth token. Without it, the Sentry
  // build plugin runs but performs no remote calls.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Don't emit telemetry from the build plugin itself.
  telemetry: false,
};

export default withSentryConfig(nextConfig, sentryBuildOptions);
