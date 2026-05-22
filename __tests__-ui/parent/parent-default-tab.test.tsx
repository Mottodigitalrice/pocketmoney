/**
 * Wave 7 — F10 5.18 (Option A): default tab follows family activity.
 *
 * When the parent navigates to `/parent` with no explicit `?tab=...` query,
 * the page chooses an initial tab based on whether the family has ever had
 * an approved job instance:
 *   - At least one approved instance → default to `overview` (status snapshot)
 *   - Zero approved instances → default to `quick_add` (Wave 6 behaviour)
 *
 * Wave 6's `?tab=` URL override still wins in both cases.
 *
 * Test strategy mirrors ParentPageTabs.test.tsx (Wave 6) — `next/navigation`
 * is module-mocked, and the PocketMoneyContext is fed via `renderWithProviders`
 * so we don't need Convex / Clerk in the loop.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "../test-utils";
import type { JobInstance } from "@/types";

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

function approvedInstance(id: string): JobInstance {
  return {
    _id: id,
    userId: "u1",
    jobId: "job-1",
    childId: "child-1",
    status: "approved",
    approvedAt: Date.UTC(2026, 4, 10, 12, 0, 0),
    createdAt: 0,
  };
}

function pendingInstance(id: string): JobInstance {
  return {
    _id: id,
    userId: "u1",
    jobId: "job-1",
    childId: "child-1",
    status: "in_progress",
    createdAt: 0,
  };
}

beforeEach(() => {
  routerReplaceSpy.mockReset();
  routerPushSpy.mockReset();
  searchParamsRef.current = new URLSearchParams();
});

describe("ParentPage — F10 5.18 (smart default tab)", () => {
  it("defaults to quick_add when family has ZERO approved instances", () => {
    searchParamsRef.current = new URLSearchParams(); // no ?tab=
    renderWithProviders(<ParentPage />, {
      contextValue: {
        jobInstances: [], // nothing approved ever
      },
    });

    const quickAddTab = screen.getByRole("tab", { name: /quick add/i });
    expect(quickAddTab.getAttribute("aria-selected")).toBe("true");

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    expect(overviewTab.getAttribute("aria-selected")).toBe("false");
  });

  it("defaults to quick_add when family has only non-approved instances", () => {
    searchParamsRef.current = new URLSearchParams();
    renderWithProviders(<ParentPage />, {
      contextValue: {
        // No `status: "approved"` here — should NOT flip the default.
        jobInstances: [pendingInstance("p1"), pendingInstance("p2")],
      },
    });

    const quickAddTab = screen.getByRole("tab", { name: /quick add/i });
    expect(quickAddTab.getAttribute("aria-selected")).toBe("true");
  });

  it("defaults to overview when family has at least one approved instance", () => {
    searchParamsRef.current = new URLSearchParams();
    renderWithProviders(<ParentPage />, {
      contextValue: {
        jobInstances: [approvedInstance("a1")],
      },
    });

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    expect(overviewTab.getAttribute("aria-selected")).toBe("true");

    const quickAddTab = screen.getByRole("tab", { name: /quick add/i });
    expect(quickAddTab.getAttribute("aria-selected")).toBe("false");
  });

  it("respects the explicit ?tab= override even when the smart default would pick something else", () => {
    // Family has approvals → smart default would be `overview`.
    // But URL says `?tab=jobs` → that MUST win.
    searchParamsRef.current = new URLSearchParams("tab=jobs");
    renderWithProviders(<ParentPage />, {
      contextValue: {
        jobInstances: [approvedInstance("a1")],
      },
    });

    const jobsTab = screen.getByRole("tab", { name: /jobs/i });
    expect(jobsTab.getAttribute("aria-selected")).toBe("true");

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    expect(overviewTab.getAttribute("aria-selected")).toBe("false");
  });
});
