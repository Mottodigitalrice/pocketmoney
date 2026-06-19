import { describe, expect, it } from "vitest";
import { sanitizeConvexUrl } from "@/components/providers/convex-provider";

/**
 * Locks the prod root-cause fix: `NEXT_PUBLIC_CONVEX_URL` arrived with a
 * trailing newline (`"https://...convex.cloud\n"`). Because the corrupted
 * string was truthy, the old code built a ConvexReactClient against a broken
 * WebSocket endpoint and every `useQuery` hung forever.
 *
 * `sanitizeConvexUrl` is the pure trim+validate extraction of that fix.
 */
describe("sanitizeConvexUrl", () => {
  it("strips a trailing newline (the actual prod bug)", () => {
    expect(
      sanitizeConvexUrl("https://amicable-butterfly-979.convex.cloud\n"),
    ).toBe("https://amicable-butterfly-979.convex.cloud");
  });

  it("strips surrounding whitespace", () => {
    expect(
      sanitizeConvexUrl("  https://amicable-butterfly-979.convex.cloud  "),
    ).toBe("https://amicable-butterfly-979.convex.cloud");
  });

  it("returns null for an empty string", () => {
    expect(sanitizeConvexUrl("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(sanitizeConvexUrl("   \n  ")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(sanitizeConvexUrl(undefined)).toBeNull();
  });

  it("returns null for a missing scheme (not an absolute URL)", () => {
    expect(sanitizeConvexUrl("amicable.convex.cloud")).toBeNull();
  });

  it("passes a valid absolute URL through unchanged", () => {
    expect(
      sanitizeConvexUrl("https://amicable-butterfly-979.convex.cloud"),
    ).toBe("https://amicable-butterfly-979.convex.cloud");
  });
});
