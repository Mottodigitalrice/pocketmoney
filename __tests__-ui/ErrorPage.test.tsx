/**
 * H4 — error.tsx digest visibility test (Gap 7.1).
 *
 * The Next.js error boundary captures `error.digest` — a server-emitted
 * stable identifier — but the previous version logged it to console only,
 * making it impossible for a parent to quote the digest when reporting.
 *
 * We assert two branches:
 *   1. With a digest → the small "Error ID: <digest>" line renders.
 *   2. Without a digest → the line is absent (no clutter for local/dev errors).
 */
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "./test-utils";
import ErrorPage from "@/app/error";

function makeError(digest?: string): Error & { digest?: string } {
  const err = new Error("Something broke");
  if (digest) (err as Error & { digest?: string }).digest = digest;
  return err as Error & { digest?: string };
}

describe("error.tsx — digest surface (Gap 7.1)", () => {
  it("renders the Error ID label + digest when error.digest is present", () => {
    renderWithProviders(
      <ErrorPage error={makeError("abc123def")} reset={() => {}} />,
    );

    // The H4 label is visible.
    expect(screen.getByText(/Error ID:/i)).toBeInTheDocument();
    // The digest is present inside the test-id wrapper.
    const wrap = screen.getByTestId("error-digest");
    expect(wrap).toHaveTextContent("abc123def");
    // The digest is wrapped in a <code> so it's monospace + selectable.
    expect(wrap.querySelector("code")).not.toBeNull();
  });

  it("does not render the digest line when error.digest is absent", () => {
    renderWithProviders(<ErrorPage error={makeError()} reset={() => {}} />);
    expect(screen.queryByTestId("error-digest")).toBeNull();
  });
});
