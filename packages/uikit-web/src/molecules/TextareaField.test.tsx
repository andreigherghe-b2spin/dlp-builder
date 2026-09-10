import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { TextareaField, type TextareaFieldProps } from "@/molecules/TextareaField";

/**
 * A real `Textarea`, a real `Label` and real `Typography` underneath — nothing
 * here is stubbed. What this molecule contributes over the bare box is entirely
 * composition: the label pointing at the box, the helper line reaching it
 * through `aria-describedby`, the disabled state travelling to a label that is
 * not its DOM sibling. Replace any of those with a mock and the test keeps
 * passing after the wiring breaks.
 *
 * Only the seams are covered. Prop pass-through, the absent label row and the
 * `invalid`-without-a-message branch are the box's or React's behaviour, and a
 * test over each would restate the component rather than hold it to anything.
 */
async function mountField(props: Partial<TextareaFieldProps> = {}) {
  // No `data-testid`: a field required to have a `name` is already addressable
  // by it, and a second id would only hide the one the app will really have.
  const view = await render(<TextareaField name="message" label="Your message" {...props} />);
  // Scoped to this render, since `getByTestId` otherwise searches the whole page.
  const within = page.elementLocator(view.container);

  const box = () => within.getByLabelText("Your message");
  const textarea = () => box().element() as HTMLTextAreaElement;
  const part = (testId: string) => within.getByTestId(testId);

  return { view, within, box, textarea, part };
}

describe("wiring the parts together", () => {
  it("points the label at the box, so clicking it moves focus there", async () => {
    const field = await mountField();

    await userEvent.click(field.part("message-label"));

    await expect.element(field.box()).toHaveFocus();
  });

  it("announces the helper line as the box's description", async () => {
    const field = await mountField({ description: "This is an input description." });

    // Not merely rendered nearby: the box has to reach it, or a screen reader
    // never reads the hint out. And a hint that was there when the form opened
    // is not news, so it stays out of the live region.
    await expect.element(field.box()).toHaveAccessibleDescription("This is an input description.");
    expect(field.within.getByRole("alert").query()).toBeNull();
  });

  it("names every part from the name the form already keys the field on", async () => {
    const field = await mountField({
      description: "This is an input description.",
      action: <a href="#reset">Link</a>,
    });

    expect(field.part("message").element()).toContainElement(field.textarea());
    expect(field.part("message-label").element()).toHaveTextContent("Your message");
    expect(field.part("message-textarea").element()).toBe(field.textarea());
    expect(field.part("message-description").element()).toHaveTextContent(
      "This is an input description.",
    );

    // `Slot` dresses the action rather than wrapping it, so what carries the id
    // is the caller's own `<a>`, destination intact.
    const action = field.part("message-action").element();
    expect(action.tagName).toBe("A");
    expect(action).toHaveAttribute("href", "#reset");
  });

  it("merges an incoming description id rather than replacing it", async () => {
    // This is what survives `FormControl`, which clones `aria-describedby` onto
    // its child: dropping the incoming id would silence the form's own message.
    const field = await mountField({
      description: "This is an input description.",
      "aria-describedby": "outside-hint",
    });

    const describedBy = field.textarea().getAttribute("aria-describedby") ?? "";
    expect(describedBy.split(" ")).toContain("outside-hint");
    expect(describedBy.split(" ")).toHaveLength(2);
  });
});

describe("the states that change more than a colour", () => {
  it("replaces the helper line with the error, announced, and marks the box invalid", async () => {
    const field = await mountField({
      description: "This is an input description.",
      error: "Keep it under 200 characters.",
    });

    // Figma has no separate error node: the same line recolours, so the hint is
    // gone rather than pushed down. An error arriving mid-form is news, which is
    // what the live region is for.
    await expect
      .element(field.within.getByRole("alert"))
      .toHaveTextContent("Keep it under 200 characters.");
    expect(field.part("message").element()).not.toHaveTextContent("This is an input description.");
    expect(field.textarea()).toHaveAttribute("aria-invalid", "true");
    await expect.element(field.box()).toHaveAccessibleDescription("Keep it under 200 characters.");
  });

  it("carries disabled to the label, which is not the box's DOM sibling", async () => {
    const field = await mountField({ action: <a href="#help">Link</a>, disabled: true });

    await expect.element(field.box()).toBeDisabled();
    // `Label` learns this from the `group` ancestor's `data-disabled`; its
    // `peer-*` rules could never match across the column. Same for the link,
    // which also leaves the tab order.
    expect(field.part("message").element()).toHaveAttribute("data-disabled", "true");
    expect(field.part("message-action").element()).toHaveAttribute("tabindex", "-1");
  });
});
