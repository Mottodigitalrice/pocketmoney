# Setting Up a New Demo Project

## Quick Start

1. **Clone this template:**
   ```bash
   git clone [this-repo-url] my-new-demo
   cd my-new-demo
   rm -rf .git
   git init
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Convex:**
   ```bash
   npx convex dev
   # Create new project when prompted
   ```

4. **Set up Clerk:**
   - Go to https://dashboard.clerk.com
   - Create new application
   - Copy keys to `.env.local`

5. **Set up OpenRouter:**
   - Go to https://openrouter.ai/keys
   - Copy API key to `.env.local`

6. **Start development:**
   ```bash
   npm run dev
   # In another terminal:
   npx convex dev
   ```

## Customization Checklist

- [ ] Update `package.json` name
- [ ] Update page titles in `src/app/layout.tsx`
- [ ] Customize landing page (`src/app/page.tsx`)
- [ ] Modify color scheme in `src/app/globals.css`
- [ ] Update sidebar navigation (`src/components/layout/sidebar.tsx`)
- [ ] Modify Convex schema for project needs (`convex/schema.ts`)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Convex (auto-filled by `npx convex dev`)
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=

# Clerk (from dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# OpenRouter (from openrouter.ai/keys)
OPENROUTER_API_KEY=
```

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── (auth)/             # Sign in/up pages
│   ├── (dashboard)/        # Protected pages
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn components
│   ├── layout/             # Header, Sidebar
│   ├── shared/             # Reusable components
│   └── features/           # Feature components
├── lib/                    # Utilities
└── types/                  # TypeScript types

convex/
├── schema.ts               # Database schema
└── functions/              # Queries & mutations
```

## Adding Features

### 1. Add a new database table

Edit `convex/schema.ts`:
```typescript
export default defineSchema({
  // ... existing tables
  newTable: defineTable({
    field1: v.string(),
    field2: v.number(),
  }).index("by_field1", ["field1"]),
});
```

### 2. Create functions

Create `convex/functions/newTable.ts`:
```typescript
import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("newTable").collect();
  },
});

export const create = mutation({
  args: { field1: v.string(), field2: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("newTable", args);
  },
});
```

### 3. Create UI components

Create `src/components/features/new-feature/`:
- `list.tsx` - Display items
- `form.tsx` - Create/edit form
- `item.tsx` - Single item display

### 4. Add page

Create `src/app/(dashboard)/new-feature/page.tsx`

### 5. Update navigation

Edit `src/components/layout/sidebar.tsx` to add the new route.

## Deployment

### Vercel (Frontend)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Convex (Backend)

```bash
npx convex deploy
```

## Troubleshooting

### "Convex functions not found"
Run `npx convex dev` to sync schema and generate types.

### "Clerk middleware error"
Check that `CLERK_SECRET_KEY` is set correctly.

### "OpenRouter API error"
Verify `OPENROUTER_API_KEY` is valid and has credits.
