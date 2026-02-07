# Convex Database

This project uses Convex for the database layer.

## Structure

- `schema.ts` - Database schema definition
- `functions/` - Query and mutation functions organized by feature
- `_generated/` - Auto-generated types (don't edit)

## Common Commands

```bash
# Start development server (syncs schema, generates types)
npx convex dev

# Deploy to production
npx convex deploy

# Open Convex dashboard
npx convex dashboard
```

## Patterns Used

### Queries (read data)
```typescript
export const getItems = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.query("items").collect();
  },
});
```

### Mutations (write data)
```typescript
export const createItem = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("items", { title: args.title });
  },
});
```

### Real-time
Queries are automatically real-time. Use `useQuery` in React and data updates instantly.

## Migration Note

When this project moves to production (Supabase), see `/docs/MIGRATION-GUIDE.md`.
