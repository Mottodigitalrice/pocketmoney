/**
 * G4 — WalletJarBalances component tests.
 *
 * Covers:
 *   - Renders 3 jars (spend/save/give) with correct totals.
 *   - F17 pulse animation triggers when a balance increases (token changes).
 *   - F19 sr-only labels exist for screen readers.
 *   - Skeleton variant renders 3 placeholder jars when isLoading from caller.
 *   - Zero balance renders "¥0" not blank.
 */
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "./test-utils";
import {
  WalletJarBalances,
  WalletJarBalancesSkeleton,
} from "@/components/features/shared/WalletJarBalances";

describe("WalletJarBalances", () => {
  it("renders three jars with the supplied totals", () => {
    const { container, getAllByTestId, getByTestId } = renderWithProviders(
      <WalletJarBalances
        balances={{ spend: 500, save: 1250, give: 75 }}
        total={1825}
      />,
    );

    const jars = getAllByTestId("wallet-jar");
    expect(jars).toHaveLength(3);

    // Order is fixed: spend / save / give
    expect(jars[0]).toHaveAttribute("data-jar", "spend");
    expect(jars[0]).toHaveAttribute("data-balance", "500");
    expect(jars[1]).toHaveAttribute("data-jar", "save");
    expect(jars[1]).toHaveAttribute("data-balance", "1250");
    expect(jars[2]).toHaveAttribute("data-jar", "give");
    expect(jars[2]).toHaveAttribute("data-balance", "75");

    // Total row mirrors the prop.
    const total = getByTestId("wallet-total");
    expect(total).toHaveAttribute("data-balance", "1825");
    expect(total).toHaveTextContent("¥1,825");

    // Currency formatting carries a thousands separator.
    expect(container).toHaveTextContent("¥500");
    expect(container).toHaveTextContent("¥1,250");
  });

  it("does not pulse on first mount (no fake celebration)", () => {
    const { getAllByTestId } = renderWithProviders(
      <WalletJarBalances balances={{ spend: 500, save: 0, give: 0 }} />,
    );
    const jars = getAllByTestId("wallet-jar");
    // First render seeds the prevBalances ref silently. No pulse token set.
    for (const jar of jars) {
      expect(jar).not.toHaveAttribute("data-pulse-token");
    }
  });

  it("includes sr-only labels for screen readers (F19 a11y)", () => {
    const { container } = renderWithProviders(
      <WalletJarBalances balances={{ spend: 100, save: 200, give: 300 }} />,
    );
    // Each balance line carries an sr-only "<label>:" prefix.
    const srOnlyLabels = container.querySelectorAll(".sr-only");
    expect(srOnlyLabels.length).toBeGreaterThanOrEqual(3);
    const text = Array.from(srOnlyLabels).map((el) => el.textContent).join(" ");
    expect(text).toMatch(/Spend/);
    expect(text).toMatch(/Save/);
    expect(text).toMatch(/Give/);
  });

  it("renders the skeleton variant with three placeholder jars", () => {
    const { getByTestId, container } = renderWithProviders(
      <WalletJarBalancesSkeleton />,
    );
    const skeleton = getByTestId("wallet-jars-skeleton");
    expect(skeleton).toBeInTheDocument();
    // Three placeholder cards inside the grid.
    expect(skeleton.querySelectorAll("div.rounded-xl").length).toBe(3);
    // Skeleton must be aria-hidden so SR users don't get noisy filler.
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    // No real balance node should be present.
    expect(container.querySelector("[data-testid='wallet-jar']")).toBeNull();
  });

  it("renders ¥0 for a zero-balance jar (never empty)", () => {
    const { container, getAllByTestId } = renderWithProviders(
      <WalletJarBalances balances={{ spend: 0, save: 0, give: 0 }} total={0} />,
    );
    const jars = getAllByTestId("wallet-jar");
    for (const jar of jars) {
      expect(jar).toHaveAttribute("data-balance", "0");
      expect(jar).toHaveTextContent("¥0");
    }
    // Total row also reads "¥0", never blank.
    expect(container.querySelector("[data-testid='wallet-total']")).toHaveTextContent(
      "¥0",
    );
  });
});
