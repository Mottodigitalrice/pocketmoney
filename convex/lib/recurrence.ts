/**
 * Pure recurrence materialization — NO Convex imports.
 *
 * Ported from the per-date predicate in
 * `convex/functions/scheduledJobs.ts` (`recurrenceMatchesDate` +
 * `dayIndexFromDateString`). The predicate used 0=Mon ... 6=Sun internally.
 *
 * Public API for the lib uses the spec convention: `daysOfWeek: number[]`
 * where **0=Sunday, 1=Monday, ..., 6=Saturday** (matching JS `Date.getDay()`).
 * The lib normalizes this to the Mon-indexed shape the existing schema uses.
 *
 * Why the dual convention: the stored schema (`JobRecurrence.daysOfWeek`)
 * already speaks Mon-indexed (0=Mon..6=Sun) — see `recurrenceMatchesDate`
 * which compares `dayIndex` (Mon-indexed) directly to `daysOfWeek`. We do
 * NOT change the stored schema in F2 (extraction-only). Callers using the
 * lib pass Sun-indexed, and the lib does the translation.
 *
 * If you're feeding `JobRecurrence` from the DB directly, use
 * `materializeRecurrenceFromMonIndexed` instead.
 */

export type RecurrenceType = "none" | "daily" | "weekdays" | "specificDays";

export interface RecurrenceRule {
  type: RecurrenceType;
  /**
   * Days of the week, **Sunday-indexed** (0=Sun, 1=Mon, ..., 6=Sat).
   * Only used when `type === "specificDays"`.
   */
  daysOfWeek?: number[];
}

/**
 * Materialize a recurrence rule into the concrete dates within the week
 * starting at `weekStartISO` (YYYY-MM-DD). Returns sorted `YYYY-MM-DD`
 * strings.
 *
 * Returns up to 7 dates (one per day of the week).
 *   - `none` → []
 *   - `daily` → all 7 dates
 *   - `weekdays` → Mon–Fri (5)
 *   - `specificDays` → only days matching `daysOfWeek` (Sun-indexed)
 *
 * The week is treated as a 7-day window beginning at `weekStartISO` — the
 * caller decides whether that's a Monday-start or Sunday-start week.
 */
export function materializeRecurrence(rule: RecurrenceRule, weekStartISO: string): string[] {
  if (!rule || rule.type === "none") return [];

  const weekDates = buildWeek(weekStartISO);
  const out: string[] = [];

  for (const date of weekDates) {
    const dow = getSundayIndexedDow(date); // 0=Sun..6=Sat
    if (rule.type === "daily") {
      out.push(date);
    } else if (rule.type === "weekdays") {
      // Mon=1..Fri=5 in Sunday-indexed numbering
      if (dow >= 1 && dow <= 5) out.push(date);
    } else if (rule.type === "specificDays") {
      if (rule.daysOfWeek?.includes(dow)) out.push(date);
    }
  }

  return out;
}

/**
 * Variant that accepts the **Monday-indexed** `daysOfWeek` shape currently
 * stored in the Convex `jobs.recurrence` column (0=Mon..6=Sun).
 *
 * Use this when materializing directly from `Doc<"jobs">.recurrence` — the
 * existing schema convention. Behaviorally equivalent to the legacy
 * `recurrenceMatchesDate` predicate iterated over the week.
 */
export function materializeRecurrenceFromMonIndexed(
  rule: { type: RecurrenceType; daysOfWeek?: number[] } | undefined | null,
  weekDates: string[]
): string[] {
  if (!rule || rule.type === "none") return [];

  const out: string[] = [];
  for (const date of weekDates) {
    const monDow = getMondayIndexedDow(date); // 0=Mon..6=Sun
    if (rule.type === "daily") {
      out.push(date);
    } else if (rule.type === "weekdays") {
      if (monDow >= 0 && monDow <= 4) out.push(date);
    } else if (rule.type === "specificDays") {
      if (rule.daysOfWeek?.includes(monDow)) out.push(date);
    }
  }
  return out;
}

/**
 * Returns true if `date` (YYYY-MM-DD) matches the given Mon-indexed
 * recurrence rule. Mirrors the legacy `recurrenceMatchesDate` predicate
 * EXACTLY — used inside `convex/functions/scheduledJobs.ts` to keep
 * behavior identical post-extraction.
 */
export function recurrenceMatchesDateMonIndexed(
  rule: { type: RecurrenceType; daysOfWeek?: number[] } | undefined | null,
  date: string
): boolean {
  if (!rule || rule.type === "none") return false;
  const monDow = getMondayIndexedDow(date);
  if (rule.type === "daily") return true;
  if (rule.type === "weekdays") return monDow >= 0 && monDow <= 4;
  return rule.daysOfWeek?.includes(monDow) ?? false;
}

// ---------- date helpers (pure, timezone-free) ----------

function buildWeek(weekStartISO: string): string[] {
  // Parse YYYY-MM-DD as UTC midnight to avoid TZ-shift surprises.
  const start = parseISODate(weekStartISO);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    out.push(formatISODate(d));
  }
  return out;
}

function parseISODate(iso: string): Date {
  // Avoid `new Date("2026-05-15")` which is parsed as UTC anyway, but be
  // explicit so we control behavior.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    throw new Error(`Expected YYYY-MM-DD, got: ${iso}`);
  }
  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
}

function formatISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 0=Sun..6=Sat — matches `Date.getDay()` and the spec's `specificDays`. */
function getSundayIndexedDow(iso: string): number {
  const d = parseISODate(iso);
  return d.getUTCDay();
}

/** 0=Mon..6=Sun — matches the legacy `dayIndexFromDateString`. */
function getMondayIndexedDow(iso: string): number {
  // Mirror legacy behavior: `new Date(\`${date}T00:00:00\`).getDay()` then
  // `day === 0 ? 6 : day - 1`. To stay TZ-stable in tests, we parse as UTC
  // and use getUTCDay — the legacy code used local TZ but the inputs are
  // pure date strings, so the only TZ artifact possible would be off-by-one
  // around midnight UTC; nodes running tests use UTC by default in CI.
  const sunDow = getSundayIndexedDow(iso);
  return sunDow === 0 ? 6 : sunDow - 1;
}
