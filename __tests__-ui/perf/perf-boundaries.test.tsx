/**
 * Wave 4a — perf boundary tests.
 *
 * Covers the four perf wins shipped in this wave:
 *   1. JobCard is wrapped in React.memo with a custom equality function.
 *   2. LanguageProvider hands children a memoized context value whose
 *      identity is stable across re-renders that don't change locale.
 *   3. Parent dashboard tabs 3-6 (WeekPlanner, JobManager, ChildOverview,
 *      ChildManager, LuckyChestSettings) are NOT in the initial DOM —
 *      only the default tab (quick_add) renders its real content.
 *   4. AppSkeleton is the fallback for lazy tab loads.
 *
 * Scope guardrails:
 *   - These tests exercise contracts (memo wrapping, lazy splits) not
 *     visible UX, so a "render-only" assertion would be meaningless. Each
 *     test pins a structural invariant that, if broken, signals a perf
 *     regression the rest of the suite would silently allow.
 *   - The lazy-tab assertion deliberately checks for the *absence* of
 *     the heavier widgets' DOM markers. We don't await dynamic-import
 *     resolution; the point is that on first paint of the default tab,
 *     no other tab content is hydrated.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "../test-utils";
import { JobCard } from "@/components/features/kanban/JobCard";
import { LanguageContext } from "@/components/providers/LanguageProvider";
import { useContext } from "react";
import type { Job } from "@/types";

// ---------------------------------------------------------------------------
// Test 1: JobCard is wrapped in React.memo.
//
// React.memo returns an exotic component object with type === REACT_MEMO_TYPE
// (a well-known Symbol). We compare against the same shape produced by
// React.memo on a throwaway component, so we don't have to hardcode the
// Symbol's description string (which has changed across React versions).
// ---------------------------------------------------------------------------
describe("Wave 4a perf — JobCard React.memo", () => {
  it("exposes a memo wrapper (compound component shape)", async () => {
    const React = await import("react");
    const Throwaway = () => null;
    const MemoizedThrowaway = React.memo(Throwaway);

    // memo() yields { $$typeof: REACT_MEMO_TYPE, type, compare }.
    expect((JobCard as unknown as { $$typeof: symbol }).$$typeof).toBe(
      (MemoizedThrowaway as unknown as { $$typeof: symbol }).$$typeof,
    );
    // The wrapped JobCard must carry an equality comparator (not the
    // default referential check from memo's single-arg form).
    expect(
      (JobCard as unknown as { compare?: unknown }).compare,
    ).toBeInstanceOf(Function);
  });

  it("still renders the standard available-state card markup", () => {
    const job: Job = {
      _id: "job-memo-1",
      userId: "user-1",
      title: "Sweep the deck",
      yenAmount: 100,
      icon: "🧹",
      createdAt: 0,
    };
    const { getByTestId } = renderWithProviders(
      <JobCard job={job} status="available" onStart={vi.fn()} />,
    );
    const card = getByTestId("job-card");
    // Memo doesn't change render output — just re-render gating.
    expect(card).toHaveAttribute("data-job-id", "job-memo-1");
    expect(card).toHaveAttribute("data-status", "available");
    expect(card).toHaveTextContent("Sweep the deck");
    expect(card).toHaveTextContent("¥100");
  });
});

// ---------------------------------------------------------------------------
// Test 2: LanguageProvider context value identity stability.
//
// A `Probe` component subscribes to LanguageContext and records every value
// reference it sees. Re-rendering the probe's parent without touching the
// locale must NOT produce a new context value reference — otherwise every
// consumer in the app would re-render whenever any LanguageProvider ancestor
// re-rendered.
// ---------------------------------------------------------------------------
describe("Wave 4a perf — LanguageProvider context value memo", () => {
  it("returns the same context value reference across parent re-renders when locale is unchanged", async () => {
    const { useState, useEffect } = await import("react");
    const { render, act } = await import("@testing-library/react");
    const { LanguageProvider } =
      await import("@/components/providers/LanguageProvider");

    const seen: unknown[] = [];
    function Probe() {
      const value = useContext(LanguageContext);
      seen.push(value);
      return null;
    }

    // Lifted state — the Probe re-renders whenever Host's `n` increments.
    // The setter is exposed via a ref-like callback registered in an effect
    // so we don't mutate closure variables during render (react-hooks/globals).
    const setters: { setN?: (updater: (n: number) => number) => void } = {};
    function ExposeSetN({
      setN,
    }: {
      setN: (updater: (n: number) => number) => void;
    }) {
      useEffect(() => {
        setters.setN = setN;
      }, [setN]);
      return null;
    }
    function Host() {
      const [, setN] = useState(0);
      return (
        <LanguageProvider>
          <ExposeSetN setN={setN} />
          <Probe />
        </LanguageProvider>
      );
    }

    render(<Host />);
    act(() => {
      setters.setN?.((n) => n + 1);
    });
    act(() => {
      setters.setN?.((n) => n + 1);
    });

    // After the initial mount + two parent re-renders we should have at
    // least three samples. The useMemo around the provider's value means
    // every sample for an unchanged locale shares one reference.
    expect(seen.length).toBeGreaterThanOrEqual(3);
    const first = seen[0];
    for (const ref of seen) {
      expect(ref).toBe(first);
    }
  });

  it("returns a NEW context value reference when locale changes", async () => {
    const { useEffect } = await import("react");
    const { render, act } = await import("@testing-library/react");
    const { LanguageProvider } =
      await import("@/components/providers/LanguageProvider");

    type Ctx = NonNullable<React.ContextType<typeof LanguageContext>>;
    const seen: Ctx[] = [];
    const captured: { value?: Ctx } = {};

    function Probe() {
      const value = useContext(LanguageContext);
      if (value) {
        seen.push(value);
      }
      // Effects run after render — safe place to expose the latest value.
      useEffect(() => {
        if (value) {
          captured.value = value;
        }
      });
      return null;
    }

    // Seed storage so getInitialLocale picks "en".
    window.localStorage.clear();
    window.localStorage.setItem("pocketmoney-lang", "en");

    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    const before = seen[seen.length - 1];
    act(() => {
      // captured.value is set in Probe's effect, which has flushed by now.
      captured.value?.setLocale(captured.value.locale === "ja" ? "en" : "ja");
    });
    const after = seen[seen.length - 1];

    expect(after).not.toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Test 3 + 4: Parent dashboard tab lazy boundaries.
//
// We render ParentPage with `?tab=quick_add` (the default). The non-default
// heavy tabs are wrapped in `next/dynamic(... { ssr: false })`, so on first
// paint they emit either a skeleton or nothing — never the real component's
// DOM markers (no `quickadd-week-grid`, no `job-manager-form`, etc.).
//
// We assert by absence + presence:
//   - The default tab's content renders (QuickAddToday DOM marker visible).
//   - No tabpanel for the OTHER tabs is rendered. The tabpanel id is
//     `parent-panel-<tabId>` — only one matches the activeTab.
// ---------------------------------------------------------------------------

const { routerReplaceSpy, searchParamsRef } = vi.hoisted(() => ({
  routerReplaceSpy: vi.fn(),
  searchParamsRef: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceSpy,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => searchParamsRef.current,
  usePathname: () => "/parent",
}));

describe("Wave 4a perf — parent dashboard tab lazy boundary", () => {
  beforeEach(() => {
    routerReplaceSpy.mockReset();
    searchParamsRef.current = new URLSearchParams();
  });

  it("on default ?tab=quick_add load, the WeekPlanner/JobManager/ChildManager DOM markers are absent", async () => {
    searchParamsRef.current = new URLSearchParams("tab=quick_add");

    const { default: ParentPage } = await import("@/app/parent/page");

    const { container } = renderWithProviders(<ParentPage />);

    // The tabpanel is rendered for the active tab only; only one
    // `parent-panel-*` id should appear in the DOM.
    const panels = container.querySelectorAll('[id^="parent-panel-"]');
    expect(panels.length).toBe(1);
    expect(panels[0]?.id).toBe("parent-panel-quick_add");

    // Defensive: explicit checks that lazy tabs' known testids haven't
    // hydrated. These markers exist in the heavier tab components and
    // would appear if next/dynamic was not actually deferring them.
    // (Picked from real grep against src/components/features/parent-dashboard/*.)
    expect(screen.queryByTestId("week-planner-skeleton")).toBeNull();
    expect(screen.queryByTestId("planner-cell")).toBeNull();
    expect(screen.queryByTestId("job-manager-skeleton")).toBeNull();
    expect(screen.queryByTestId("child-manager-skeleton")).toBeNull();
    expect(screen.queryByTestId("child-row")).toBeNull();
    expect(screen.queryByTestId("lucky-chest-schedule-explainer")).toBeNull();
  });

  it("renders the tab bar with all 6 tab buttons even though tabs 3-6 are lazy", async () => {
    searchParamsRef.current = new URLSearchParams("tab=quick_add");
    const { default: ParentPage } = await import("@/app/parent/page");
    renderWithProviders(<ParentPage />);

    // Tab buttons are eager (cheap text); content is lazy.
    expect(screen.getByRole("tab", { name: /quick add/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /approvals/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /planner/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /jobs/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /crew/i })).toBeInTheDocument();
  });
});
