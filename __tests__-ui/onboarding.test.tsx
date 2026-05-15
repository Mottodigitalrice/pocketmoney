/**
 * H3 — OnboardingPage tests.
 *
 * Covers the three fixes from punchlist frame H3:
 *   - 3.7 Silent save errors: a failing `createChild` mutation surfaces a
 *     translated error message + retry button on StepDone, instead of being
 *     swallowed by `console.error`.
 *   - 3.2 Skip-jobs path: a parent can leave `localJobs` empty (or hit the
 *     "use defaults only" link) and still advance to StepDone — `seedDefaults`
 *     always runs in `handleComplete`, so the home will have 20 chores ready.
 *
 * Strategy: mock `@/lib/env` so `hasAppDataEnv = true` (the live render path),
 * mock `convex/react` per-test so we can control mutation outcomes, mock
 * `next/navigation` to spy on the post-save redirect.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

// Hoisted spies so vi.mock factories can reference them.
//
// `mutationSpies` is a 3-slot ring: the OnboardingPageInner calls
// `useMutation(...)` three times per render — createChild, createJob,
// seedDefaults, in that order. We stub `useMutation` with a counter that
// returns mutationSpies[i % 3] so re-renders keep mapping to the same spies.
// (mockReturnValueOnce would silently expire after the first render and
// downstream calls would return `undefined`, which manifests as
// `createChild is not a function` at the call site.)
const { useQueryMock, useMutationMock, mutationSpies, routerPushSpy } = vi.hoisted(() => {
  const spies = {
    createChild: vi.fn(),
    createJob: vi.fn(),
    seedDefaults: vi.fn(),
  };
  let callIdx = 0;
  const order: Array<keyof typeof spies> = ["createChild", "createJob", "seedDefaults"];
  return {
    useQueryMock: vi.fn(),
    mutationSpies: spies,
    useMutationMock: vi.fn().mockImplementation(() => {
      const spy = spies[order[callIdx % 3]!];
      callIdx += 1;
      return spy;
    }),
    routerPushSpy: vi.fn(),
  };
});

vi.mock("@/lib/env", () => ({
  hasAppDataEnv: true,
  hasClerkEnv: true,
  hasConvexEnv: true,
}));

vi.mock("convex/react", () => ({
  useQuery: useQueryMock,
  useMutation: useMutationMock,
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "clerk-user-123" }, isLoaded: true, isSignedIn: true }),
  useAuth: () => ({ isLoaded: true, isSignedIn: true, userId: "clerk-user-123" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushSpy, replace: vi.fn(), back: vi.fn() }),
}));

// Import AFTER mocks so the page picks up the mocked modules.
import OnboardingPage from "@/app/onboarding/page";

/** Render helper that wraps in LanguageProvider with a seeded locale. */
function renderOnboarding(locale: "en" | "ja" = "en") {
  window.localStorage.clear();
  window.localStorage.setItem("pocketmoney-lang", locale);
  return render(
    <LanguageProvider>
      <OnboardingPage />
    </LanguageProvider>,
  );
}

/** Fill out the children step minimally so we can advance to jobs / done. */
function fillFirstChild() {
  // First name input — there's only one on StepAddChildren initially.
  const nameInput = screen.getByPlaceholderText(/Crew member's name|クルーの名前/);
  fireEvent.change(nameInput, { target: { value: "Jayden" } });
  // First icon button (shark/dolphin/etc.) — pick the first non-disabled one.
  const iconButtons = screen
    .getAllByRole("button")
    .filter((b) => b.querySelector("span.text-3xl")); // emoji-only icon tiles
  // First icon tile that isn't the back button.
  fireEvent.click(iconButtons[0]!);
}

beforeEach(() => {
  useQueryMock.mockReset();
  // Default: convexUser is provisioned and we have an _id so handleComplete
  // can proceed.
  useQueryMock.mockReturnValue({ _id: "convex-user-id", captainCodeEnabled: false });

  // Reset the mutation spies — but NOT useMutationMock itself, since that
  // would clear the `mockImplementation` that maps call order → spy.
  mutationSpies.createChild.mockReset();
  mutationSpies.createJob.mockReset();
  mutationSpies.seedDefaults.mockReset();
  // Default: all mutations succeed. Individual tests can override.
  mutationSpies.createChild.mockResolvedValue(undefined);
  mutationSpies.createJob.mockResolvedValue(undefined);
  mutationSpies.seedDefaults.mockResolvedValue(undefined);

  routerPushSpy.mockReset();
});

describe("OnboardingPage — H3 fixes", () => {
  // 3.2 — skip-jobs path: empty custom jobs list still advances + saves.
  it("3.2 — allows advancing past StepAddJobs with zero custom jobs (skip path clears the list)", async () => {
    // mutationSpies (resolved defaults from beforeEach) cover all three.
    const { createChild: createChildSpy, createJob: createJobSpy, seedDefaults: seedDefaultsSpy } = mutationSpies;

    renderOnboarding();

    // StepWelcome → StepAddChildren.
    fireEvent.click(screen.getByText(/Get Started/));
    // Real setTimeout in goToStep needs to elapse — flush via tick.
    await new Promise((r) => setTimeout(r, 250));

    fillFirstChild();
    // Hit Next on StepAddChildren.
    fireEvent.click(screen.getByText("Next"));
    await new Promise((r) => setTimeout(r, 250));

    // StepAddJobs is now showing. Use the skip link — clears the seeded
    // single empty job.
    const skipBtn = screen.getByTestId("onboarding-skip-jobs");
    fireEvent.click(skipBtn);

    // Next should now be enabled (empty list is valid).
    const nextBtn = screen.getByTestId("onboarding-jobs-next");
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);
    await new Promise((r) => setTimeout(r, 250));

    // StepDone visible — locate the start-adventure CTA.
    const startBtn = screen.getByText(/Start Your Adventure/);
    fireEvent.click(startBtn);

    // Flush all microtasks for the async handleComplete loop.
    await new Promise((r) => setTimeout(r, 50));

    // seedDefaults must have run regardless — that's the whole point of the
    // skip path. createJob must NOT have run (no custom jobs to create).
    expect(seedDefaultsSpy).toHaveBeenCalledTimes(1);
    expect(createJobSpy).not.toHaveBeenCalled();
    // And createChild ran once for Jayden.
    expect(createChildSpy).toHaveBeenCalledTimes(1);
    // Router was pushed to /.
    expect(routerPushSpy).toHaveBeenCalledWith("/");
  });

  it("3.2 — StepAddJobs subtitle copy mentions the 20 built-in chores fallback", () => {
    renderOnboarding();

    // Hop straight to StepAddJobs via the welcome → children → jobs flow.
    fireEvent.click(screen.getByText(/Get Started/));
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        fillFirstChild();
        fireEvent.click(screen.getByText("Next"));
        setTimeout(() => {
          // Skip-jobs explanatory copy should now be visible on StepAddJobs.
          expect(
            screen.getByText(/skip this and we'll set up 20 starter chores/i),
          ).toBeInTheDocument();
          resolve();
        }, 250);
      }, 250);
    });
  });

  // 3.7 — silent save errors are now surfaced.
  it("3.7 — when createChild throws, StepDone shows the translated error + retry button", async () => {
    // Override createChild to reject with a network-flavored error so
    // mapConvexError classifies it as NETWORK → error_network copy.
    const networkErr = new Error("Failed to fetch");
    mutationSpies.createChild.mockReset();
    mutationSpies.createChild.mockRejectedValue(networkErr);
    const createChildSpy = mutationSpies.createChild;

    // Silence console.error for this test — the catch logs intentionally.
    const consoleErrSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderOnboarding();

    fireEvent.click(screen.getByText(/Get Started/));
    await new Promise((r) => setTimeout(r, 250));
    fillFirstChild();
    fireEvent.click(screen.getByText("Next"));
    await new Promise((r) => setTimeout(r, 250));
    // Skip jobs.
    fireEvent.click(screen.getByTestId("onboarding-skip-jobs"));
    fireEvent.click(screen.getByTestId("onboarding-jobs-next"));
    await new Promise((r) => setTimeout(r, 250));

    // StepDone — trigger the failing save.
    fireEvent.click(screen.getByText(/Start Your Adventure/));
    // Let the rejected promise propagate and React re-render.
    await new Promise((r) => setTimeout(r, 50));

    // The error alert renders with the translated title.
    const errorBox = screen.getByTestId("onboarding-save-error");
    expect(errorBox).toBeInTheDocument();
    expect(errorBox).toHaveTextContent(/squall|couldn't save your crew/i);
    // The mapped message for a network error contains "ship" + connection copy.
    expect(errorBox).toHaveTextContent(/can't reach the ship/i);

    // Retry button is present, enabled (saving has finished).
    const retryBtn = screen.getByTestId("onboarding-save-retry");
    expect(retryBtn).toBeInTheDocument();
    expect(retryBtn).not.toBeDisabled();

    // Clicking retry re-runs handleComplete — createChild is called a second
    // time. We don't need to assert success here; just that the retry wires
    // back to the same save path.
    fireEvent.click(retryBtn);
    await new Promise((r) => setTimeout(r, 50));
    expect(createChildSpy).toHaveBeenCalledTimes(2);

    // Router was NEVER pushed because both attempts failed.
    expect(routerPushSpy).not.toHaveBeenCalled();

    consoleErrSpy.mockRestore();
  });

  it("3.7 — no error UI is shown on the happy path (clean StepDone)", async () => {
    // mutationSpies defaults are all resolved-undefined.
    renderOnboarding();

    fireEvent.click(screen.getByText(/Get Started/));
    await new Promise((r) => setTimeout(r, 250));
    fillFirstChild();
    fireEvent.click(screen.getByText("Next"));
    await new Promise((r) => setTimeout(r, 250));
    fireEvent.click(screen.getByTestId("onboarding-skip-jobs"));
    fireEvent.click(screen.getByTestId("onboarding-jobs-next"));
    await new Promise((r) => setTimeout(r, 250));

    // Pre-click: no error rendered.
    expect(screen.queryByTestId("onboarding-save-error")).toBeNull();
  });
});

// S1 (R4) — StepAddChildren copy refinements
//
// These tests pin the F10 3.1 / 3.4 / 3.5 copy refinements so a future
// reorganization can't silently drop them. They render StepAddChildren via the
// welcome → children flow (same path as the H3 tests above).
describe("OnboardingPage — S1 (R4) StepAddChildren copy", () => {
  // Helper: get into StepAddChildren and let the float-up animation settle.
  async function gotoStepChildren() {
    renderOnboarding();
    fireEvent.click(screen.getByText(/Get Started/));
    await new Promise((r) => setTimeout(r, 250));
  }

  it("3.1 — kid-name hint is visible on the children step", async () => {
    await gotoStepChildren();
    expect(
      screen.getByText(/This is the name your kid will see/i),
    ).toBeInTheDocument();
  });

  it("3.4 — solo-child state shows '+ Add a Sibling' (not 'Add Another Crew Member')", async () => {
    await gotoStepChildren();
    // Solo state: 1 LocalChild prefilled — the add button should read "Add a Sibling".
    expect(screen.getByText("+ Add a Sibling")).toBeInTheDocument();
    // The generic 'Crew Member' copy is NOT shown when solo.
    expect(screen.queryByText("+ Add Another Crew Member")).toBeNull();
  });

  it("3.5 — solo-child state surfaces the sibling-leaderboard unlock hint", async () => {
    await gotoStepChildren();
    expect(
      screen.getByText(/Add 2\+ kids to unlock the sibling leaderboard/i),
    ).toBeInTheDocument();
  });

  it("3.4 + 3.5 — adding a second child swaps the CTA back to 'Add Another Crew Member' and hides the hint", async () => {
    await gotoStepChildren();
    // Click "+ Add a Sibling" to go from 1 → 2 children.
    fireEvent.click(screen.getByText("+ Add a Sibling"));
    // Now the CTA reads the generic crew-member copy.
    expect(screen.getByText("+ Add Another Crew Member")).toBeInTheDocument();
    // And the unlock hint is gone (already unlocked).
    expect(
      screen.queryByText(/Add 2\+ kids to unlock the sibling leaderboard/i),
    ).toBeNull();
  });
});

// S1 (R4) — StepAddJobs copy refinements (F10 3.3)
describe("OnboardingPage — S1 (R4) StepAddJobs copy", () => {
  it("3.3 — yen tip is visible under the yen input on the job form card", async () => {
    renderOnboarding();
    fireEvent.click(screen.getByText(/Get Started/));
    await new Promise((r) => setTimeout(r, 250));
    fillFirstChild();
    fireEvent.click(screen.getByText("Next"));
    await new Promise((r) => setTimeout(r, 250));

    // Now on StepAddJobs with the default seeded job card; tip should render.
    expect(
      screen.getByText(/¥50–¥300 per chore is typical/i),
    ).toBeInTheDocument();
  });
});
