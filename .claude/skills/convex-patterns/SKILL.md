---
name: convex-patterns
description: Convex database patterns for Next.js 16 — schema, queries, mutations, actions, real-time hooks, progressive data capture, and build-time considerations. Use this skill when working with Convex.
---

# Convex Database Patterns

## Overview
Convex provides real-time, reactive data with TypeScript-first development. All data operations are defined in the `convex/` directory and auto-generate type-safe APIs.

## Schema (`convex/schema.ts`)

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  tasks: defineTable({
    title: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
    ),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});
```

### Value Types
| Type | Usage |
|------|-------|
| `v.string()` | String |
| `v.number()` | Number |
| `v.boolean()` | Boolean |
| `v.id("tableName")` | Reference to another table |
| `v.array(v.string())` | Array of strings |
| `v.object({ key: v.string() })` | Nested object |
| `v.optional(v.string())` | Optional field |
| `v.union(v.literal("a"), v.literal("b"))` | Enum/union type |
| `v.null()` | Explicit null |

**Important:** When changing field types (e.g., `v.string()` to `v.array(v.string())`), existing data keeps the old type. Handle both in queries:
```typescript
// Backward-compatible array field display
const value = record.tags;
const display = Array.isArray(value) ? value.join(", ") : value || "None";
```

## Queries (Read — Reactive)

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Query with filtering
export const byStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

// Aggregation query
export const stats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("tasks").collect();
    return {
      total: all.length,
      active: all.filter((t) => t.status === "active").length,
      completed: all.filter((t) => t.status === "completed").length,
    };
  },
});
```

## Mutations (Write)

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { title: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      title: args.title,
      completed: false,
      userId: args.userId,
      status: "active",
    });
  },
});

// Upsert pattern (check existing, update or insert)
export const upsertByEmail = mutation({
  args: { email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { name: args.name });
      return existing._id;
    }
    return await ctx.db.insert("leads", { email: args.email, name: args.name });
  },
});
```

## Actions (External APIs)

Actions can call external services. They cannot directly read/write the DB — use `ctx.runQuery` / `ctx.runMutation`.

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const submitToWebhook = action({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const lead = await ctx.runQuery(api.functions.leads.getById, { id: args.leadId });
    if (!lead) throw new Error("Lead not found");

    await fetch("https://n8n.example.com/webhook/xxx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
  },
});
```

## React Usage

### CRITICAL: Build-Time Safety
Convex hooks (`useQuery`, `useMutation`, `useAction`) require `ConvexProvider` at runtime. At build time, providers aren't mounted, so any page using these hooks will fail prerendering.

**Always add `force-dynamic` to the parent layout.** See `nextjs16-core.md` for details.

### useQuery (Real-Time)
```typescript
"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function TaskList({ userId }) {
  const tasks = useQuery(api.functions.tasks.list, { userId });

  if (tasks === undefined) return <Skeleton />; // Loading
  if (tasks.length === 0) return <EmptyState />;

  return tasks.map((task) => <TaskItem key={task._id} task={task} />);
}
```

### useMutation
```typescript
"use client";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function CreateButton() {
  const create = useMutation(api.functions.tasks.create);

  const handleClick = async () => {
    try {
      await create({ title: "New task", userId });
      // UI updates automatically via reactive query
    } catch (error) {
      toast.error("Failed to create");
    }
  };

  return <button onClick={handleClick}>Create</button>;
}
```

### useAction
```typescript
const submitWebhook = useAction(api.functions.leads.submitToWebhook);
await submitWebhook({ leadId });
```

## Progressive Data Capture Pattern

For multi-step forms that save progress as the user advances:

```typescript
// Step 1: Create minimal record
export const createPartial = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { currentStep: 1, updatedAt: Date.now() });
      return existing._id;
    }

    return await ctx.db.insert("leads", {
      email: args.email,
      status: "partial",
      currentStep: 1,
      createdAt: Date.now(),
    });
  },
});

// Steps 2-N: Patch additional fields
export const updatePartial = mutation({
  args: {
    leadId: v.id("leads"),
    fields: v.any(), // Flexible update
    currentStep: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leadId, {
      ...args.fields,
      currentStep: args.currentStep,
      updatedAt: Date.now(),
    });
  },
});

// Final: Mark complete
export const finalize = mutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leadId, { status: "new" });
  },
});
```

## Project Structure

```
convex/
├── schema.ts              # Database schema (single source of truth)
├── functions/             # Organized by feature
│   ├── users.ts           # User queries/mutations
│   ├── tasks.ts           # Task CRUD
│   └── leads.ts           # Lead lifecycle
├── _generated/            # Auto-generated (never edit)
│   ├── api.d.ts
│   └── server.d.ts
└── convex.config.ts       # Convex config
```

## Commands

```bash
npx convex dev           # Start dev server (watches for changes)
npx convex deploy        # Deploy to production
npx convex dev --once    # Type-check without starting server
npx convex dashboard     # Open web dashboard
```

## User Sync with Clerk

Sync Clerk users to Convex via a client-side `useEffect`:

```typescript
// src/components/shared/user-sync.tsx
"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
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
