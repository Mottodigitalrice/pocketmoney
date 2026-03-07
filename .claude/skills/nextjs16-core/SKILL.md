---
name: nextjs16-core
description: Next.js 16 + React 19 core patterns — prerendering, force-dynamic, server/client boundaries, App Router conventions. Use this skill when building pages, layouts, or debugging build/deploy issues.
---

# Next.js 16 Core Patterns

## Prerendering (CRITICAL)

Next.js 16 aggressively prerenders pages at **build time** by default. Any page that uses client-side hooks (Convex, Clerk, React state) will **fail during `next build`** unless you opt out.

### The Problem
```
Error occurred prerendering page "/dashboard"
useUser can only be used within <ClerkProvider />
```
```
Error occurred prerendering page "/audit"
Could not find Convex client! useMutation must be used under ConvexProvider
```

These errors happen because Next.js tries to render the page **at build time** when no providers are mounted.

### The Fix: `force-dynamic`

Add this export to any **layout** that wraps pages using client hooks:

```typescript
// src/app/(dashboard)/layout.tsx
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

```typescript
// src/app/audit/layout.tsx
export const dynamic = "force-dynamic";

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**Rules:**
- Put `force-dynamic` on the **layout**, not the page — it cascades to all child pages
- Every route group that uses Clerk hooks (`useUser`, `useAuth`) or Convex hooks (`useQuery`, `useMutation`) needs this
- Public marketing pages (landing, privacy policy) that are pure server components do NOT need it

### What Does NOT Work

```typescript
// WRONG: ssr: false is not allowed in Server Components in Next.js 16
import dynamic from "next/dynamic";
const MyComponent = dynamic(() => import("./MyComponent"), { ssr: false });
// Error: ssr: false is not allowed with next/dynamic in Server Components
```

`next/dynamic` with `ssr: false` only works inside `"use client"` files. For route-level opt-out, use the `export const dynamic` pattern.

## Server vs Client Components

### Default: Server Components
Every `.tsx` file is a Server Component unless it has `"use client"` at the top.

**Server Components can:**
- `await` async data (fetch, DB queries)
- Access server-only APIs (`auth()`, `currentUser()`)
- Import server-only modules

**Server Components cannot:**
- Use `useState`, `useEffect`, or any React hooks
- Use browser APIs (`window`, `localStorage`)
- Use context providers (`useUser`, `useQuery`)

### Client Components
Add `"use client"` at the top of the file.

**Client Components can:**
- Use all React hooks
- Use browser APIs
- Use context (Clerk, Convex providers)

**Client Components cannot:**
- Use `async/await` at the component level
- Import server-only modules

### Pattern: Thin Page + Client Component

```typescript
// src/app/audit/page.tsx (Server Component — thin wrapper)
"use client";
import { AuditFormWizard } from "@/components/audit/audit-form-wizard";
export default function AuditPage() {
  return <AuditFormWizard />;
}
```

Or for pages that need both server and client:

```typescript
// src/app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { userId } = await auth();
  return <DashboardClient userId={userId} />;
}
```

## App Router Conventions

### Route Groups
Parenthesized folders `(name)` create logical groups without affecting the URL:
```
src/app/
├── (dashboard)/          # URL: /dashboard, /leads, etc.
│   ├── layout.tsx        # Shared sidebar + header
│   ├── page.tsx          # /dashboard
│   └── leads/page.tsx    # /leads
├── (marketing)/          # URL: /, /about, etc.
│   ├── layout.tsx        # Marketing layout
│   └── page.tsx          # /
└── audit/                # URL: /audit (standalone)
    ├── layout.tsx
    └── page.tsx
```

### Middleware (`src/middleware.ts`)
Clerk middleware protects routes. Public routes must be explicitly listed:
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
```

When adding new public pages, **always update middleware** or users will get redirected to sign-in.

### Metadata
```typescript
// Static metadata (Server Components only)
export const metadata = {
  title: "Dashboard",
  description: "Your dashboard",
};

// Dynamic metadata
export async function generateMetadata({ params }) {
  return { title: `Lead ${params.id}` };
}
```

## Turbopack

Next.js 16 defaults to Turbopack for dev and sometimes build. It can cause issues with certain dependencies.

**To disable Turbopack** (recommended for stability):
```json
// vercel.json
{
  "framework": "nextjs",
  "build": {
    "env": {
      "NEXT_DISABLE_TURBOPACK": "1"
    }
  }
}
```

## Common Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `useUser can only be used within ClerkProvider` | Prerendering a page with Clerk hooks | Add `force-dynamic` to parent layout |
| `useMutation must be used under ConvexProvider` | Prerendering a page with Convex hooks | Add `force-dynamic` to parent layout |
| `ssr: false not allowed in Server Components` | Using `next/dynamic({ ssr: false })` in a server file | Use `force-dynamic` on layout instead |
| `Module not found: Can't resolve 'fs'` | Importing server module in client component | Move to server component or API route |
| OOM during build | Not enough RAM (need 1GB+) | Use `NODE_OPTIONS=--max-old-space-size=4096` |

## CSS & Tailwind v4

Tailwind v4 uses CSS-first configuration:
```css
/* src/app/globals.css */
@import "tailwindcss";

/* Custom animations */
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
```

No `tailwind.config.ts` needed — Tailwind v4 auto-detects content paths.
