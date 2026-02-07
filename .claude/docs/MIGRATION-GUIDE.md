# Migration Guide: Demo (Convex) → Production (Supabase)

## Overview

When a client signs a paid contract, we migrate from this demo stack to the production stack.

| Component | Demo | Production | Migration Effort |
|-----------|------|------------|------------------|
| Database | Convex | Supabase | Medium |
| Auth | Clerk | Clerk | None |
| Frontend | Next.js | Next.js | Minor changes |
| AI | OpenRouter | OpenRouter | None |
| Deployment | Vercel | Vercel | None |

## What Changes

### 1. Database Schema

**Convex (`convex/schema.ts`):**
```typescript
users: defineTable({
  clerkId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  createdAt: v.number(),
}).index("by_clerk_id", ["clerkId"])
```

**Supabase (SQL):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
```

### 2. Queries

**Convex:**
```typescript
const user = useQuery(api.functions.users.getByClerkId, { clerkId });
```

**Supabase:**
```typescript
const { data: user } = await supabase
  .from("users")
  .select("*")
  .eq("clerk_id", clerkId)
  .single();
```

### 3. Mutations

**Convex:**
```typescript
const createItem = useMutation(api.functions.items.create);
await createItem({ title: "New Item", userId });
```

**Supabase:**
```typescript
const { data, error } = await supabase
  .from("items")
  .insert({ title: "New Item", user_id: userId })
  .select()
  .single();
```

### 4. Real-time

**Convex:** Built into `useQuery` automatically.

**Supabase:**
```typescript
const channel = supabase
  .channel("items")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "items"
  }, (payload) => {
    // Handle change
  })
  .subscribe();
```

## Migration Checklist

- [ ] Create Supabase project
- [ ] Export Convex data (if any production data exists)
- [ ] Create Supabase tables matching schema
- [ ] Update environment variables
- [ ] Replace Convex provider with Supabase provider
- [ ] Convert all queries/mutations
- [ ] Add real-time subscriptions where needed
- [ ] Test all features
- [ ] Deploy and verify

## Data Export from Convex

```bash
# Export data from Convex dashboard
npx convex dashboard
# Navigate to Data > Export
```

## Environment Variables to Change

Remove:
```env
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
```

Add:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Files to Modify

1. `src/app/layout.tsx` - Replace ConvexClientProvider with Supabase provider
2. `src/components/providers/` - Create supabase-provider.tsx
3. All components using `useQuery`/`useMutation` from Convex
4. Delete `convex/` folder after migration is complete
