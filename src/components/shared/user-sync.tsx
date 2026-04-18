"use client";

import { useUserSync } from "@/hooks/use-user-sync";

const hasDataProviders = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CONVEX_URL
);

/**
 * Invisible component that syncs Clerk user to Convex.
 * Place in a layout that wraps authenticated pages.
 */
export function UserSync() {
  if (!hasDataProviders) {
    return null;
  }

  return <UserSyncInner />;
}

function UserSyncInner() {
  useUserSync();
  return null;
}
