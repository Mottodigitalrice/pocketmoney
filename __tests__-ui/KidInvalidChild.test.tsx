/**
 * H4 — KidPage invalid-child fallback test (Gap 6.10).
 *
 * When a kid lands on `/kid/[childId]` with a childId the current user
 * doesn't own (deleted, wrong family, link copy-paste), the page must
 * render a recovery affordance — not just plain "Who are you?" text.
 *
 * We only test the fallback branch. The happy-path render is covered by
 * the page's downstream components (KanbanBoard, WeeklyTracker, etc.) in
 * their own tests; spinning all of that up here would duplicate provider
 * wiring without testing the H4 delta.
 */
import { describe, it, expect } from "vitest";
import { Suspense } from "react";
import { act } from "@testing-library/react";
import { renderWithProviders, screen } from "./test-utils";
import KidPage from "@/app/kid/[childId]/page";

describe("KidPage — invalid child fallback (Gap 6.10)", () => {
  it("renders the back-home link when getChildById returns undefined", async () => {
    // KidPage uses React.use(params) which suspends until the params promise
    // resolves. Wrap in Suspense so RTL's `findBy*` queries can await past it.
    // The params promise needs an explicit microtask flush via act() — RTL's
    // findBy* alone doesn't drain the React internals' pending promise queue.
    const params = Promise.resolve({ childId: "ghost-child" });
    await act(async () => {
      renderWithProviders(
        <Suspense fallback={<div data-testid="kid-suspense-fallback" />}>
          <KidPage params={params} />
        </Suspense>,
        {
          contextValue: {
            // getChildById defaults to () => undefined → "no child" branch.
          },
        },
      );
      // Allow the params promise + React's internal use() bookkeeping to
      // settle before assertions.
      await params;
    });

    expect(screen.getByText(/Who are you/i)).toBeInTheDocument();

    // The H4-added back-home link is present and points at "/" (ROUTES.home).
    const back = screen.getByRole("link", { name: /Back home/i });
    expect(back).toBeInTheDocument();
    expect(back.getAttribute("href")).toBe("/");
  });
});
