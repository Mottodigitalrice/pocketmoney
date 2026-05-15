/**
 * S4 (R4) — WithdrawalDialogBody component tests.
 *
 * Covers F10 punchlist 5.16: the inline "Max ¥X" helper + one-tap "Use max"
 * pill under the amount input. Parents shouldn't have to retype the balance
 * to drain a jar, and they shouldn't have to scan to a separate card to see
 * what the cap actually is.
 *
 * We import the *Body* (not the trigger wrapper) so we can render the form
 * directly without dealing with dynamic() / lazy-loading boundaries.
 */
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, fireEvent } from "./test-utils";
import { WithdrawalDialogBody } from "@/components/features/parent-dashboard/WithdrawalDialogBody";

const CHILD_ID = "child-test";
const CHILD_NAME = "Alex";

describe("WithdrawalDialogBody — S4 (R4) inline max helper (F10 5.16)", () => {
  it("renders 'Max ¥X' inline helper for the selected jar", () => {
    renderWithProviders(
      <WithdrawalDialogBody
        childId={CHILD_ID}
        childName={CHILD_NAME}
        open={true}
        onOpenChange={() => {}}
      />,
      {
        contextValue: {
          getWalletBalance: (_id, jar) =>
            // Spend jar (default selection) has 750; others smaller.
            jar === "spend" ? 750 : jar === "save" ? 200 : 50,
        },
      },
    );
    const helper = screen.getByTestId("withdraw-max-helper");
    expect(helper).toBeInTheDocument();
    // Spend = 750 — confirms the helper reflects the LIVE jar balance.
    expect(helper).toHaveTextContent(/Max ¥750/);
  });

  it("clicking 'Use max' sets the amount input to the jar balance", () => {
    renderWithProviders(
      <WithdrawalDialogBody
        childId={CHILD_ID}
        childName={CHILD_NAME}
        open={true}
        onOpenChange={() => {}}
      />,
      {
        contextValue: {
          getWalletBalance: () => 500,
        },
      },
    );
    const useMaxBtn = screen.getByTestId("withdraw-use-max");
    const input = screen.getByTestId(
      "withdraw-amount-input",
    ) as HTMLInputElement;
    // Before click: input empty.
    expect(input.value).toBe("");
    fireEvent.click(useMaxBtn);
    // After click: input takes the live balance, no commas/formatting.
    expect(input.value).toBe("500");
  });

  it("hides the max helper + Use max button when the jar is empty (balance = 0)", () => {
    renderWithProviders(
      <WithdrawalDialogBody
        childId={CHILD_ID}
        childName={CHILD_NAME}
        open={true}
        onOpenChange={() => {}}
      />,
      {
        contextValue: {
          getWalletBalance: () => 0,
        },
      },
    );
    // Both pieces hidden — no point surfacing "Max ¥0".
    expect(screen.queryByTestId("withdraw-max-helper")).toBeNull();
    expect(screen.queryByTestId("withdraw-use-max")).toBeNull();
  });

  it("renders the JP version of the max helper + Use max pill", () => {
    renderWithProviders(
      <WithdrawalDialogBody
        childId={CHILD_ID}
        childName={CHILD_NAME}
        open={true}
        onOpenChange={() => {}}
      />,
      {
        initialLang: "ja",
        contextValue: {
          getWalletBalance: () => 1234,
        },
      },
    );
    const helper = screen.getByTestId("withdraw-max-helper");
    expect(helper).toHaveTextContent(/最大 ¥1,234/);
    const useMax = screen.getByTestId("withdraw-use-max");
    expect(useMax).toHaveTextContent("最大額");
  });
});
