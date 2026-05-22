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
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, screen, act } from "@testing-library/react";
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
const { useQueryMock, useMutationMock, mutationSpies, routerPushSpy } =
  vi.hoisted(() => {
    const spies = {
      createChild: vi.fn(),
      createJob: vi.fn(),
      seedDefaults: vi.fn(),
    };
    let callIdx = 0;
    const order: Array<keyof typeof spies> = [
      "createChild",
      "createJob",
      "seedDefaults",
    ];
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

// Wave 8c — mock motion/react's useReducedMotion so the celebration tests can
// flip the reduced-motion branch deterministically (jsdom doesn't ship
// matchMedia, so the un-mocked hook would log warnings and return false). The
// default `false` mirrors normal viewport behavior; specific reduced-motion
// tests override via `vi.mocked(useReducedMotion).mockReturnValueOnce(true)`.
vi.mock("motion/react", async () => {
  const actual =
    await vi.importActual<typeof import("motion/react")>("motion/react");
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

vi.mock("convex/react", () => ({
  useQuery: useQueryMock,
  useMutation: useMutationMock,
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: { id: "clerk-user-123" },
    isLoaded: true,
    isSignedIn: true,
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "clerk-user-123",
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushSpy, replace: vi.fn(), back: vi.fn() }),
}));

// Import AFTER mocks so the page picks up the mocked modules.
import OnboardingPage from "@/app/onboarding/page";
import { useReducedMotion } from "motion/react";

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
  const nameInput = screen.getByPlaceholderText(
    /Crew member's name|クルーの名前/,
  );
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
  useQueryMock.mockReturnValue({
    _id: "convex-user-id",
    captainCodeEnabled: false,
  });

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
    // flake harden: React 19 hydration jitter caused 250ms real-time wait; fake timers stabilize
    // Only fake setTimeout — leaving microtask/queueMicrotask/requestAnimationFrame
    // real so React 19's scheduler isn't disrupted.
    vi.useFakeTimers({ toFake: ["setTimeout"] });

    // mutationSpies (resolved defaults from beforeEach) cover all three.
    const {
      createChild: createChildSpy,
      createJob: createJobSpy,
      seedDefaults: seedDefaultsSpy,
    } = mutationSpies;

    renderOnboarding();

    // StepWelcome → StepAddChildren.
    fireEvent.click(screen.getByText(/Get Started/));
    // flake harden: advance fake timers past the goToStep 200ms fade.
    // Wrap in act() so the React 19 scheduler flushes the setStep + setVisible
    // state updates triggered by the timer callback before the next assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    fillFirstChild();
    // Hit Next on StepAddChildren.
    fireEvent.click(screen.getByText("Next"));
    // flake harden: advance fake timers past the goToStep 200ms fade.
    // Wrap in act() so the React 19 scheduler flushes the setStep + setVisible
    // state updates triggered by the timer callback before the next assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    // StepAddJobs is now showing. Use the skip link — clears the seeded
    // single empty job.
    const skipBtn = screen.getByTestId("onboarding-skip-jobs");
    fireEvent.click(skipBtn);

    // Next should now be enabled (empty list is valid).
    const nextBtn = screen.getByTestId("onboarding-jobs-next");
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);
    // flake harden: advance fake timers past the goToStep 200ms fade.
    // Wrap in act() so the React 19 scheduler flushes the setStep + setVisible
    // state updates triggered by the timer callback before the next assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    // StepDone visible — locate the start-adventure CTA.
    const startBtn = screen.getByText(/Start Your Adventure/);
    fireEvent.click(startBtn);

    // flake harden: flush async handleComplete loop microtasks.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    // seedDefaults must have run regardless — that's the whole point of the
    // skip path. createJob must NOT have run (no custom jobs to create).
    expect(seedDefaultsSpy).toHaveBeenCalledTimes(1);
    expect(createJobSpy).not.toHaveBeenCalled();
    // And createChild ran once for Jayden.
    expect(createChildSpy).toHaveBeenCalledTimes(1);

    // Wave 8c — the redirect is now scheduled behind the celebration overlay
    // (~2000ms). Advance fake timers past the celebration window so the
    // router.push fires before the assertion below.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2050);
    });

    // Router was pushed to /.
    expect(routerPushSpy).toHaveBeenCalledWith("/");

    vi.useRealTimers();
  });

  it("3.2 — StepAddJobs subtitle copy mentions the 20 built-in chores fallback", async () => {
    // Use the same async-step pattern as the H3 3.7 test (which is
    // stable) — fireEvent + raw setTimeout flushes between each step.
    // Then findByText polls + retries with an 8s safety belt so the
    // 5s default testing-library timeout can't race React 19's slower
    // hydration flush on OnboardingPageInner.
    renderOnboarding();

    // StepWelcome → StepAddChildren.
    fireEvent.click(screen.getByText(/Get Started/));
    await new Promise((r) => setTimeout(r, 250));

    // StepAddChildren → StepAddJobs.
    fillFirstChild();
    fireEvent.click(screen.getByText("Next"));
    await new Promise((r) => setTimeout(r, 250));

    // Skip-jobs explanatory copy should now be visible on StepAddJobs.
    await screen.findByText(
      /skip this and we'll set up 20 starter chores/i,
      {},
      { timeout: 8000 },
    );
  }, 15000);

  // 3.7 — silent save errors are now surfaced.
  it("3.7 — when createChild throws, StepDone shows the translated error + retry button", async () => {
    // flake harden: React 19 hydration jitter caused 250ms real-time wait; fake timers stabilize
    // Only fake setTimeout — leaving microtask/queueMicrotask/requestAnimationFrame
    // real so React 19's scheduler isn't disrupted.
    vi.useFakeTimers({ toFake: ["setTimeout"] });

    // Override createChild to reject with a network-flavored error so
    // mapConvexError classifies it as NETWORK → error_network copy.
    const networkErr = new Error("Failed to fetch");
    mutationSpies.createChild.mockReset();
    mutationSpies.createChild.mockRejectedValue(networkErr);
    const createChildSpy = mutationSpies.createChild;

    // Silence console.error for this test — the catch logs intentionally.
    const consoleErrSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    renderOnboarding();

    fireEvent.click(screen.getByText(/Get Started/));
    // flake harden: advance fake timers past the goToStep 200ms fade.
    // Wrap in act() so the React 19 scheduler flushes the setStep + setVisible
    // state updates triggered by the timer callback before the next assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    fillFirstChild();
    fireEvent.click(screen.getByText("Next"));
    // flake harden: advance fake timers past the goToStep 200ms fade.
    // Wrap in act() so the React 19 scheduler flushes the setStep + setVisible
    // state updates triggered by the timer callback before the next assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    // Skip jobs.
    fireEvent.click(screen.getByTestId("onboarding-skip-jobs"));
    fireEvent.click(screen.getByTestId("onboarding-jobs-next"));
    // flake harden: advance fake timers past the goToStep 200ms fade.
    // Wrap in act() so the React 19 scheduler flushes the setStep + setVisible
    // state updates triggered by the timer callback before the next assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    // StepDone — trigger the failing save.
    fireEvent.click(screen.getByText(/Start Your Adventure/));
    // flake harden: flush rejected-promise propagation + React re-render microtasks.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

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
    // flake harden: flush retry-attempt async tick.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(createChildSpy).toHaveBeenCalledTimes(2);

    // Router was NEVER pushed because both attempts failed.
    expect(routerPushSpy).not.toHaveBeenCalled();

    consoleErrSpy.mockRestore();
    vi.useRealTimers();
  });

  it("3.7 — no error UI is shown on the happy path (clean StepDone)", async () => {
    // flake harden: React 19 hydration jitter caused 250ms real-time wait; fake timers stabilize
    // Only fake setTimeout — leaving microtask/queueMicrotask/requestAnimationFrame
    // real so React 19's scheduler isn't disrupted.
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    // mutationSpies defaults are all resolved-undefined.
    renderOnboarding();

    fireEvent.click(screen.getByText(/Get Started/));
    // flake harden: advance fake timers past the goToStep 200ms fade.
    // Wrap in act() so the React 19 scheduler flushes the setStep + setVisible
    // state updates triggered by the timer callback before the next assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    fillFirstChild();
    fireEvent.click(screen.getByText("Next"));
    // flake harden: advance fake timers past the goToStep 200ms fade.
    // Wrap in act() so the React 19 scheduler flushes the setStep + setVisible
    // state updates triggered by the timer callback before the next assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    fireEvent.click(screen.getByTestId("onboarding-skip-jobs"));
    fireEvent.click(screen.getByTestId("onboarding-jobs-next"));
    // flake harden: advance fake timers past the goToStep 200ms fade.
    // Wrap in act() so the React 19 scheduler flushes the setStep + setVisible
    // state updates triggered by the timer callback before the next assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    // Pre-click: no error rendered.
    expect(screen.queryByTestId("onboarding-save-error")).toBeNull();

    vi.useRealTimers();
  });
});

// S1 (R4) — StepAddChildren copy refinements
//
// These tests pin the F10 3.1 / 3.4 / 3.5 copy refinements so a future
// reorganization can't silently drop them. They render StepAddChildren via the
// welcome → children flow (same path as the H3 tests above).
describe("OnboardingPage — S1 (R4) StepAddChildren copy", () => {
  // flake harden: fake timers for every test in this describe — the
  // gotoStepChildren helper crosses one goToStep boundary, so we deterministically
  // advance time rather than wall-clock waiting 250ms.
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper: get into StepAddChildren and let the float-up animation settle.
  async function gotoStepChildren() {
    renderOnboarding();
    fireEvent.click(screen.getByText(/Get Started/));
    // flake harden: advance fake timers past the goToStep 200ms fade.
    // Wrap in act() so the React 19 scheduler flushes the setStep + setVisible
    // state updates triggered by the timer callback before the next assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
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

    // Now on StepAddJobs with the default seeded job card; tip should
    // render. findByText polls (8s safety belt) so React 19's hydration
    // can flush even on slow thread-pool scheduling — getByText raced.
    await screen.findByText(
      /¥50–¥300 per chore is typical/i,
      {},
      { timeout: 8000 },
    );
  }, 15000);
});

// Wave 8c — onboarding-complete celebration tests.
//
// The flow under test: parent fills the funnel → hits "Start Your Adventure"
// on StepDone → handleComplete resolves all mutations → `isCelebrating` flips
// → full-screen celebration overlay renders for ~2000ms (or ~800ms under
// reduced motion) → router.push("/") fires.
//
// Re-uses the same `vi.useFakeTimers({ toFake: ["setTimeout"] })` harness
// that Wave 5b put in place (only setTimeout is faked so React 19's
// scheduler still runs microtasks/RAF on real time).
describe("OnboardingPage — Wave 8c celebration", () => {
  // Helper: drive the funnel from welcome → done → click Start Adventure.
  // Returns after the click + a 50ms microtask flush so the resolved
  // mutations have applied state (isCelebrating = true).
  async function runFunnelAndStart() {
    renderOnboarding();
    fireEvent.click(screen.getByText(/Get Started/));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    fillFirstChild();
    fireEvent.click(screen.getByText("Next"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    // Skip custom jobs (defaults will seed). Same path the H3 3.2 test takes.
    fireEvent.click(screen.getByTestId("onboarding-skip-jobs"));
    fireEvent.click(screen.getByTestId("onboarding-jobs-next"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    fireEvent.click(screen.getByText(/Start Your Adventure/));
    // Flush the awaited mutations + the setIsCelebrating state update.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    // Default to "motion enabled" — the reduced-motion test overrides this.
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.mocked(useReducedMotion).mockReset();
    vi.mocked(useReducedMotion).mockReturnValue(false);
    vi.useRealTimers();
  });

  it("Wave 8c — celebration overlay renders after final-step submit", async () => {
    await runFunnelAndStart();
    // Overlay testid is the contract for downstream / Playwright probes.
    expect(
      screen.getByTestId("onboarding-celebrate-overlay"),
    ).toBeInTheDocument();
    // Redirect should NOT have fired yet — we're inside the celebration window.
    expect(routerPushSpy).not.toHaveBeenCalled();
  });

  it("Wave 8c — celebration title interpolates the first crew member's name", async () => {
    await runFunnelAndStart();
    // The first child's name (fillFirstChild typed "Jayden") is interpolated
    // into "Welcome aboard, Captain {{familyName}}!".
    const overlay = screen.getByTestId("onboarding-celebrate-overlay");
    expect(overlay).toHaveTextContent(/Welcome aboard, Captain Jayden!/);
  });

  it("Wave 8c — aria-live announcement region renders the announce key", async () => {
    await runFunnelAndStart();
    const announce = screen.getByTestId("onboarding-celebrate-a11y-announce");
    expect(announce).toBeInTheDocument();
    // Polite + atomic so screen readers wait for the full string.
    expect(announce).toHaveAttribute("aria-live", "polite");
    expect(announce).toHaveAttribute("aria-atomic", "true");
    expect(announce).toHaveTextContent(
      /Family setup complete\. Welcome to Pirate Money\./,
    );
  });

  it("Wave 8c — full-motion redirect fires after ~2000ms", async () => {
    await runFunnelAndStart();
    // Just before the window closes — still no redirect.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1900);
    });
    expect(routerPushSpy).not.toHaveBeenCalled();
    // Past 2000ms — redirect fires.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(routerPushSpy).toHaveBeenCalledWith("/");
  });

  it("Wave 8c — reduced-motion path redirects at ~800ms (skips coin-rain)", async () => {
    // Flip the reduced-motion branch BEFORE the page renders, so the page +
    // the celebration component both see `true`.
    vi.mocked(useReducedMotion).mockReturnValue(true);

    await runFunnelAndStart();

    // Coin-rain overlay is skipped under reduced motion.
    expect(screen.queryByTestId("onboarding-celebrate-coin-burst")).toBeNull();
    // Overlay + announce region still render — reduced motion suppresses
    // particles, not the message itself.
    expect(
      screen.getByTestId("onboarding-celebrate-overlay"),
    ).toBeInTheDocument();

    // Just before the reduced window closes — still no redirect.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(routerPushSpy).not.toHaveBeenCalled();
    // Past 800ms — redirect fires.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(routerPushSpy).toHaveBeenCalledWith("/");
  });
});
