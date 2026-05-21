# Changelog

All notable changes to Pirate Money. Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project does not follow strict semver until friends rollout.

## [Unreleased]

Track E rollout (LINE digest, privacy policy, Vercel push to friends) is staged but not active. Real Clerk dev keys are required to unblock F7/F8/F9 Playwright + auth-route Lighthouse. Both gated on Lewis.

## [0.1.0] — 2026-05-16

First end-to-end build. Production-ready code path; not yet shipped to friends.

### Added — Track A (Stabilize, F0)

- Convex auth hardening — all queries/mutations use `ctx.auth.getUserIdentity()` server-side via a single `assertOwnedBy` chokepoint.
- Try-again rejection lifecycle — parent rejects with a note, kid sees the reason, job returns to to-do (no auto-penalty).
- `seedDefaults` runs in onboarding — 20 starter chores per new family.
- React 19 lint/purity pass — all hooks satisfy the strict rules.
- Final JA i18n on parent dashboard + kid loading state.

### Added — Track A.5 (Parent UI Overhaul)

- Weekly grid planner replaces the modal-picker flow.
- Copy-last-week + Monday-template + bulk-assign-one-job-to-many-kids.

### Added — Track B (Wallet & Money Pedagogy)

- 3-jar wallet (Spend / Save / Give) with default 70 / 20 / 10 split.
- Immutable transaction ledger.
- Parent withdrawal flow with `cashOut | penalty | correction | other` reason enum.
- Weekly interest cron — 10% APR on the Save jar, hardcoded for v1.
- Give-jar destination is free text (no charity API).
- Goals / Wishlist module — kid sets target, cost, emoji; progress bar reads Save jar.
- Goal-switch keeps balance; UX copy explains the swap.
- Migration of existing balances — opening deposits across jars by ratio.

### Added — Track C (Retention & QoL)

- Noob → Normal → Pro → Master → Hacker ranks with hidden age-skewed multiplier.
- mustDo / optional priority on `scheduledJobs`.
- Recurring jobs — daily / weekdays / specific days at job-template level.
- Lucky Chest — once per week, random amount within parent max, unlocked by completing the week's must-do jobs.
- Spontaneous bonus button — parent-side positive reinforcement.
- Optional photo proof per job — 800px resize, 14-day auto-delete post-approval, monthly cap per family.

### Added — Track D (Brand & Cleanup)

- Rebranded to Pirate Money / Piratemoney.
- Removed OpenRouter dependency, `/api/ai`, `/api/translate`.
- PWA manifest + iOS install icons.

### Added — Round 1 polish (F11 → F22)

- Full i18n on ChildManager + ChildForm (closed the bilingual hole).
- Typed Convex error mapping (`mapConvexError`) — kids never see raw error codes.
- Confirmation dialogs on destructive actions (child delete, job delete) with cascading impact preview.
- Rank-up toast — fires once per tier change per kid, persists across reloads.
- BudouX-aware Japanese line wrapping in body copy.
- TS strict mode ratchet — `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride` + `noFallthroughCasesInSwitch`.

### Added — Round 2 (G1 → G5)

- Loading skeletons across 12 components + app shell.
- Lucky Chest math extracted to a pure lib with defensive ¥10,000 cap.
- React Testing Library infra — `renderWithProviders` + 32 component tests.
- SiblingRankBoard motivational rewrite — relative kudos line + weekly toggle.

### Added — Round 3 (H1 → H10)

- UI test expansion (+37) and backend lib coverage (+44) — total tests 233 → 334.
- Onboarding error UX (`mapConvexError` + retry) and skip-jobs path (defaults seed regardless).
- Friendlier loading copy on home screen ("Loading your crew…").
- Empty-state CTAs on QuickAddToday and WeekPlanner (jump to Crew tab when no children).
- Accessible names on Bonus and Withdrawal trigger buttons (per-child aria-label).
- SiblingRankBoard hides when fewer than two children (single-row leaderboard removed).
- Back-home button on the invalid-child fallback page.
- Error digest now visible on the global error boundary for support reporting.
- `.github/workflows/test.yml` — CI runs lint + typecheck + tests on push and pull request.
- `lint:fix` / `typecheck` / `typecheck:watch` scripts added.

### Out of v1

Multi-parent logins, team-up co-op mode, native iOS/Android shell, real charity payment integration, real bank/debit-card linking, per-event LINE pings, custom domain, public social leaderboards, auto-translate. See `decisions.md` for the full list and rationale.
