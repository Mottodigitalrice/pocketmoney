import { describe, it, expect } from "vitest";
import {
  mapConvexError,
  classifyConvexError,
  errorCodeToTranslationKey,
} from "../src/lib/convex-errors";
import type { TranslationKey } from "../src/lib/i18n/translations";

/**
 * F12 — convex-errors mapper unit tests.
 *
 * The mapper is intentionally pure (no React). These tests assert each
 * regex branch + every ErrorCode → translation-key path.
 *
 * We pass in a `t` stub that returns the key itself so we can assert the
 * routing without booting the LanguageProvider. The real `t` would render
 * the en/ja string.
 */

const tStub = (key: TranslationKey) => key;

describe("mapConvexError — classify", () => {
  it("classifies 'Not authenticated' as AUTH_LOST", () => {
    const r = mapConvexError(new Error("Not authenticated"), tStub);
    expect(r.code).toBe("AUTH_LOST");
    expect(r.message).toBe("error_auth_lost");
    expect(r.severity).toBe("auth");
  });

  it("classifies fetch / network as NETWORK", () => {
    for (const raw of [
      "Failed to fetch",
      "TypeError: NetworkError when attempting to fetch resource.",
      "fetch failed",
      "offline",
    ]) {
      const r = mapConvexError(new Error(raw), tStub);
      expect(r.code, raw).toBe("NETWORK");
      expect(r.message).toBe("error_network");
      expect(r.severity).toBe("network");
    }
  });

  it("classifies OVERDRAFT: prefix as OVERDRAFT", () => {
    const r = mapConvexError(
      new Error("OVERDRAFT: balance ¥10 cannot cover withdrawal ¥50"),
      tStub
    );
    expect(r.code).toBe("OVERDRAFT");
    expect(r.message).toBe("error_overdraft");
    expect(r.severity).toBe("validation");
  });

  it("classifies LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK", () => {
    const r = mapConvexError(
      new Error("LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK"),
      tStub
    );
    expect(r.code).toBe("LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK");
    expect(r.message).toBe("error_lucky_chest_locked");
  });

  it("classifies CHILD_DELETED_AFTER_COMPLETION", () => {
    const r = mapConvexError(
      new Error("CHILD_DELETED_AFTER_COMPLETION"),
      tStub
    );
    expect(r.code).toBe("CHILD_DELETED_AFTER_COMPLETION");
    expect(r.message).toBe("error_child_deleted");
  });

  it("classifies CANNOT_REJECT_APPROVED_INSTANCE", () => {
    const r = mapConvexError(
      new Error("CANNOT_REJECT_APPROVED_INSTANCE"),
      tStub
    );
    expect(r.code).toBe("CANNOT_REJECT_APPROVED_INSTANCE");
    expect(r.message).toBe("error_already_approved");
  });

  it("classifies 'Not your X' (assertOwnedBy) as OWNERSHIP", () => {
    for (const raw of ["Not your child", "Not your job", "Not your wallet"]) {
      const r = mapConvexError(new Error(raw), tStub);
      expect(r.code, raw).toBe("OWNERSHIP");
      expect(r.severity).toBe("ownership");
    }
  });

  it("classifies ArgumentValidationError as VALIDATION", () => {
    const r = mapConvexError(
      new Error("ArgumentValidationError: bad arg"),
      tStub
    );
    expect(r.code).toBe("VALIDATION");
  });

  it("falls back to UNKNOWN for arbitrary garbage", () => {
    const r = mapConvexError(new Error("kaboom"), tStub);
    expect(r.code).toBe("UNKNOWN");
    expect(r.severity).toBe("unknown");
  });

  it("handles null / undefined / plain strings", () => {
    expect(mapConvexError(null, tStub).code).toBe("UNKNOWN");
    expect(mapConvexError(undefined, tStub).code).toBe("UNKNOWN");
    expect(mapConvexError("Not authenticated", tStub).code).toBe("AUTH_LOST");
  });

  it("handles Convex-style { message } objects", () => {
    const r = mapConvexError({ message: "OVERDRAFT: insufficient" }, tStub);
    expect(r.code).toBe("OVERDRAFT");
  });

  it("preserves the raw string on the result", () => {
    const r = mapConvexError(new Error("OVERDRAFT: ¥10/¥50"), tStub);
    expect(r.raw).toContain("OVERDRAFT:");
  });
});

describe("classifyConvexError — code-only path", () => {
  it("returns code without needing t", () => {
    const r = classifyConvexError(new Error("Not authenticated"));
    expect(r.code).toBe("AUTH_LOST");
    expect(r.raw).toBe("Not authenticated");
  });
});

describe("errorCodeToTranslationKey", () => {
  it("maps every code to a stable key", () => {
    expect(errorCodeToTranslationKey("AUTH_LOST")).toBe("error_auth_lost");
    expect(errorCodeToTranslationKey("NETWORK")).toBe("error_network");
    expect(errorCodeToTranslationKey("OVERDRAFT")).toBe("error_overdraft");
    expect(errorCodeToTranslationKey("LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK"))
      .toBe("error_lucky_chest_locked");
    expect(errorCodeToTranslationKey("CHILD_DELETED_AFTER_COMPLETION"))
      .toBe("error_child_deleted");
    expect(errorCodeToTranslationKey("CANNOT_REJECT_APPROVED_INSTANCE"))
      .toBe("error_already_approved");
    expect(errorCodeToTranslationKey("OWNERSHIP")).toBe("error_ownership");
    expect(errorCodeToTranslationKey("VALIDATION")).toBe("error_validation");
    expect(errorCodeToTranslationKey("UNKNOWN")).toBe("error_unknown");
  });
});
