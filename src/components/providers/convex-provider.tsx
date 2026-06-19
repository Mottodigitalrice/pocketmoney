"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

// Sanitize a raw `NEXT_PUBLIC_CONVEX_URL`. A misconfigured deploy can land a
// whitespace- or newline-corrupted URL in the env var (e.g.
// `"https://...convex.cloud\n"`). Because such a string is truthy, the old
// `url ? new ConvexReactClient(url) : null` happily built a *broken* client
// with a bad WebSocket endpoint — every `useQuery` then hung forever.
//
// PURE + side-effect-free (no logging) so it is cleanly unit-testable: returns
// the trimmed URL if it parses as a valid absolute URL, else `null`. The
// invalid-but-present logging stays in `makeConvexClient` below.
export function sanitizeConvexUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    new URL(trimmed);
  } catch {
    return null;
  }
  return trimmed;
}

// Build the Convex client defensively, falling back to the safe no-client path
// when the URL is corrupted, and logging (dev-visible) so the failure is
// observable when an invalid-but-present value was supplied.
function makeConvexClient(): ConvexReactClient | null {
  const trimmed = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const url = sanitizeConvexUrl(trimmed);
  if (!url) {
    // Only an invalid-but-present value is worth flagging — an absent/empty
    // var is the legitimate no-Convex configuration.
    if (trimmed) {
      console.error("Invalid NEXT_PUBLIC_CONVEX_URL:", JSON.stringify(trimmed));
    }
    return null;
  }
  return new ConvexReactClient(url);
}

const convex = makeConvexClient();
// Validated availability: true only when the URL passed trim + URL-parse
// validation and a real ConvexReactClient was built. Consumers (e.g.
// PocketMoneyProvider's `hasDataProviders`) MUST key off this rather than the
// raw env var so a truthy-but-invalid URL doesn't render the inner provider
// without a Convex client ancestor.
export const convexClientAvailable = convex !== null;
const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex || !clerkPublishableKey) {
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
