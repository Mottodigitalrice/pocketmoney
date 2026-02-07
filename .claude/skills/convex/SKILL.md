---
name: convex
description: Use this skill when working with Convex database—schema definitions, queries, mutations, real-time subscriptions, and React hooks (useQuery, useMutation).
---

# Convex Database Skill

## Overview
This project uses Convex as the database layer. Convex provides real-time, reactive data with TypeScript-first development.

## Key Concepts

### Schema (`convex/schema.ts`)
Define tables and their types:
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
});
```

### Queries (read data - reactive)
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
```

### Mutations (write data)
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
    });
  },
});
```

### React Usage
```typescript
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function TaskList({ userId }) {
  const tasks = useQuery(api.functions.tasks.get, { userId });
  const createTask = useMutation(api.functions.tasks.create);

  // tasks updates in real-time automatically!
  return (
    <div>
      {tasks?.map(task => <div key={task._id}>{task.title}</div>)}
      <button onClick={() => createTask({ title: "New", userId })}>
        Add
      </button>
    </div>
  );
}
```

## Convex Value Types
- `v.string()` - String
- `v.number()` - Number
- `v.boolean()` - Boolean
- `v.id("tableName")` - Reference to another table
- `v.array(v.string())` - Array
- `v.object({ ... })` - Nested object
- `v.optional(v.string())` - Optional field
- `v.union(v.literal("a"), v.literal("b"))` - Enum

## Project Structure
```
convex/
├── schema.ts           # Database schema
├── functions/          # Organized by feature
│   ├── users.ts        # User queries/mutations
│   └── items.ts        # Item CRUD
└── _generated/         # Auto-generated (don't edit)
```

## Commands
```bash
npx convex dev      # Start dev server
npx convex deploy   # Deploy to production
npx convex dashboard # Open web dashboard
```

## Migration Note
When moving to production (Supabase), see `/docs/MIGRATION-GUIDE.md`.
