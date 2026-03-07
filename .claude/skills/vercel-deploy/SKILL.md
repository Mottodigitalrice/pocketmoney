---
name: vercel-deploy
description: Vercel deployment patterns — build troubleshooting, environment variables, preview vs production, Turbopack, and common error fixes. Use this skill when deploying to Vercel or debugging build failures.
---

# Vercel Deployment Patterns

## Build Process

Vercel runs `next build` which:
1. Compiles TypeScript
2. Prerenders static pages (this is where most errors occur)
3. Generates serverless functions for dynamic pages
4. Outputs to `.next/` directory

### Prerendering Gotchas (CRITICAL)
Next.js 16 prerenders pages at build time. Pages with client-only hooks will fail:

```
Error occurred prerendering page "/dashboard"
useUser can only be used within <ClerkProvider />
```

**Fix:** Add `export const dynamic = "force-dynamic"` to the parent layout. See `nextjs16-core.md`.

## Turbopack

Next.js 16 may use Turbopack by default. It can cause issues.

**Disable for stability:**
```json
// vercel.json
{
  "framework": "nextjs",
  "build": {
    "env": {
      "NEXT_DISABLE_TURBOPACK": "1"
    }
  }
}
```

Always add this to new projects as a preventive measure.

## Environment Variables

### Where to Set
- **Vercel Dashboard** → Settings → Environment Variables (production/preview/development)
- **`.env.local`** for local dev (gitignored)

### Common Variables

**All projects:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

**Convex projects (Demo template):**
```env
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOY_KEY=prod:xxx  # For CI/CD deployment
```

**Supabase projects (MVP template):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLERK_WEBHOOK_SECRET=whsec_...
```

### `NEXT_PUBLIC_` Prefix
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- All other variables are server-only
- Never put secrets in `NEXT_PUBLIC_` variables

## Preview vs Production Deploys

### Preview Deploys
- Created for every push to non-production branches
- URL: `project-name-xxx-team.vercel.app`
- **Deployment Protection** is ON by default → returns HTTP 401 for unauthenticated visitors
- Clerk auth may not work due to domain mismatch

### Production Deploys
- Triggered by push to `main` branch or manual promote
- URL: your custom domain or `project-name.vercel.app`
- No deployment protection

### When to Use Which
- **Quick test:** Deploy to production (fastest, no auth issues)
- **PR review:** Preview deploy (but may need protection disabled)
- **Demo to client:** Always production

### Promoting Preview to Production
```bash
# Via Vercel CLI
vercel --prod

# Via git
git push origin main
```

## Convex + Vercel

Convex runs separately from Vercel. Deploy sequence:

```bash
# 1. Deploy Convex first (schema changes must land before app code)
npx convex deploy

# 2. Deploy to Vercel
vercel --prod
# or: git push origin main
```

**Important:** Convex deploy key must be set in Vercel env vars for auto-deploy:
```env
CONVEX_DEPLOY_KEY=prod:xxx
```

If Convex auto-deploy isn't set up, you must deploy Convex manually before pushing to Vercel.

## Common Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Prerender error with `useUser` | Clerk hooks during static build | `force-dynamic` on layout |
| Prerender error with `useMutation` | Convex hooks during static build | `force-dynamic` on layout |
| `ssr: false not allowed in Server Components` | Wrong `next/dynamic` usage | Use `force-dynamic` instead |
| `Module not found: 'fs'` | Server module in client code | Move import to server component |
| Build timeout | Large project or slow dependencies | Increase build timeout in Vercel settings |
| OOM during build | Not enough memory | Set `NODE_OPTIONS=--max-old-space-size=4096` in build env |
| Type errors | TypeScript strict mode | Fix types or run `tsc --noEmit` locally first |

## vercel.json Reference

```json
{
  "framework": "nextjs",
  "build": {
    "env": {
      "NEXT_DISABLE_TURBOPACK": "1",
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

## Deployment Checklist

Before first deploy:
- [ ] `vercel.json` exists with Turbopack disabled
- [ ] All env vars set in Vercel dashboard (Production + Preview)
- [ ] `force-dynamic` on all layouts with client hooks
- [ ] Middleware public routes updated
- [ ] `tsc --noEmit` passes locally
- [ ] Convex deployed (if applicable)
- [ ] Clerk redirect URLs configured for production domain

Before each deploy:
- [ ] `tsc --noEmit` passes
- [ ] Convex schema changes deployed first
- [ ] No hardcoded localhost URLs
