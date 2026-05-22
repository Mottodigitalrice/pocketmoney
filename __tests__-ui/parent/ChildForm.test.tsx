/**
 * Wave 5 — ChildForm component tests.
 *
 * Covers F19/F20 — the icon radiogroup grid + name input + add/edit mode
 * branches:
 *   - Icon radiogroup: clicking a tile flips `aria-checked` on the new tile
 *     and clears it on the previously selected one (mutual exclusion).
 *   - Empty name submission is rejected (onSave NOT called).
 *   - Whitespace-only name submission is rejected.
 *   - Add mode: submitting with valid name → onSave(name, selectedIcon).
 *   - Edit mode: pre-populates name + icon, submit fires onSave with edited values.
 *   - Cancel button fires onClose (and NOT onSave).
 *
 * YELLOW: there is no `age` field and no maxLength on the name input — the
 * task description mentioned both as candidates "if a maxLength exists", but
 * the component has neither. We test what's actually wired up.
 */
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "../test-utils";
import { ChildForm } from "@/components/features/parent-dashboard/ChildForm";

describe("ChildForm — add mode", () => {
  it("renders the 'Add Crew Member' title and the icon radiogroup", () => {
    renderWithProviders(<ChildForm open onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText("Add Crew Member")).toBeInTheDocument();
    // 8 sea-creature icons (shark, dolphin, turtle, octopus, starfish, whale,
    // crab, fish) — each is a role="radio" tile.
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(8);
    // Default selection is "shark" — that tile has aria-checked="true",
    // every other tile is aria-checked="false".
    const shark = screen.getByRole("radio", { name: /Shark/i });
    expect(shark).toHaveAttribute("aria-checked", "true");
  });

  it("selecting a different icon flips aria-checked (mutual exclusion)", () => {
    renderWithProviders(<ChildForm open onClose={vi.fn()} onSave={vi.fn()} />);
    const shark = screen.getByRole("radio", { name: /Shark/i });
    const dolphin = screen.getByRole("radio", { name: /Dolphin/i });

    expect(shark).toHaveAttribute("aria-checked", "true");
    expect(dolphin).toHaveAttribute("aria-checked", "false");

    fireEvent.click(dolphin);

    expect(dolphin).toHaveAttribute("aria-checked", "true");
    // Old selection is now unchecked.
    expect(shark).toHaveAttribute("aria-checked", "false");
  });

  it("does NOT call onSave when the name is empty", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(<ChildForm open onClose={onClose} onSave={onSave} />);

    // Form has no `disabled` gate on submit — the handler short-circuits on
    // empty input. fire submit directly so we exercise that branch.
    const nameInput = screen.getByPlaceholderText(/Enter their name/i);
    const form = nameInput.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does NOT call onSave when the name is whitespace-only", () => {
    const onSave = vi.fn();
    renderWithProviders(<ChildForm open onClose={vi.fn()} onSave={onSave} />);

    const nameInput = screen.getByPlaceholderText(/Enter their name/i);
    fireEvent.change(nameInput, { target: { value: "   " } });
    fireEvent.submit(nameInput.closest("form")!);

    expect(onSave).not.toHaveBeenCalled();
  });

  it("submits onSave(trimmedName, selectedIcon) and then onClose", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(<ChildForm open onClose={onClose} onSave={onSave} />);

    const nameInput = screen.getByPlaceholderText(/Enter their name/i);
    fireEvent.change(nameInput, { target: { value: "  Alex  " } });

    // Pick the dolphin icon so we know selectedIcon isn't just the default.
    fireEvent.click(screen.getByRole("radio", { name: /Dolphin/i }));

    fireEvent.submit(nameInput.closest("form")!);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("Alex", "dolphin");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cancel button fires onClose only (no onSave)", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(<ChildForm open onClose={onClose} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("ChildForm — edit mode", () => {
  it("renders the 'Edit Crew Member' title when editingChild is supplied", () => {
    renderWithProviders(
      <ChildForm
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        editingChild={{ name: "Bob", icon: "turtle" }}
      />,
    );
    expect(screen.getByText("Edit Crew Member")).toBeInTheDocument();
  });

  it("pre-populates the name field and the selected icon from editingChild", () => {
    renderWithProviders(
      <ChildForm
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        editingChild={{ name: "Bob", icon: "turtle" }}
      />,
    );
    const nameInput = screen.getByPlaceholderText(
      /Enter their name/i,
    ) as HTMLInputElement;
    expect(nameInput.value).toBe("Bob");

    // The turtle tile is now the selected icon; shark is no longer the default.
    const turtle = screen.getByRole("radio", { name: /Sea Turtle/i });
    expect(turtle).toHaveAttribute("aria-checked", "true");
    const shark = screen.getByRole("radio", { name: /Shark/i });
    expect(shark).toHaveAttribute("aria-checked", "false");
  });

  it("submitting an edit fires onSave with the new values", () => {
    const onSave = vi.fn();
    renderWithProviders(
      <ChildForm
        open
        onClose={vi.fn()}
        onSave={onSave}
        editingChild={{ name: "Bob", icon: "turtle" }}
      />,
    );
    const nameInput = screen.getByPlaceholderText(
      /Enter their name/i,
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Bobby" } });
    fireEvent.click(screen.getByRole("radio", { name: /Octopus/i }));
    fireEvent.submit(nameInput.closest("form")!);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("Bobby", "octopus");
  });
});
