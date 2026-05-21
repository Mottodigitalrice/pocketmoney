/**
 * Wave 8b — Onboarding segment error boundary tests.
 *
 * Mirrors `segment-error-boundaries.test.tsx` shape (parent + kid).
 * Onboarding has Convex mutations (`createChild`, `createJob`,
 * `seedDefaults`, `completeOnboarding`) that can fail mid-funnel; this
 * boundary catches them with a retry + escape-to-home CTA.
 *
 * Routing is asserted at the DOM level (a real `<Link href>` renders a
 * real `<a href>`) — no `next/navigation` mock needed.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "./test-utils";
import userEvent from "@testing-library/user-event";
import OnboardingError from "@/app/onboarding/error";

function makeError(digest?: string): Error & { digest?: string } {
  const err = new Error("Onboarding boundary test error") as Error & {
    digest?: string;
  };
  if (digest) err.digest = digest;
  return err;
}

describe("onboarding/error.tsx — segment boundary", () => {
  it("renders the onboarding-specific title and subtitle", () => {
    renderWithProviders(
      <OnboardingError error={makeError()} reset={() => {}} />,
    );
    expect(screen.getByText("The map slipped overboard!")).toBeInTheDocument();
    expect(
      screen.getByText(
        /We hit a snag setting up your crew\. Try again, or head home and we'll keep your spot\./i,
      ),
    ).toBeInTheDocument();
  });

  it("renders both CTAs — retry button + go-home link", () => {
    renderWithProviders(
      <OnboardingError error={makeError()} reset={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go home/i })).toBeInTheDocument();
  });

  it("renders the Error ID line when error.digest is present", () => {
    renderWithProviders(
      <OnboardingError error={makeError("onboarding-def456")} reset={() => {}} />,
    );
    const wrap = screen.getByTestId("error-digest");
    expect(screen.getByText(/Error ID:/i)).toBeInTheDocument();
    expect(wrap).toHaveTextContent("onboarding-def456");
    expect(wrap.querySelector("code")).not.toBeNull();
  });

  it("hides the Error ID line when error.digest is absent", () => {
    renderWithProviders(
      <OnboardingError error={makeError()} reset={() => {}} />,
    );
    expect(screen.queryByTestId("error-digest")).toBeNull();
  });

  it("calls the reset prop when Try Again is clicked", async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <OnboardingError error={makeError()} reset={reset} />,
    );
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("Go Home link points to / (safe escape from the funnel)", () => {
    renderWithProviders(
      <OnboardingError error={makeError()} reset={() => {}} />,
    );
    const link = screen.getByRole("link", { name: /go home/i });
    expect(link.getAttribute("href")).toBe("/");
  });
});
