/**
 * H4 — BonusDialog + WithdrawalDialog trigger aria-label tests (Gaps 5.14, 5.15).
 *
 * The F9 a11y pass flagged that both dialog trigger buttons had a weak
 * accessible name — "Bonus" / "Withdraw" detached from any child context.
 * Screen readers benefit from an aria-label that names the target child.
 *
 * We only test the trigger (the lazy-loaded dialog body never mounts because
 * we never click). That's intentional — keeping the body lazy keeps this test
 * fast and avoids dragging react-hook-form / Convex mocks into a tiny assertion.
 */
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "./test-utils";
import { BonusDialog } from "@/components/features/parent-dashboard/BonusDialog";
import { WithdrawalDialog } from "@/components/features/parent-dashboard/WithdrawalDialog";

describe("BonusDialog trigger aria-label (Gap 5.14)", () => {
  it("includes the child's name in the accessible name", () => {
    renderWithProviders(<BonusDialog childId="child-a" childName="Alex" />);
    // The visible text is just "Bonus"; the aria-label carries the context.
    const btn = screen.getByRole("button", { name: /Award bonus to Alex/i });
    expect(btn).toBeInTheDocument();
  });

  it("interpolates the child name into the JP variant", () => {
    renderWithProviders(<BonusDialog childId="child-b" childName="ベア" />, {
      initialLang: "ja",
    });
    // JP copy: "{name}にボーナスを渡す"
    const btn = screen.getByRole("button", {
      name: /ベアにボーナスを渡す/,
    });
    expect(btn).toBeInTheDocument();
  });
});

describe("WithdrawalDialog trigger aria-label (Gap 5.15)", () => {
  it("includes the child's name in the accessible name", () => {
    renderWithProviders(
      <WithdrawalDialog childId="child-a" childName="Alex" />,
    );
    const btn = screen.getByRole("button", {
      name: /Withdraw from Alex's wallet/i,
    });
    expect(btn).toBeInTheDocument();
  });

  it("interpolates the child name into the JP variant", () => {
    renderWithProviders(
      <WithdrawalDialog childId="child-b" childName="ベア" />,
      { initialLang: "ja" },
    );
    const btn = screen.getByRole("button", {
      name: /ベアのおさいふから引き出す/,
    });
    expect(btn).toBeInTheDocument();
  });
});
