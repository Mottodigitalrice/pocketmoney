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

## Manual recovery

The weekly Save-interest cron (`internal.functions.wallets.creditWeeklySaveInterest`,
Mon 10:00 UTC) automatically backfills up to **4 weeks** of missed runs on
every fire — the current Monday plus the 3 prior Mondays. Each (child, week)
credit is idempotent: re-running same-day, mid-week, or even the following
week is a no-op for any (child, week) that already has an `interest`
transaction in `[weekStart, weekStart+7d)`.

If a Convex deploy is paused longer than ~1 month (vacation, billing lapse,
forgotten environment), the auto-backfill window won't be enough. A parent
can manually invoke recovery for a specific past week from the Convex
dashboard:

1. Open the Convex dashboard for the affected deployment.
2. Navigate to **Functions → wallets.runInterestForWeek**.
3. Run the mutation with a single argument:
   ```json
   { "weekStartISO": "2026-04-13T00:00:00.000Z" }
   ```
   The `weekStartISO` MUST be a **Monday 00:00 UTC** ISO timestamp. The
   mutation throws if it isn't (e.g. you pass a Wednesday).
4. The response shape is:
   ```json
   { "creditedChildIds": ["..."], "skippedChildIds": ["..."] }
   ```
   `skippedChildIds` are children whose Save jar already had an `interest`
   transaction in that week (either auto-credited later or never eligible
   because of zero balance).
5. Repeat per missed week. You must run it **as the parent of the affected
   family** — the mutation gates on `getCurrentUser` and only iterates the
   calling family's children, so cross-tenant credit is impossible.

### Sanity check before running

Before invoking, confirm the missed week by querying `transactions` in the
dashboard for the affected child:

```
table: transactions
filter: childId == <id> AND type == "interest"
```

If you don't see a row with `createdAt` in `[weekStart, weekStart+7d)`,
the week is genuinely missed and safe to recover. If you do see one,
running `runInterestForWeek` is still safe (it'll just skip), but it
means the cron already credited that week and no action is needed.

### Photo-proof cleanup

The photo-proof cleanup cron is self-healing: each run sweeps any approved
instance with an undeleted proof older than 14 days, up to a 90-day
lookback. No manual mutation exists for this — if a proof somehow lingers
beyond 90 days (extremely long outage), delete the storage object via the
Convex dashboard and patch the `jobInstances` row to set `proofDeletedAt`.

## Migration Note

When this project moves to production (Supabase), see `/docs/MIGRATION-GUIDE.md`.
