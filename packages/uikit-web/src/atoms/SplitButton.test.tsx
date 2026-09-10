import type * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { SplitButton } from "@/atoms/SplitButton";

/**
 * An atom is normally left to its stories and its visual baseline, but this one
 * is two independent controls behind one shell: which half a click reaches,
 * which half a `disabled` reaches, and which id each half derives are mechanisms
 * rather than a class list.
 *
 * One mount per test — a second `render` in the same `it` leaves two controls in
 * the document and every locator after it matches twice.
 */
async function mount(props: Partial<React.ComponentProps<typeof SplitButton>> = {}) {
  const view = await render(
    <SplitButton actionLabel="Remove game" data-testid="game" {...props}>
      {props.children ?? "Starburst"}
    </SplitButton>,
  );
  const within = page.elementLocator(view.container);

  return {
    within,
    label: within.getByTestId("game-label"),
    action: within.getByTestId("game-action"),
  };
}

describe("two actions behind one shell", () => {
  it("sends a click to the half it landed on and to neither of the other's handlers", async () => {
    const onLabel = vi.fn();
    const onAction = vi.fn();
    const { label, action } = await mount({
      slotProps: { label: { onClick: onLabel }, action: { onClick: onAction } },
    });

    await userEvent.click(label);
    await userEvent.click(action);

    expect(onLabel).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("names the icon half from `actionLabel`, since its glyph cannot", async () => {
    const { action } = await mount();

    await expect.element(action).toHaveAccessibleName("Remove game");
  });
});

describe("disabling one half or both", () => {
  it("inerts both halves from the root", async () => {
    const { label, action } = await mount({ disabled: true });

    await expect.element(label).toBeDisabled();
    await expect.element(action).toBeDisabled();
  });

  // The slot's own flag is merged with the root's rather than spread over it: a
  // `disabled: undefined` from a caller who never mentioned it would otherwise
  // land last and undo the root's.
  it("leaves the other half alive when only one slot is disabled", async () => {
    const { label, action } = await mount({ slotProps: { action: { disabled: true } } });

    await expect.element(label).toBeEnabled();
    await expect.element(action).toBeDisabled();
  });
});

describe("the label as something other than a button", () => {
  it("renders the caller's element through the label slot and keeps its id", async () => {
    const { label } = await mount({
      slotProps: { label: { asChild: true } },
      children: <a href="/games/starburst">Starburst</a>,
    });

    expect(label.element().tagName).toBe("A");
    await expect.element(label).toHaveAttribute("href", "/games/starburst");
  });

  // `disabled` does nothing to an `<a>`, so the state is mirrored onto attributes
  // the element does honour — `button-base` reads `[data-disabled]` beside `:disabled`.
  it("marks a disabled link half for the styles and the screen reader both", async () => {
    const { label } = await mount({
      disabled: true,
      slotProps: { label: { asChild: true } },
      children: <a href="/games/starburst">Starburst</a>,
    });

    await expect.element(label).toHaveAttribute("data-disabled", "true");
    await expect.element(label).toHaveAttribute("aria-disabled", "true");
  });
});

describe("naming the parts", () => {
  it("puts no test ids in the DOM when the control was not named", async () => {
    const view = await render(<SplitButton actionLabel="Remove game">Starburst</SplitButton>);
    const within = page.elementLocator(view.container);

    expect(within.getByTestId(/.*/).elements()).toHaveLength(0);
  });
});
