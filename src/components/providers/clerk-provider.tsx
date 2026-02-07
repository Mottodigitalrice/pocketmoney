"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

export function ClerkClientProvider({ children }: { children: ReactNode }) {
  // Check if Clerk is configured
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If not configured, just render children without Clerk
  if (!publishableKey) {
    return <>{children}</>;
  }

  return <BaseClerkProvider>{children}</BaseClerkProvider>;
}
