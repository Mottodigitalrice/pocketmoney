"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";

/**
 * Syncs the current Clerk user to the Convex database.
 * Call this once in a layout that wraps authenticated pages.
 */
export function useUserSync() {
  const { user, isSignedIn, isLoaded } = useUser();
  const upsertUser = useMutation(api.functions.users.upsertFromClerk);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || hasSynced.current) {
      return;
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) return;

    upsertUser({
      clerkId: user.id,
      email,
      name: user.fullName || undefined,
      imageUrl: user.imageUrl || undefined,
    });

    hasSynced.current = true;
  }, [isLoaded, isSignedIn, user, upsertUser]);
}
