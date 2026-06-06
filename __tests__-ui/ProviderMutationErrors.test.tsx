import { describe, it, expect, vi, beforeEach } from "vitest";
import { useContext } from "react";

// `hasDataProviders` is evaluated at module-import time in PocketMoneyProvider
// from these env vars; without them the provider renders a no-op fallback
// context (so the real handlers never run). Set them BEFORE the import via
// `vi.hoisted` so the real inner provider mounts.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_qa";
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://qa-test.convex.cloud";
});
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import {
  PocketMoneyProvider,
  PocketMoneyContext,
} from "@/components/providers/PocketMoneyProvider";

/**
 * QA-2026-06-06 (F8): fire-and-forget parent-dashboard mutations used to
 * swallow rejections silently. These tests mount the REAL provider with a
 * rejecting `useMutation` and assert a failure toast is surfaced.
 */

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

type PocketMoneyApi = NonNullable<React.ContextType<typeof PocketMoneyContext>>;

function Harness({ action }: { action: (api: PocketMoneyApi) => void }) {
  const api = useContext(PocketMoneyContext);
  if (!api) return null;
  return (
    <button type="button" onClick={() => action(api)}>
      go
    </button>
  );
}

function renderWithProvider(action: (api: PocketMoneyApi) => void) {
  return render(
    <LanguageProvider>
      <PocketMoneyProvider>
        <Harness action={action} />
      </PocketMoneyProvider>
    </LanguageProvider>,
  );
}

describe("F8 — provider surfaces failures of fire-and-forget mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Every mutation the provider creates now rejects.
    vi.mocked(useMutation).mockReturnValue(
      vi.fn().mockRejectedValue(new Error("OVERDRAFT: boom")) as never,
    );
  });

  it("deleteJob failure shows an error toast (was silent)", async () => {
    renderWithProvider((api) => api.deleteJob("job_1"));
    await userEvent.click(screen.getByRole("button", { name: "go" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledWith(expect.any(String));
  });

  it("rejectJob failure shows an error toast (was silent)", async () => {
    renderWithProvider((api) => api.rejectJob("inst_1", "note"));
    await userEvent.click(screen.getByRole("button", { name: "go" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
  });
});
