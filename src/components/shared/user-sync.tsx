"use client";

import { useUserSync } from "@/hooks/use-user-sync";

/**
 * Invisible component that syncs Clerk user to Convex.
 * Place in a layout that wraps authenticated pages.
 */
export function UserSync() {
  useUserSync();
  return null;
}
