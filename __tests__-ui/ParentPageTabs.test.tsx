/**
 * F10 5.20 — ParentPage tab state via `?tab=` search params.
 *
 * Replaces the previous URL-hash mechanism. Three behaviours under test:
 *   (a) initial tab is read from `?tab=...` on first paint
 *   (b) clicking a tab calls `router.replace("?tab=<id>", { scroll: false })`
 *   (c) when `?tab=` is absent or invalid, the page falls back to "quick_add"
 *
 * Notes on test strategy:
 *   - `next/navigation` is mocked at the module level. `useSearchParams()`
 *     returns a real `URLSearchParams` so `.get("tab")` behaves exactly like
 *     production.
 *   - We do NOT render the full ParentHeader / Convex-backed widgets — the
 *     PocketMoneyContext.Provider from `renderWithProviders` short-circuits
 *     those at the provider level. ParentHeader still imports `useRouter`
 *     but the mock below covers that too.
 *   - The page wraps its inner in <Suspense>. Reading any tab content
 *     requires Suspense to resolve, which it does synchronously here because
 *     our mocked `useSearchParams` doesn't suspend.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "./test-utils";

const { routerReplaceSpy, routerPushSpy, searchParamsRef } = vi.hoisted(() => ({
  routerReplaceSpy: vi.fn(),
  routerPushSpy: vi.fn(),
  searchParamsRef: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceSpy,
    push: routerPushSpy,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => searchParamsRef.current,
  usePathname: () => "/parent",
}));

import ParentPage from "@/app/parent/page";

beforeEach(() => {
  routerReplaceSpy.mockReset();
  routerPushSpy.mockReset();
  searchParamsRef.current = new URLSearchParams();
});

describe("ParentPage — F10 5.20 (tab state via search params)", () => {
  it("(a) reads the initial active tab from ?tab=approvals", () => {
    searchParamsRef.current = new URLSearchParams("tab=approvals");
    renderWithProviders(<ParentPage />);

    const approvalsTab = screen.getByRole("tab", { name: /approvals/i });
    expect(approvalsTab.getAttribute("aria-selected")).toBe("true");

    const quickAddTab = screen.getByRole("tab", { name: /quick add/i });
    expect(quickAddTab.getAttribute("aria-selected")).toBe("false");
  });

  it("(b) clicking a tab calls router.replace with the new ?tab= value (scroll:false)", async () => {
    const { userEvent } = await import("./test-utils");
    searchParamsRef.current = new URLSearchParams("tab=quick_add");
    renderWithProviders(<ParentPage />);

    const user = userEvent.setup();
    const jobsTab = screen.getByRole("tab", { name: /jobs/i });
    await user.click(jobsTab);

    expect(routerReplaceSpy).toHaveBeenCalledWith("?tab=jobs", {
      scroll: false,
    });
    // We use replace (not push) so back-button doesn't accumulate tab history.
    expect(routerPushSpy).not.toHaveBeenCalled();
  });

  it("(c) falls back to quick_add when ?tab= is absent", () => {
    searchParamsRef.current = new URLSearchParams(); // empty
    renderWithProviders(<ParentPage />);

    const quickAddTab = screen.getByRole("tab", { name: /quick add/i });
    expect(quickAddTab.getAttribute("aria-selected")).toBe("true");
  });

  it("(c) falls back to quick_add when ?tab=<invalid>", () => {
    searchParamsRef.current = new URLSearchParams("tab=not-a-real-tab");
    renderWithProviders(<ParentPage />);

    const quickAddTab = screen.getByRole("tab", { name: /quick add/i });
    expect(quickAddTab.getAttribute("aria-selected")).toBe("true");
  });
});
