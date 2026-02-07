---
name: clerk
description: Use this skill when working with Clerk authentication—sign-in/sign-up flows, middleware protection, server-side auth, client-side hooks, and user sync with Convex.
---

# Clerk Authentication Skill

## Overview
This project uses Clerk for authentication. Clerk provides pre-built UI components and works with both Convex (demo) and Supabase (production).

## Key Components

### ClerkProvider
Already set up in `src/app/layout.tsx`. Wraps entire app.

### Sign In/Up Pages
Pre-built at `/sign-in` and `/sign-up`.

### Middleware (`src/middleware.ts`)
Protects routes. Public routes defined in `isPublicRoute` matcher.

### Server-Side Auth
```typescript
import { auth, currentUser } from "@clerk/nextjs/server";

// In Server Components or API routes
export default async function Page() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }
}
```

### Client-Side Auth
```typescript
"use client";
import { useUser, useAuth } from "@clerk/nextjs";

function Profile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Not signed in</div>;

  return <div>Hello {user.firstName}</div>;
}
```

### UserButton Component
```typescript
import { UserButton } from "@clerk/nextjs";

// Dropdown with user avatar, profile, sign out
<UserButton afterSignOutUrl="/" />
```

## Syncing Users with Convex

When a user signs in, sync their data to Convex:
```typescript
"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

function UserSync() {
  const { user, isSignedIn } = useUser();
  const upsertUser = useMutation(api.functions.users.upsertFromClerk);

  useEffect(() => {
    if (isSignedIn && user) {
      upsertUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || undefined,
        imageUrl: user.imageUrl || undefined,
      });
    }
  }, [isSignedIn, user, upsertUser]);

  return null;
}
```

## Environment Variables
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Get Keys
1. Go to https://dashboard.clerk.com
2. Create or select project
3. Copy keys from "API Keys" section
