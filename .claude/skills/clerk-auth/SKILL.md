---
name: clerk-auth
description: Clerk authentication patterns — sign-in/up flows, middleware protection, server/client auth, user sync strategies (Convex vs Supabase), and Vercel preview deploy considerations. Use this skill when working with Clerk.
---

# Clerk Authentication Patterns

## Overview
Clerk provides pre-built authentication UI and works with both Convex (Demo template) and Supabase (MVP template). The integration patterns differ by database.

## Provider Setup

Already configured in `src/app/layout.tsx`:
```typescript
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        {children}
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
```

## Middleware (`src/middleware.ts`)

Protects all routes by default. Public routes must be explicitly listed:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/audit(.*)",
  "/privacy(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**When adding new public pages, always update middleware.**

## Server-Side Auth

```typescript
import { auth, currentUser } from "@clerk/nextjs/server";

// In Server Components or API routes
export default async function Page() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return <div>Hello {user?.firstName}</div>;
}
```

## Client-Side Auth

```typescript
"use client";
import { useUser, useAuth } from "@clerk/nextjs";

function Profile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();

  if (!isLoaded) return <Skeleton />;
  if (!isSignedIn) return <div>Not signed in</div>;

  return <div>Hello {user.firstName}</div>;
}
```

**CRITICAL:** Client hooks (`useUser`, `useAuth`) require `ClerkProvider`. Pages using them will fail Next.js 16 prerendering. Add `force-dynamic` to the parent layout. See `nextjs16-core.md`.

## Pre-Built Components

```typescript
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

// Sign in/up buttons (for unauthenticated users)
<SignInButton mode="modal" />
<SignUpButton mode="modal" />

// User dropdown (for authenticated users)
<UserButton afterSignOutUrl="/" />
```

## User Sync Strategies

### Strategy 1: Client-Side Sync (Convex / Demo Template)
User data synced to Convex via `useEffect` on the client:

```typescript
// src/components/shared/user-sync.tsx
"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";

export function UserSync() {
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

Place `<UserSync />` inside an authenticated layout.

### Strategy 2: Webhook Sync (Supabase / MVP Template)
User data synced via Clerk webhook → Supabase:

1. Clerk sends POST to `/api/webhooks/clerk` on user events
2. Handler verifies signature (svix) and upserts to `users` table
3. No client-side sync code needed

See `supabase-patterns.md` for the full webhook handler.

**Webhook setup:**
1. Clerk Dashboard → Webhooks → Create endpoint
2. URL: `https://your-domain.com/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret → `CLERK_WEBHOOK_SECRET`

## Vercel Preview Deploys

### Deployment Protection
Vercel enables **Deployment Protection** on preview deploys by default, returning HTTP 401 for unauthenticated requests. This blocks Clerk's auth flow.

**Options:**
1. **Deploy to production** instead of preview for testing
2. **Disable Deployment Protection** in Vercel → Settings → Deployment Protection → Standard Protection → Off
3. **Whitelist Clerk domains** in Vercel's protection bypass

### Preview Webhook URLs
Preview URLs change with each deploy. For Clerk webhooks on previews:
- Use a stable URL (e.g., ngrok tunnel or production webhook endpoint)
- Or test webhook flows only on production deploys

## Environment Variables

```env
# Required (all templates)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# MVP template only (webhook sync)
CLERK_WEBHOOK_SECRET=whsec_...
```

## Get Keys
1. Go to https://dashboard.clerk.com
2. Create or select project
3. Copy keys from "API Keys" section
4. For MVP template: set up webhook and copy signing secret
