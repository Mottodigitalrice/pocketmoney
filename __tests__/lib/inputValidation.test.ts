import { describe, it, expect } from "vitest";
import {
  stripControlChars,
  sanitizeParentNote,
  assertJobTitle,
  assertJobTitleJa,
  assertJobYenAmount,
  __testing__,
} from "../../convex/lib/inputValidation";

/**
 * Wave 3a MED-1/2/3 input validation contract tests.
 *
 * Covers the value-bounds + sanitization helpers used by:
 *   - `jobInstances.reject` (parentNote) — MED-2
 *   - `jobs.create / jobs.update` (title, titleJa, yenAmount) — MED-3
 *
 * NB: `LUCKY_CHEST_COOLDOWN_MS` is also exported from this module but its
 * behavior is exercised at the mutation layer (see `convex/functions/
 * luckyChests.ts` MED-1 guard). Pure constant, no test needed.
 */

describe("stripControlChars", () => {
  it("preserves LF (0x0a) as a structural newline", () => {
    expect(stripControlChars("hello\nworld")).toBe("hello\nworld");
  });

  it("strips NUL (0x00)", () => {
    expect(stripControlChars("a\x00b")).toBe("ab");
  });

  it("strips tab (0x09) and CR (0x0d)", () => {
    expect(stripControlChars("a\tb\rc")).toBe("abc");
  });

  it("strips DEL (0x7f)", () => {
    expect(stripControlChars("a\x7fb")).toBe("ab");
  });

  it("strips a mixed run of control chars but keeps LFs", () => {
    expect(stripControlChars("\x01\x02\nhi\x1f\x7f\n")).toBe("\nhi\n");
  });

  it("leaves printable ASCII unchanged", () => {
    expect(stripControlChars("Hello, World! 123 @#$%")).toBe(
      "Hello, World! 123 @#$%",
    );
  });

  it("leaves multi-byte UTF-8 (Japanese) unchanged", () => {
    expect(stripControlChars("こんにちは、世界！")).toBe("こんにちは、世界！");
  });

  it("leaves emoji unchanged", () => {
    expect(stripControlChars("hi 👋🏻 🐢")).toBe("hi 👋🏻 🐢");
  });

  it("returns empty string for empty input", () => {
    expect(stripControlChars("")).toBe("");
  });
});

describe("sanitizeParentNote", () => {
  it("returns sanitized value for valid short input", () => {
    expect(sanitizeParentNote("Please redo this.")).toBe("Please redo this.");
  });

  it("strips control chars on otherwise-valid input", () => {
    expect(sanitizeParentNote("Please\x00 redo\x07 this.")).toBe(
      "Please redo this.",
    );
  });

  it("preserves LF in sanitized output", () => {
    expect(sanitizeParentNote("line one\nline two")).toBe("line one\nline two");
  });

  it("accepts input at exactly the cap (500 chars)", () => {
    const at = "a".repeat(__testing__.PARENT_NOTE_MAX_LEN);
    expect(sanitizeParentNote(at)).toBe(at);
  });

  it("throws PARENT_NOTE_TOO_LONG for input one over the cap", () => {
    const over = "a".repeat(__testing__.PARENT_NOTE_MAX_LEN + 1);
    expect(() => sanitizeParentNote(over)).toThrow("PARENT_NOTE_TOO_LONG");
  });

  it("counts BEFORE strip — 600 NULs throws even though post-strip is empty", () => {
    const nulBomb = "\x00".repeat(600);
    expect(() => sanitizeParentNote(nulBomb)).toThrow("PARENT_NOTE_TOO_LONG");
  });

  it("returns empty string for empty input (cap check passes)", () => {
    expect(sanitizeParentNote("")).toBe("");
  });
});

describe("assertJobTitle", () => {
  it("accepts empty string (lower bound enforced elsewhere)", () => {
    expect(() => assertJobTitle("")).not.toThrow();
  });

  it("accepts a typical title", () => {
    expect(() => assertJobTitle("Fold the washing")).not.toThrow();
  });

  it("accepts a title at exactly the 100-char cap", () => {
    expect(() =>
      assertJobTitle("x".repeat(__testing__.JOB_TITLE_MAX_LEN)),
    ).not.toThrow();
  });

  it("throws JOB_TITLE_TOO_LONG for one over cap", () => {
    expect(() =>
      assertJobTitle("x".repeat(__testing__.JOB_TITLE_MAX_LEN + 1)),
    ).toThrow(/JOB_TITLE_TOO_LONG/);
  });

  it("includes the label in the error message", () => {
    expect(() => assertJobTitle("x".repeat(200), "title")).toThrow(/title/);
  });
});

describe("assertJobTitleJa", () => {
  it("accepts a typical Japanese title", () => {
    expect(() => assertJobTitleJa("洗濯物をたたむ")).not.toThrow();
  });

  it("accepts a JP title at exactly the cap", () => {
    expect(() =>
      assertJobTitleJa("あ".repeat(__testing__.JOB_TITLE_JA_MAX_LEN)),
    ).not.toThrow();
  });

  it("throws JOB_TITLE_JA_TOO_LONG for one over cap", () => {
    expect(() =>
      assertJobTitleJa("あ".repeat(__testing__.JOB_TITLE_JA_MAX_LEN + 1)),
    ).toThrow("JOB_TITLE_JA_TOO_LONG");
  });
});

describe("assertJobYenAmount", () => {
  it("accepts 0 (lower bound)", () => {
    expect(() => assertJobYenAmount(0)).not.toThrow();
  });

  it("accepts 1", () => {
    expect(() => assertJobYenAmount(1)).not.toThrow();
  });

  it("accepts the cap (1_000_000)", () => {
    expect(() =>
      assertJobYenAmount(__testing__.JOB_YEN_AMOUNT_MAX),
    ).not.toThrow();
  });

  it("rejects -1 (below lower bound)", () => {
    expect(() => assertJobYenAmount(-1)).toThrow(
      "JOB_YEN_AMOUNT_OUT_OF_BOUNDS",
    );
  });

  it("rejects 1_000_001 (one over cap)", () => {
    expect(() =>
      assertJobYenAmount(__testing__.JOB_YEN_AMOUNT_MAX + 1),
    ).toThrow("JOB_YEN_AMOUNT_OUT_OF_BOUNDS");
  });

  it("rejects NaN", () => {
    expect(() => assertJobYenAmount(Number.NaN)).toThrow(
      "JOB_YEN_AMOUNT_OUT_OF_BOUNDS",
    );
  });

  it("rejects Infinity", () => {
    expect(() => assertJobYenAmount(Number.POSITIVE_INFINITY)).toThrow(
      "JOB_YEN_AMOUNT_OUT_OF_BOUNDS",
    );
  });

  it("rejects -Infinity", () => {
    expect(() => assertJobYenAmount(Number.NEGATIVE_INFINITY)).toThrow(
      "JOB_YEN_AMOUNT_OUT_OF_BOUNDS",
    );
  });

  it("rejects non-integer (1.5)", () => {
    expect(() => assertJobYenAmount(1.5)).toThrow(
      "JOB_YEN_AMOUNT_OUT_OF_BOUNDS",
    );
  });
});
