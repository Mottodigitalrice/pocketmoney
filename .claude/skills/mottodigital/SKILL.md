---
name: mottodigital
description: Use this skill for Mottodigital project conventions—file naming, folder structure, code style, feature patterns, and business context for Japanese SMB clients.
---

# Mottodigital Project Skill

## Business Context

This is a **demo/POC project** for Mottodigital, an AI consulting company in Tokyo, Japan.

### Business Model
1. **Demo Phase** (this template): Free POC to show value
2. **Production Phase**: Paid collaborative build (separate Supabase template)
3. **Handoff Phase**: Clean transfer to client's developers

### Philosophy
"Amplify, not replace" - AI enhances human workers, doesn't replace them.

### Target Clients
Japanese SMBs with 10-20 staff who want ethical AI implementation.

## Tech Stack

| Component | Tool | Notes |
|-----------|------|-------|
| Framework | Next.js 14+ | App Router, TypeScript |
| Database | Convex | Free tier, real-time |
| Auth | Clerk | Works with Convex AND Supabase |
| UI | shadcn/ui | With Tailwind CSS |
| AI | OpenRouter | OpenAI-compatible API |
| Icons | Lucide React | Standard |
| Deployment | Vercel | Free tier |

## Project Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `TaskList.tsx`)
- Utilities: `kebab-case.ts` (e.g., `date-utils.ts`)
- Convex functions: `camelCase.ts` organized in folders

### Folder Structure
```
src/
├── app/                    # Next.js pages and layouts
│   ├── (auth)/             # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/        # Protected dashboard pages
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn components
│   ├── layout/             # Header, Sidebar, Footer
│   ├── shared/             # Reusable components
│   └── features/           # Feature-specific components
├── lib/                    # Utilities and configurations
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript types

convex/
├── schema.ts               # Database schema
├── functions/              # Organized by feature
└── _generated/             # Auto-generated (don't edit)
```

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Server components by default, "use client" only when needed
- Japanese comments OK for client-facing code

## Migration Awareness

This demo uses Convex. When moving to production:
1. Database migrates to Supabase
2. Auth (Clerk) stays the same
3. Frontend components stay the same
4. See `/docs/MIGRATION-GUIDE.md`

## Common Patterns

### Adding a New Feature
1. Define schema in `convex/schema.ts`
2. Create functions in `convex/functions/[feature].ts`
3. Create components in `src/components/features/[feature]/`
4. Add page in `src/app/(dashboard)/[feature]/page.tsx`
5. Add to sidebar navigation in `src/components/layout/sidebar.tsx`

### Integrating AI
1. Use `/api/ai` endpoint
2. Select appropriate model based on task:
   - `fast`: Simple tasks, cheap
   - `smart`: Complex reasoning
   - `japanese`: Japanese language
3. Always authenticate requests (handled by middleware)

### Creating Forms
1. Use shadcn form components
2. Validate with Zod schemas
3. Use Convex mutations to save data
4. Show loading states with skeleton components

## Design Principles

- Clean, professional UI (not flashy)
- Mobile-responsive layouts
- Accessible (WCAG 2.1 AA)
- Fast loading (< 3s initial load)
- Japanese-friendly fonts and spacing
