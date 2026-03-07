---
name: zod-v4
description: Zod v4 validation patterns — schema definitions, error handling, and breaking changes from v3. Use this skill when writing form validation, API input validation, or any Zod schemas.
---

# Zod v4 Validation Patterns

## Overview
Our projects use **Zod v4** (4.x). Zod v4 has significant API changes from v3. Using v3 patterns will cause TypeScript errors.

## Breaking Changes from v3

### Email Validation
```typescript
// WRONG (v3 — deprecated in v4)
z.string().email("Invalid email");

// CORRECT (v4)
z.string().check(z.email({ message: "Please enter a valid email" }));
```

### Literal with Custom Error
```typescript
// WRONG (v3)
z.literal(true, { errorMap: () => ({ message: "Required" }) });

// CORRECT (v4)
z.literal(true, { message: "You must accept the privacy policy" });
```

### Error Access
```typescript
// WRONG (v3)
const result = schema.safeParse(data);
if (!result.success) {
  const message = result.error.errors[0]?.message; // .errors doesn't exist in v4
}

// CORRECT (v4)
const result = schema.safeParse(data);
if (!result.success) {
  const message = result.error.issues[0]?.message; // Use .issues
}
```

### URL Validation
```typescript
// WRONG (v3)
z.string().url("Invalid URL");

// CORRECT (v4)
z.string().check(z.url({ message: "Please enter a valid URL" }));
```

## Common Schema Patterns

### Basic Types
```typescript
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().check(z.email({ message: "Invalid email" })),
  age: z.number().min(18, "Must be 18+"),
  website: z.optional(z.string().check(z.url({ message: "Invalid URL" }))),
  agreed: z.literal(true, { message: "Must agree to terms" }),
});
```

### Enum / Union
```typescript
const statusSchema = z.union([
  z.literal("draft"),
  z.literal("active"),
  z.literal("completed"),
]);

// Or using z.enum for string enums
const roleSchema = z.enum(["admin", "user", "guest"]);
```

### Arrays
```typescript
const tagsSchema = z.array(z.string()).min(1, "Select at least one");

const optionalTags = z.optional(z.array(z.string()));
```

### Conditional Validation
```typescript
// Optional field that validates format when present
const websiteSchema = z.optional(
  z.union([
    z.literal(""), // Allow empty string
    z.string().check(z.url({ message: "Invalid URL" })),
  ])
);
```

## Form Validation Pattern

### Per-Step Validation (Multi-Step Forms)
```typescript
const stepSchemas: Record<number, z.ZodType> = {
  1: z.object({
    email: z.string().check(z.email({ message: "Please enter a valid email" })),
    privacyConsent: z.literal(true, { message: "You must accept the privacy policy" }),
  }),
  2: z.object({
    name: z.string().min(1, "Please enter your name"),
    role: z.string().min(1, "Please select your role"),
  }),
  3: z.object({
    company: z.string().min(1, "Please enter your company name"),
    teamSize: z.string().min(1, "Please select team size"),
  }),
};

function validateStep(step: number, data: Record<string, unknown>): string | null {
  const schema = stepSchemas[step];
  if (!schema) return null;

  const result = schema.safeParse(data);
  if (!result.success) {
    return result.error.issues[0]?.message || "Validation failed";
  }
  return null;
}
```

### Full Form Validation
```typescript
const formSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().check(z.email({ message: "Invalid email" })),
  message: z.string().min(10, "Minimum 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

function handleSubmit(data: FormData) {
  const result = formSchema.safeParse(data);
  if (!result.success) {
    // Show all errors
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return { errors };
  }
  // result.data is typed as FormData
  return { data: result.data };
}
```

## Integration with React Hook Form

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().check(z.email({ message: "Invalid email" })),
  name: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", name: "" },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  );
}
```

**Note:** `@hookform/resolvers` must support Zod v4. Check compatibility.

## Quick Reference

| v3 (Old) | v4 (Current) |
|-----------|-------------|
| `z.string().email()` | `z.string().check(z.email())` |
| `z.string().url()` | `z.string().check(z.url())` |
| `z.string().uuid()` | `z.string().check(z.uuid())` |
| `z.literal(val, { errorMap })` | `z.literal(val, { message })` |
| `result.error.errors` | `result.error.issues` |
| `z.string().regex()` | `z.string().check(z.regex())` |
