import { describe, expect, it } from "vitest";
import { isLighthouseBypassEnabled } from "../src/lib/lighthouse-guard";

/**
 * QA-2026-06-06 (F7a): the `LIGHTHOUSE_AUDIT` Clerk-bypass MUST be impossible on
 * a Vercel production deployment, even if the env var leaks there. These tests
 * pin that contract on the pure guard (the middleware just calls it).
 */
describe("isLighthouseBypassEnabled — production-tier guard", () => {
  it("bypasses when LIGHTHOUSE_AUDIT=1 and NOT a Vercel prod deploy (local)", () => {
    expect(isLighthouseBypassEnabled({ LIGHTHOUSE_AUDIT: "1" })).toBe(true);
  });

  it("bypasses on a Vercel PREVIEW deploy with the flag set", () => {
    expect(
      isLighthouseBypassEnabled({
        LIGHTHOUSE_AUDIT: "1",
        VERCEL_ENV: "preview",
      }),
    ).toBe(true);
  });

  it("REFUSES to bypass on a Vercel PRODUCTION deploy, even with the flag", () => {
    expect(
      isLighthouseBypassEnabled({
        LIGHTHOUSE_AUDIT: "1",
        VERCEL_ENV: "production",
      }),
    ).toBe(false);
  });

  it("does not bypass when the flag is unset or not exactly '1'", () => {
    expect(isLighthouseBypassEnabled({})).toBe(false);
    expect(isLighthouseBypassEnabled({ LIGHTHOUSE_AUDIT: "true" })).toBe(false);
    expect(isLighthouseBypassEnabled({ LIGHTHOUSE_AUDIT: "0" })).toBe(false);
  });
});
