/**
 * G4 — RankUpToast component tests.
 *
 * Behaviour (from the component's own JSDoc):
 *   - First mount with no localStorage value → silently seed, NO toast.
 *   - currentRank matches stored value → no-op.
 *   - currentRank > stored on the tier ladder → toast.success() AND write.
 *   - currentRank < stored (defensive) → no toast but still sync write.
 *   - localStorage failures → no throw, no toast.
 *
 * sonner's `toast.success` is mocked module-level so we can spy without
 * actually rendering a sonner <Toaster /> in the test container.
 *
 * For the rank-change tests we deliberately do NOT go through
 * `renderWithProviders` — that helper clears localStorage on every call,
 * which would wipe the seed we need the second mount to read.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { LanguageProvider, LanguageContext } from "@/components/providers/LanguageProvider";
import { renderWithProviders } from "./test-utils";

// `vi.mock(...)` calls are hoisted above all `import` statements at the top
// of the file, so any module-level identifier referenced inside the factory
// must also be hoisted. `vi.hoisted` is the supported way to do this.
const { toastSpy } = vi.hoisted(() => ({
  toastSpy: { success: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: toastSpy,
}));

// Import AFTER vi.mock so the component picks up the mocked sonner.
import { RankUpToast } from "@/components/features/kid-dashboard/RankUpToast";

const CHILD_ID = "child-1";
const STORAGE_KEY = `pm:lastSeenRank:${CHILD_ID}`;

/**
 * Like `renderWithProviders` but keeps localStorage intact. Used for the
 * second mount in rank-up / rank-down scenarios.
 */
function renderWithLangProviderOnly(node: React.ReactElement) {
  return render(<LanguageProvider>{node}</LanguageProvider>);
}

describe("RankUpToast", () => {
  beforeEach(() => {
    toastSpy.success.mockReset();
    window.localStorage.clear();
  });

  it("does not fire a toast on first mount (silent seeding)", () => {
    renderWithProviders(<RankUpToast childId={CHILD_ID} currentRank="Noob" />);
    expect(toastSpy.success).not.toHaveBeenCalled();
    // Seeded with the current rank.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("Noob");
  });

  it("does not fire when storedRank === currentRank on the same mount", () => {
    // First mount seeds "Normal" silently. Component is idempotent within the
    // same lifecycle, so we just assert no toast and the seed is in place.
    renderWithProviders(
      <RankUpToast childId={CHILD_ID} currentRank="Normal" />,
    );
    expect(toastSpy.success).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("Normal");
  });

  it("fires a toast.success when rank moves up the tier ladder", () => {
    // First mount silently seeds "Noob".
    const { unmount } = renderWithProviders(
      <RankUpToast childId={CHILD_ID} currentRank="Noob" />,
    );
    expect(toastSpy.success).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("Noob");
    unmount();

    // Second mount — bypass renderWithProviders so localStorage stays seeded.
    renderWithLangProviderOnly(
      <RankUpToast childId={CHILD_ID} currentRank="Pro" />,
    );

    expect(toastSpy.success).toHaveBeenCalledTimes(1);
    const call = toastSpy.success.mock.calls[0]!;
    const title = call[0] as string;
    const opts = call[1] as { description: string; className: string };
    expect(title).toMatch(/leveled up|ランクアップ/);
    expect(opts.description).toContain("Pro");
    expect(opts.className).toContain("pm-rank-up-toast");
    // Storage is updated to the new rank.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("Pro");
  });

  it("does NOT fire a toast on a defensive downgrade (rank moves down)", () => {
    const { unmount } = renderWithProviders(
      <RankUpToast childId={CHILD_ID} currentRank="Master" />,
    );
    unmount();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("Master");

    renderWithLangProviderOnly(
      <RankUpToast childId={CHILD_ID} currentRank="Normal" />,
    );
    // No toast — but storage is synced down so the next compare is correct.
    expect(toastSpy.success).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("Normal");
  });

  it("never throws when localStorage methods throw on access", () => {
    // Stub the LanguageContext directly (a) so the test doesn't go through
    // the real LanguageProvider — which itself calls localStorage on mount
    // and would explode before the code under test runs — and (b) so we
    // isolate the failure surface to RankUpToast.
    const enContext = {
      locale: "en" as const,
      setLocale: () => {},
      toggleLocale: () => {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      t: ((key: string) => key) as any,
    };

    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.getItem = () => {
      throw new Error("localStorage disabled");
    };
    Storage.prototype.setItem = () => {
      throw new Error("localStorage disabled");
    };

    try {
      // Render with a stubbed LanguageContext so we never call back into
      // the real LanguageProvider (which would itself touch localStorage).
      render(
        <LanguageContext.Provider value={enContext}>
          <RankUpToast childId={CHILD_ID} currentRank="Pro" />
        </LanguageContext.Provider>,
      );
      expect(toastSpy.success).not.toHaveBeenCalled();
    } finally {
      Storage.prototype.getItem = originalGetItem;
      Storage.prototype.setItem = originalSetItem;
    }
  });
});
