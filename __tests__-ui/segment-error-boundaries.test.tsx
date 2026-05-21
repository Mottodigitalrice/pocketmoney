/**
 * Wave 2 — Segment-specific error boundary tests.
 *
 * Two segment boundaries (`/parent/error.tsx`, `/kid/[childId]/error.tsx`)
 * share the same shape as the global `error.tsx` (Gap 7.1 digest + reset).
 *
 * We assert per boundary:
 *   1. Title + subtitle render from the right i18n keys.
 *   2. Digest renders only when `error.digest` is present (Gap 7.1).
 *   3. "Try Again" button calls the `reset` prop.
 *   4. The back-CTA links to the segment-appropriate safe-escape URL.
 *
 * Routing is asserted at the DOM level (a real `<Link href>` renders a
 * real `<a href>`) — no `next/navigation` mock needed because both
 * boundaries use `<Link>` rather than imperative `useRouter().push()`.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "./test-utils";
import userEvent from "@testing-library/user-event";
import ParentError from "@/app/parent/error";
import KidError from "@/app/kid/[childId]/error";

function makeError(digest?: string): Error & { digest?: string } {
  const err = new Error("Segment boundary test error") as Error & {
    digest?: string;
  };
  if (digest) err.digest = digest;
  return err;
}

describe("parent/error.tsx — segment boundary", () => {
  it("renders the parent-specific title and subtitle", () => {
    renderWithProviders(
      <ParentError error={makeError()} reset={() => {}} />,
    );
    expect(screen.getByText("Captain's orders stalled!")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Your approval didn't sail through\. Try again or check your connection\./i,
      ),
    ).toBeInTheDocument();
  });

  it("renders both CTAs — retry button + back-to-approvals link", () => {
    renderWithProviders(
      <ParentError error={makeError()} reset={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to approvals/i }),
    ).toBeInTheDocument();
  });

  it("renders the Error ID line when error.digest is present", () => {
    renderWithProviders(
      <ParentError error={makeError("parent-abc123")} reset={() => {}} />,
    );
    const wrap = screen.getByTestId("error-digest");
    expect(screen.getByText(/Error ID:/i)).toBeInTheDocument();
    expect(wrap).toHaveTextContent("parent-abc123");
    expect(wrap.querySelector("code")).not.toBeNull();
  });

  it("hides the Error ID line when error.digest is absent", () => {
    renderWithProviders(
      <ParentError error={makeError()} reset={() => {}} />,
    );
    expect(screen.queryByTestId("error-digest")).toBeNull();
  });

  it("calls the reset prop when Try Again is clicked", async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ParentError error={makeError()} reset={reset} />);
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("Back to Approvals link points to /parent (safe escape)", () => {
    renderWithProviders(
      <ParentError error={makeError()} reset={() => {}} />,
    );
    const link = screen.getByRole("link", { name: /back to approvals/i });
    expect(link.getAttribute("href")).toBe("/parent");
  });
});

describe("kid/[childId]/error.tsx — segment boundary", () => {
  it("renders the kid-specific title and subtitle", () => {
    renderWithProviders(<KidError error={makeError()} reset={() => {}} />);
    expect(screen.getByText("Whoa there, sailor!")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Something went wrong\. Let's try again or go pick a different friend\./i,
      ),
    ).toBeInTheDocument();
  });

  it("renders both CTAs — retry button + pick-a-friend link", () => {
    renderWithProviders(<KidError error={makeError()} reset={() => {}} />);
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /pick a friend/i }),
    ).toBeInTheDocument();
  });

  it("renders the Error ID line when error.digest is present", () => {
    renderWithProviders(
      <KidError error={makeError("kid-xyz789")} reset={() => {}} />,
    );
    const wrap = screen.getByTestId("error-digest");
    expect(screen.getByText(/Error ID:/i)).toBeInTheDocument();
    expect(wrap).toHaveTextContent("kid-xyz789");
    expect(wrap.querySelector("code")).not.toBeNull();
  });

  it("hides the Error ID line when error.digest is absent", () => {
    renderWithProviders(<KidError error={makeError()} reset={() => {}} />);
    expect(screen.queryByTestId("error-digest")).toBeNull();
  });

  it("calls the reset prop when Try Again is clicked", async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<KidError error={makeError()} reset={reset} />);
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("Pick a Friend link points to / (character-select home)", () => {
    renderWithProviders(<KidError error={makeError()} reset={() => {}} />);
    const link = screen.getByRole("link", { name: /pick a friend/i });
    expect(link.getAttribute("href")).toBe("/");
  });
});
