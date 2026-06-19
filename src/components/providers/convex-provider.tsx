"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

// Build the Convex client defensively. A misconfigured deploy can land a
// whitespace- or newline-corrupted URL in `NEXT_PUBLIC_CONVEX_URL` (e.g.
// `"https://...convex.cloud\n"`). Because such a string is truthy, the old
// `url ? new ConvexReactClient(url) : null` happily built a *broken* client
// with a bad WebSocket endpoint — every `useQuery` then hung forever. We trim
// and validate the URL so a corrupted value falls back to the safe no-client
// path instead, and log it (dev-visible) so the failure is observable.
function makeConvexClient(): ConvexReactClient | null {
  const raw = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!raw) return null;
  try {
    new URL(raw);
  } catch {
    console.error("Invalid NEXT_PUBLIC_CONVEX_URL:", JSON.stringify(raw));
    return null;
  }
  return new ConvexReactClient(raw);
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
