# Changelog

All notable changes to Pirate Money. Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project does not follow strict semver until friends rollout.

## [Unreleased] — 2026-05-23 — Autonomous Round 5 (waves 2-7)

Local autonomous session ran 7 waves on this branch (`claude/autonomous-project-analysis-wW6I8`). All builder waves shipped real code; reviewer waves verified before promotion.

### Security

- Defense-in-depth validators across 4 MEDIUM gaps surfaced in Round-5 security re-audit (wave-3a, `a905519`):
  - **MED-1** Lucky Chest open — 5-second per-user button-mash cooldown via additive optional `users.lastLuckyChestAttemptAt` (week-level idempotency remains the security boundary).
  - **MED-2** Job rejection note — 500-char cap (pre-strip count to block NUL-bomb DoS) + ASCII control-char strip.
  - **MED-3** Job library — title/titleJa 100-char caps; yenAmount integer ∈ [0, ¥1,000,000] cap.
  - **MED-4** Scheduled-job date strings — ISO `YYYY-MM-DD` regex + round-trip parse (catches `2026-02-30`, non-leap `2026-02-29`, month 13).
- Pure validators with 56 new unit tests in `convex/lib/{inputValidation,dateValidation}.ts`. Bilingual `mapConvexError` pipeline unchanged.

### UX / Animations (wave-2a, `7102ba3`)

- `prefers-reduced-motion` media block in `globals.css` neutralizes all 12 ambient infinite animations (`bob`, `wave-*`, `shimmer`, `pulse-gold`, `sparkle`, `treasure-glow`, `coin-spin`, `float-gentle`, `coin-float`, `scroll-hint`). Essential feedback animations (`scale-bounce`, `pm-rank-up-toast-enter`) intentionally preserved per WCAG 2.3.3 (reduce ≠ eliminate; motion-as-feedback is allowable).
- **WeeklyTracker** — progress bar 1000ms → 300ms ease-out; `pulse-gold` celebration on 100% crossing with timeout cleanup.
- **LuckyChest** — open success triggers a 12-coin burst overlay (2s) + `animate-scale-bounce` on the amount text.
- **JobCard** — wrapped in `motion.div` with `layout` + slide-in/out + `useReducedMotion` guard; `KanbanBoard` uses `AnimatePresence mode="popLayout"` so column changes feel intentional.
- **SiblingRankBoard** — `LayoutGroup` + per-row `motion.div layoutId` springs (stiffness 350, damping 30) for smooth reorder; reduced-motion drops to 100ms linear.
- **RankUpToast** — `.pm-rank-up-toast` keyframe (cubic-bezier overshoot) — fills in the previously-defined-but-unused className.

### A11y (wave-6a, `082d1e6`)

- Hidden `role="status" aria-live="polite"` regions on LuckyChest open, WeeklyTracker 100%, and RankUpToast — screen readers now hear the celebration.
- Focus-ring polish — `*:focus-visible` 2px gold box-shadow ring via CSS var `--pm-focus-ring` (overridable).
- Icon-only buttons gained aria-labels — ParentHeader Home + Logout; GoalWishlist emoji picker tiles (aria-pressed + per-tile aria-label).
- Decorative animation overlays (`LuckyChestCoinBurst`) marked `aria-hidden`.

### Japanese typography (wave-6a, `082d1e6`)

- `BudouXText` wraps applied to LuckyChest body strings (3 branches), WeeklyTracker progress + zero-hint, and ApprovalQueue first-day + caught-up empty states.

### Performance (wave-4a, `a68f9ec`)

- Parent dashboard tabs 3-6 (WeekPlanner, JobManager, ChildOverview, ChildManager, LuckyChestSettings) lazy-loaded via `next/dynamic({ ssr: false })` with `AppSkeleton` fallback. QuickAddToday + ApprovalQueue stay eager on the default tab.
- `JobCard` wrapped in `React.memo` with an explicit 11-prop equality check (excludes `onStart` / `onComplete` closures that recreate per render — Convex mutations capture latest IDs from args, not closures).
- `LanguageProvider` context value verified-memoized via `useMemo` + new regression tests.
- `DolphinCelebration` already dynamic — verified, locked in a test.

### Polish (wave-7a, `04e6dc5`)

- **ApprovalQueue** — distinct first-day ("Ready for your crew's first job?", compass icon) vs caught-up ("All caught up!", anchor) empty states; derived from `jobInstances.some(i => i.status === "approved")` — no new Convex query needed.
- **Parent dashboard** — smart default tab — `overview` when family has ≥1 approved instance, `quick_add` otherwise. URL `?tab=` override still wins (search-param bookmarks unaffected).
- **TreasureHistoryCalendar** — zero-history renders the dimmed 7-day grid shell + centered overlay card with treasure-map icon + warmer "starts here" copy.

### i18n (12 new keys × 2 locales)

- `a11y_lucky_chest_opened`, `a11y_weekly_goal_reached`, `a11y_rank_up`, `a11y_logout`, `a11y_home`, `a11y_pick_emoji`
- `approval_queue_first_day_title`, `approval_queue_first_day_body`, `approval_queue_caught_up_title`, `approval_queue_caught_up_body`
- `treasure_history_empty_title`, `treasure_history_empty_body`

### Tests

- Backend: 240 → 296 (+56). MED validators + ISO date round-trip + control-char strip edge cases.
- UI: 142 → 218 (+76). New surfaces: animation (9), perf boundaries (6), a11y audit (21), BonusDialogBody (6), ApprovalCard (8), ChildForm (9), LuckyChest (5), WithdrawalDialogBody (4), ApprovalQueue first-day + caught-up (3), TreasureHistoryCalendar (2 augment), parent-default-tab (4). Plus onboarding flake harden (wave-5b, `ab33c77`) — zero net but file runtime 15s → 1.2s via `vi.useFakeTimers`.
- **Total: 359 → 514 (+155).** All green.

### CI / repo hygiene

- Lint zero, tsc zero across the entire diff.
- Pre-commit hook (lint-staged + simple-git-hooks) shipped prior round; preserved.
- No new dependencies, no peer-dep bumps, no schema-breaking changes (`users.lastLuckyChestAttemptAt` is additive optional).

### Notes

- Round-5 commit range on `Mottodigitalrice/pocketmoney`: `7817b76..04e6dc5` (7 commits).
- Sentry stub from prior round remains zero-spend; no DSN set this round.

## [Unreleased] — 2026-05-22 — Autonomous polish session

Cloud + local autonomous session ran wave-based execution on this branch. Local-session shipped real code per below; cloud-session shipped paint-by-numbers spec docs (see `projects/active/piratemoney/working-files/2026-05-21-*-specs/`).

### Added

- Segment error boundaries for `/parent`, `/kid/[childId]`, and `/onboarding` — localized recover-and-retry UX scoped to each route segment.
- Sentry stub — `@sentry/nextjs@^10` wired across server / edge / client runtimes, fully env-gated. Zero network traffic without `NEXT_PUBLIC_SENTRY_DSN`.
- Prettier — `prettier@^3.x` + `eslint-config-prettier`, with `.prettierrc.json` + `.prettierignore` and a whole-tree reformat.
- `LIGHTHOUSE_AUDIT=1` middleware bypass — lets unauthenticated Lighthouse runs reach protected routes for perf/a11y audits without faking Clerk.
- 24+ new i18n keys — 16 segment-error strings, 8 onboarding-error strings (EN + JA).
- `sentry.constants.ts` module — single source of truth for `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_REPLAYS_SESSION_SAMPLE_RATE`, `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`. Change once, applies to all three Sentry runtimes.

### Changed

- Landing page routes all copy through `useTranslation()` (F10 1.1) — no remaining hardcoded strings.
- Landing now wraps in `<main>` for a11y semantics.
- `text-slate-*` darkened on landing to fix color-contrast warnings.
- Parent dashboard tabs migrated to search params (F10 5.20) — back/forward + deep-link friendly.
- Kanban empty states softened (F10 6.4) — friendlier copy, clearer CTAs.
- 169-file Prettier reformat across the whole tree (separate commit for revert safety).

### Fixed

- UI test flakes hardened — WeekPlanner + onboarding `StepAddJobs` subtitle.
- Lighthouse a11y `/landing` 94 → 100 on mobile and desktop.

### Tests

- Backend: 240 (unchanged).
- UI: 119 → ~150+ — segment-error +12, onboarding-error +5, parent-tabs +4, kanban +1. Landing not re-tested in this session.

### Notes

- E2E Playwright and auth-route Lighthouse deferred — Clerk dev keys missing from `.env.local` at session start.
- Sentry stub is a no-op without DSN: zero external traffic, zero spend.

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
