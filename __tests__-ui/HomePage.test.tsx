/**
 * H3 — HomePage tests.
 *
 * Covers punchlist 2.1 — the AppSkeleton render path during the convexUser
 * provisioning race now shows a friendly "Loading your crew…" label rather
 * than just a blank shimmer. The test asserts the label is visible whenever
 * the HomePage falls into its loading branch (isLoading || zero children).
 *
 * Strategy: drive `usePocketMoney` via the PocketMoneyContext.Provider with a
 * partial override (the standard `renderWithProviders` pattern from G4). The
 * default `hasClerkEnv = false` in jsdom land means HomePage takes the
 * `HomePageInnerWithoutClerk` branch — which is functionally identical for
 * the loading-state behavior we're testing.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "./test-utils";

// Mock next/navigation so the redirect-to-onboarding effect doesn't throw.
const { routerPushSpy } = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushSpy, replace: vi.fn(), back: vi.fn() }),
}));

import HomePage from "@/app/page";

beforeEach(() => {
  routerPushSpy.mockReset();
});

describe("HomePage — H3 punchlist 2.1 (friendlier loading)", () => {
  it("shows the AppSkeleton when isLoading is true (convexUser still provisioning)", () => {
    renderWithProviders(<HomePage />, {
      contextValue: {
        isLoading: true,
        userId: null,
        familyChildren: [],
      },
    });

    expect(screen.getByTestId("app-skeleton")).toBeInTheDocument();
  });

  it("renders the 'Loading your crew…' label inside the home skeleton", () => {
    renderWithProviders(<HomePage />, {
      contextValue: {
        isLoading: true,
        userId: null,
        familyChildren: [],
      },
    });

    const label = screen.getByTestId("home-loading-label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent(/Loading your crew/i);
  });

  it("uses the Japanese localized loading copy when locale=ja", () => {
    renderWithProviders(<HomePage />, {
      initialLang: "ja",
      contextValue: {
        isLoading: true,
        userId: null,
        familyChildren: [],
      },
    });

    const label = screen.getByTestId("home-loading-label");
    expect(label).toHaveTextContent(/クルーをよみこみ中/);
  });

  it("does NOT render the empty CharacterCard grid during the loading branch (signed-in + zero kids)", () => {
    // This is the exact race the punchlist describes: convexUser provisioned
    // (userId truthy) but familyChildren still empty → redirect-to-onboarding
    // is queued in useEffect, but the render must NOT flash an empty grid.
    renderWithProviders(<HomePage />, {
      contextValue: {
        isLoading: false,
        userId: "u1",
        familyChildren: [],
      },
    });

    // AppSkeleton is what renders here, not the OceanScene character grid.
    expect(screen.getByTestId("app-skeleton")).toBeInTheDocument();
    // No "Who are you?" copy from the empty CharacterCard scene.
    expect(screen.queryByText(/Who are you\?/i)).toBeNull();
  });
});
