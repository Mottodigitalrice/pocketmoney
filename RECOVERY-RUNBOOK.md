# Pirate Money — Prod Recovery + User-Wipe Runbook

**Authored:** 2026-06-20 (autonomous diagnosis session)
**Why this exists:** The task was "fix home-won't-load-after-signup on prod + wipe all users." A live environment check found prod is **not in the state the task assumed** — it's broken at several layers, and the fixes that touch prod need credentials only you hold. This runbook hands you the exact, ordered steps. Each prod-touching command is **human-gated** (you run it; the autonomous agent could not).

---

## TL;DR — what's actually wrong with prod

| Layer         | Finding (verified 2026-06-20)                                                                                                                                                                                                          | Evidence                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Domain        | `https://piratemoney.vercel.app/` → **404 DEPLOYMENT_NOT_FOUND** — the alias points to nothing. There is **no `piratemoney` Vercel project**; this app lives in the **`demotemplate`** project (your local `.vercel` link is correct). | `curl -sI`; `vercel projects ls`; `vercel alias ls` (no pirate alias) |
| Deployment    | `demotemplate` latest **production** deploy is **62 days old** and returns **HTTP 500 MIDDLEWARE_INVOCATION_FAILED** — Clerk middleware throws because no Clerk env vars are set.                                                      | `vercel ls`; `curl -sI https://demotemplate-delta.vercel.app/`        |
| Env (Vercel)  | The `demotemplate` Production env has **only `NEXT_PUBLIC_CONVEX_URL`** — **zero Clerk keys**. And that one value is **corrupted with a trailing newline**: `"https://amicable-butterfly-979.convex.cloud\n"`.                         | `vercel env ls production`; `vercel env pull`                         |
| Convex (prod) | Backend `amicable-butterfly-979` is **alive (200)** but its functions are whatever was last deployed (stale).                                                                                                                          | `curl …/version` → 200                                                |

**Net:** even after you fix middleware, the corrupted Convex URL would _still_ break the home page (the exact "infinite skeleton after signup" symptom). The code in this PR hardens against the newline (`.trim()` + URL-validate) and adds a 15s retry escape hatch, but **prod also needs the env/deploy/alias fixes below** — those are config, not code.

---

## What this PR already fixed (code, merged via this branch)

- **`.trim()` + URL-validate** `NEXT_PUBLIC_CONVEX_URL` so a stray newline/whitespace can never silently break the Convex client again.
- **15s load-timeout escape hatch** → home shows a retry/logout card instead of an infinite skeleton; retry does a full reload (rebuilds the client).
- **Onboarding** already-onboarded guard (no re-onboarding loop / dup children) + self-provision of the Convex user row.
- **Wipe tooling**: `convex/functions/admin.ts` `clearAllUsers` (dry-run by default) + `scripts/clerk-wipe.mjs` (dry-run by default).
- **Regression test**: `e2e/signup-to-home.spec.ts`.

Merge this PR first so the redeploy below ships the hardened code.

---

## PART 1 — Restore prod (do this first; ~10 min)

> Run from `DEVELOPMENT/builds/apps/pocketmoney`. The repo is locally linked to the `demotemplate` Vercel project already.

### Decision A — which Clerk instance does prod use?

`convex/auth.config.ts` falls back to the **dev** Clerk instance `bursting-beagle-83.clerk.accounts.dev`. Prod has no Clerk wiring at all. Two options:

- **(Recommended for a hobby app) Reuse the dev Clerk instance for prod** — least work. Use the same `pk_test_…` / `sk_test_…` keys you use locally. Test-mode Clerk is fine for family use.
- **(Cleaner, more work) Stand up a Clerk _production_ instance** — new `pk_live_…`/`sk_live_…`, recreate the **`convex` JWT template** (audience `convex`), and set `CLERK_JWT_ISSUER_DOMAIN` to the prod Clerk Frontend API URL on the prod Convex deployment.

The steps below assume the recommended path; swap in `pk_live_`/`sk_live_` + the prod issuer domain if you choose option 2.

### Step 1 — fix the corrupted Convex URL env var

```bash
# remove the newline-corrupted value, re-add it clean:
vercel env rm NEXT_PUBLIC_CONVEX_URL production -y
printf 'https://amicable-butterfly-979.convex.cloud' | vercel env add NEXT_PUBLIC_CONVEX_URL production
# (printf, NOT echo — echo appends the newline that caused this)
```

### Step 2 — add the missing Clerk env vars to Vercel (Production)

```bash
printf '%s' "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
printf '%s' "$CLERK_SECRET_KEY"                  | vercel env add CLERK_SECRET_KEY production
printf '/sign-in'    | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production
printf '/sign-up'    | vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL production
printf '/'           | vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL production
printf '/onboarding' | vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL production
```

(Paste the actual keys from your Clerk dashboard / local `.env.local`-equivalent. Use `printf`, never `echo`.)

### Step 3 — point the prod Convex deployment at the Clerk issuer + deploy functions

```bash
# Tell prod Convex which Clerk instance issues its JWTs (skip if reusing the
# dev instance AND you're OK with the auth.config.ts fallback domain):
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://bursting-beagle-83.clerk.accounts.dev --prod
# Deploy current code's functions (incl. the new admin.ts) to prod Convex:
npx convex deploy --prod
```

> You'll need the prod Convex deploy key (Convex dashboard → amicable-butterfly-979 → Settings → Deploy key) if the CLI isn't already authed for prod.

### Step 4 — redeploy the frontend (current prod build is 62 days stale)

```bash
# after merging this PR to main:
vercel --prod
```

### Step 5 — restore the `piratemoney.vercel.app` alias

```bash
# get the new production deployment URL from step 4's output, then:
vercel alias set <new-deployment>.vercel.app piratemoney.vercel.app
# (or, in the Vercel dashboard: demotemplate → Settings → Domains → add piratemoney.vercel.app)
```

### Step 6 — smoke check

```bash
curl -sI https://piratemoney.vercel.app/ | grep HTTP          # expect 200/3xx, NOT 404/500
curl -s  https://piratemoney.vercel.app/landing -o /dev/null -w '%{http_code}\n'
```

---

## PART 2 — Verify the fix with a real signup (before wiping)

Run the regression spec against a working deployment, or do it by hand:

```bash
# locally against the restored stack (needs Clerk test-mode keys in env):
npm run test:e2e -- signup-to-home
```

Or manually: open `https://piratemoney.vercel.app/sign-up`, create an account, complete onboarding (add a crew member), confirm `/` renders the character-select cards (not a spinner). If it loads → the fix is verified.

---

## PART 3 — 🔒 Wipe all users (only after Part 2 passes)

> Destructive + irreversible on prod data. Do a dry-run of each first.

### Convex data

```bash
# DRY RUN (default — counts only, deletes nothing):
npx convex run functions/admin:clearAllUsers --prod
# REAL wipe:
npx convex run functions/admin:clearAllUsers '{"confirm":true}' --prod
# Re-run until users/rows return 0 (single-txn; large datasets may need repeats).
```

### Clerk accounts

```bash
# DRY RUN (default — prints count + sample, deletes nothing):
CLERK_SECRET_KEY=<sk_…> npm run wipe:clerk
# REAL wipe:
CLERK_SECRET_KEY=<sk_…> npm run wipe:clerk -- --yes
```

Use the **same** Clerk instance's secret key you wired into prod in Part 1. `sk_test_…` wipes the test instance; `sk_live_…` wipes the live one — the script prints which prefix it sees before acting.

### Confirm clean slate

```bash
npx convex run functions/admin:clearAllUsers --prod      # dry-run → users: 0
CLERK_SECRET_KEY=<sk_…> npm run wipe:clerk                # dry-run → count: 0
```

---

## PART 4 — Final clean-slate check

Sign up 1–2 brand-new accounts on the now-empty prod, walk onboarding → home, confirm it loads and data is correct.

---

## Open decision for you

- **Keep using the `demotemplate` project, or rename it to `piratemoney`?** Renaming (Vercel → Settings → General → Project Name) makes the dashboard match the product; the `piratemoney.vercel.app` alias works either way. Cosmetic — your call.
