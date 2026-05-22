/**
 * Pure input validation helpers — NO Convex imports, NO `ctx`.
 *
 * Wave 3a defense-in-depth: extracted from the various mutation handlers so
 * the validation rules are testable in isolation and consistent across
 * callers. The Convex `v.*` argument validators handle TYPE shape; these
 * helpers handle VALUE bounds and content sanitization.
 *
 * Error model: all helpers throw a plain `Error` whose message is a stable
 * uppercase code (e.g. `"JOB_YEN_AMOUNT_OUT_OF_BOUNDS"`). The client maps
 * via `src/lib/convex-errors.ts` `mapConvexError(err, t)` to a bilingual
 * translation key. No locale strings live in the backend.
 */

// MED-2: parentNote cap on jobInstances.reject
const PARENT_NOTE_MAX_LEN = 500;

// MED-3: job library bounds
const JOB_TITLE_MAX_LEN = 100;
const JOB_TITLE_JA_MAX_LEN = 100;
const JOB_YEN_AMOUNT_MIN = 0;
const JOB_YEN_AMOUNT_MAX = 1_000_000;

// MED-1: anti-button-mash cooldown between successive `luckyChests.open`
// calls per user. NOT a security boundary — week-level idempotency
// (`luckyChests.by_child_week` unique lookup) is the real guard. This is
// purely UX (prevents rapid double-tap on a flaky network).
export const LUCKY_CHEST_COOLDOWN_MS = 5_000;

/**
 * Strip ASCII control characters (0x00-0x1f and 0x7f) except `\n` (0x0a)
 * from a string. Tabs (0x09) and CRs (0x0d) are also stripped — only LF
 * is allowed as a structural newline.
 *
 * Why: prevents NULs and other control bytes from being stored in DB and
 * downstream rendered in HTML/JSON contexts. Not a full XSS scrubber; the
 * client is still expected to React-escape on render. Belt + suspenders.
 *
 * Implementation note: we iterate char codes rather than use a regex range
 * literal (which would either trip `no-control-regex` lint or require an
 * inline disable). Plain JS is also marginally faster on short strings.
 */
export function stripControlChars(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    // Allow LF (0x0a); strip 0x00-0x09, 0x0b-0x1f, and 0x7f (DEL).
    if (code === 0x0a) {
      out += input[i];
      continue;
    }
    if (code <= 0x1f || code === 0x7f) {
      continue;
    }
    out += input[i];
  }
  return out;
}

/**
 * MED-2: validate + sanitize a parent rejection note.
 *
 * Throws `PARENT_NOTE_TOO_LONG` if the input exceeds 500 chars (counted
 * BEFORE stripping — a 600-char string of NULs still throws, even though
 * post-strip it would be empty; this prevents a sneaky "send 1MB of NULs"
 * DoS).
 *
 * Returns the sanitized string. Callers should persist the return value,
 * not the raw input.
 */
export function sanitizeParentNote(input: string): string {
  if (input.length > PARENT_NOTE_MAX_LEN) {
    throw new Error("PARENT_NOTE_TOO_LONG");
  }
  return stripControlChars(input);
}

/**
 * MED-3: assert a job library title is within the 100-char cap.
 *
 * Empty strings ARE allowed at this layer — the Convex validator already
 * requires `v.string()` and the UI rejects whitespace-only in its own
 * validation. We only enforce the upper bound here so the validation rule
 * stays single-purpose and easy to reason about.
 */
export function assertJobTitle(input: string, label: string = "title"): void {
  if (input.length > JOB_TITLE_MAX_LEN) {
    throw new Error(`JOB_TITLE_TOO_LONG: ${label}`);
  }
}

/**
 * MED-3: same cap applied to the Japanese title (`titleJa`). Separate
 * helper so the error message can pin the offending field.
 */
export function assertJobTitleJa(input: string): void {
  if (input.length > JOB_TITLE_JA_MAX_LEN) {
    throw new Error("JOB_TITLE_JA_TOO_LONG");
  }
}

/**
 * MED-3: assert the yen amount is a finite integer in `[0, 1_000_000]`.
 *
 * - Negative → `JOB_YEN_AMOUNT_OUT_OF_BOUNDS`
 * - > ¥1M → `JOB_YEN_AMOUNT_OUT_OF_BOUNDS`
 * - NaN / Infinity → `JOB_YEN_AMOUNT_OUT_OF_BOUNDS`
 * - Non-integer → `JOB_YEN_AMOUNT_OUT_OF_BOUNDS`
 *
 * Why ¥1M cap: matches `MAX_LUCKY_CHEST_CAP` order of magnitude. A single
 * chore credit > ¥1M almost certainly indicates a UI bug or a malicious
 * client; the UX above this cap is undefined anyway (the kid wallet UI
 * formats up to 6 digits comfortably).
 */
export function assertJobYenAmount(input: number): void {
  if (!Number.isFinite(input)) {
    throw new Error("JOB_YEN_AMOUNT_OUT_OF_BOUNDS");
  }
  if (!Number.isInteger(input)) {
    throw new Error("JOB_YEN_AMOUNT_OUT_OF_BOUNDS");
  }
  if (input < JOB_YEN_AMOUNT_MIN || input > JOB_YEN_AMOUNT_MAX) {
    throw new Error("JOB_YEN_AMOUNT_OUT_OF_BOUNDS");
  }
}

/** Exported for tests + downstream visibility. */
export const __testing__ = {
  PARENT_NOTE_MAX_LEN,
  JOB_TITLE_MAX_LEN,
  JOB_TITLE_JA_MAX_LEN,
  JOB_YEN_AMOUNT_MIN,
  JOB_YEN_AMOUNT_MAX,
};
