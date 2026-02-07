# Conventions

## Workflow

### For New Features
1. **Plan first** - Enter Plan Mode, create PRD
2. **Break into tasks** - Use TaskCreate to track work
3. **Build incrementally** - Small commits, test as we go
4. **Explain what you did** - Help me learn

### For Bug Fixes
1. Understand the issue - ask me questions
2. Find the root cause - show me where/why
3. Fix it - explain the fix
4. Verify it works

## File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `TaskList.tsx` |
| Utilities | kebab-case | `date-utils.ts` |
| Convex functions | camelCase | `tasks.ts` |
| Pages | lowercase | `page.tsx` |
| Layouts | lowercase | `layout.tsx` |

## Code Style

### TypeScript
- Strict mode enabled
- Explicit return types on exported functions
- Use `interface` for objects, `type` for unions

### React
- Functional components with hooks
- Server components by default
- `"use client"` only when needed
- Destructure props in function signature

### Imports Order
1. React/Next imports
2. External libraries
3. Internal modules (`@/`)
4. Relative imports
5. Types (last)

## Component Patterns

### File Structure
```
src/components/features/tasks/
├── TaskList.tsx        # Main component
├── TaskItem.tsx        # Child component
├── TaskForm.tsx        # Form component
└── index.ts            # Barrel export
```

### Component Template
```typescript
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
}

export function TaskItem({ task, onComplete }: TaskItemProps) {
  return (
    <div className={cn("p-4", task.completed && "opacity-50")}>
      {task.title}
    </div>
  );
}
```

## Convex Patterns

### Schema
```typescript
// convex/schema.ts
export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_completed", ["completed"]),
});
```

### Queries
```typescript
// convex/functions/tasks.ts
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
```

### Mutations
```typescript
export const create = mutation({
  args: {
    title: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      ...args,
      completed: false,
    });
  },
});
```

## UI Patterns

### Loading States
```typescript
const data = useQuery(api.items.list);

if (data === undefined) {
  return <Skeleton />;
}

if (data.length === 0) {
  return <EmptyState />;
}

return <ItemList items={data} />;
```

### Forms
- Use shadcn form components
- Validate with Zod schemas
- Show loading state during submission
- Handle errors gracefully

### Navigation
- Use `<Link>` for internal navigation
- Use `useRouter` for programmatic navigation
- Prefetch critical paths

## Error Handling

### Client-Side
```typescript
try {
  await createItem({ title });
  toast.success("Item created");
} catch (error) {
  toast.error("Failed to create item");
}
```

### Server-Side
```typescript
export const create = mutation({
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }
    // ...
  },
});
```

## Git Conventions

### Commit Messages
- Use imperative mood: "Add feature" not "Added feature"
- Keep first line under 50 characters
- Reference issues when applicable

### Branch Naming
- `feature/short-description`
- `fix/issue-description`
- `chore/maintenance-task`
