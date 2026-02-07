# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Next.js App                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │    │
│  │  │  App Router  │  │  API Routes  │  │ Middleware│  │    │
│  │  │  (pages)     │  │  (/api/*)    │  │  (auth)   │  │    │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐         ┌────▼────┐
    │  Clerk  │          │ Convex  │         │OpenRouter│
    │  (Auth) │          │  (DB)   │         │  (AI)   │
    └─────────┘          └─────────┘         └─────────┘
```

## Request Flow

### Authenticated Page Request
1. Browser requests `/dashboard`
2. Middleware checks Clerk session
3. If no session → redirect to `/sign-in`
4. If valid → render server component
5. Server component can call Convex directly

### Data Mutation Flow
1. User action triggers mutation
2. Client calls `useMutation(api.functions.xxx.create)`
3. Convex validates args with Zod-like validators
4. Convex runs mutation handler
5. All subscribed `useQuery` hooks update automatically

### AI Request Flow
1. Client sends POST to `/api/ai`
2. API route validates user session
3. Calls OpenRouter with selected model
4. Returns response (streaming or complete)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Public auth pages
│   │   ├── sign-in/        # Clerk sign-in
│   │   └── sign-up/        # Clerk sign-up
│   ├── (dashboard)/        # Protected pages
│   │   ├── layout.tsx      # Dashboard shell
│   │   └── page.tsx        # Main dashboard
│   ├── api/                # API routes
│   │   └── ai/route.ts     # AI endpoint
│   ├── layout.tsx          # Root layout (providers)
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Header, Sidebar, Footer
│   ├── shared/             # Reusable components
│   └── features/           # Feature-specific components
├── lib/                    # Utilities
│   ├── utils.ts            # General utilities
│   └── openrouter.ts       # AI client
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript types

convex/
├── schema.ts               # Database schema
├── functions/              # Queries & mutations
│   ├── users.ts
│   └── [feature].ts
└── _generated/             # Auto-generated (don't edit)
```

## Key Patterns

### Server vs Client Components

**Server Components (default):**
- Fetch data directly
- Access server-only resources
- No interactivity

**Client Components ("use client"):**
- User interactions
- Browser APIs
- Convex hooks (useQuery, useMutation)

### Data Fetching

```typescript
// Server Component - direct query
export default async function Page() {
  const data = await fetchQuery(api.items.list);
  return <ItemList items={data} />;
}

// Client Component - reactive query
"use client";
export function ItemList() {
  const items = useQuery(api.items.list);
  // Automatically updates when data changes
}
```

### Authentication Patterns

```typescript
// Server-side
import { auth } from "@clerk/nextjs/server";
const { userId } = await auth();

// Client-side
import { useUser } from "@clerk/nextjs";
const { user, isLoaded } = useUser();
```

## Environment Boundaries

| Variable | Where Used | Prefix |
|----------|------------|--------|
| Clerk Publishable Key | Client | `NEXT_PUBLIC_` |
| Clerk Secret Key | Server only | none |
| Convex URL | Client | `NEXT_PUBLIC_` |
| OpenRouter Key | Server only | none |
