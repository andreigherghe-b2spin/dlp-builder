import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Form, FormCheckbox, type FormCheckboxProps } from "@/organisms/Form";
import { Button } from "@/atoms/Button";

type Values = { terms: boolean };

const LABEL = "Accept terms and conditions";

/** The bound box inside a real `<Form>`, around a real `CheckboxField`. */
async function mountField({
  defaultValue = false,
  onSubmit = vi.fn(),
  ...props
}: Partial<FormCheckboxProps<Values, "terms">> & {
  defaultValue?: boolean;
  onSubmit?: (values: Values) => void;
} = {}) {
  function Fields() {
    const form = useForm<Values>({ defaultValues: { terms: defaultValue } });

    return (
      <Form {...form}>
        <form
          // `void`, because `handleSubmit` returns a promise and a DOM handler must not.
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        >
          {/* No `data-testid`: a field required to have a `name` is already
              addressable by it. */}
          <FormCheckbox control={form.control} name="terms" label={LABEL} {...props} />
          <Button type="submit">Continue</Button>
        </form>
      </Form>
    );
  }

  const view = await render(<Fields />);
  // Scoped to this render, since `getByTestId` otherwise searches the whole page.
  const within = page.elementLocator(view.container);
  const one = (testId: string) => within.getByTestId(testId).element() as HTMLElement;

  const box = () => within.getByRole("checkbox", { name: LABEL });
  const label = () => within.getByText(LABEL);
  const submit = () => userEvent.click(within.getByRole("button", { name: "Continue" }));

  return { view, within, box, label, one, submit };
}

describe("binding a checkbox to the form", () => {
  it("submits a boolean under the field's name", async () => {
    const onSubmit = vi.fn();
    const field = await mountField({ onSubmit });

    await userEvent.click(field.box());
    await field.submit();

    // `true`, not `"on"` and not `"indeterminate"`: a checkbox is a boolean, which is
    // the whole reason this binds `checked` rather than `value`.
    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ terms: true }, expect.anything()),
    );
  });

  it("opens checked when the form already holds true", async () => {
    const field = await mountField({ defaultValue: true });

    await expect.element(field.box()).toBeChecked();
  });

  it("toggles from the label, not only from the box", async () => {
    // The label reaches the box by `htmlFor`, which is also why `getByRole` finds it
    // by its name at all.
    const field = await mountField();

    await userEvent.click(field.label());

    await expect.element(field.box()).toBeChecked();
  });

  it("is addressable by the name the form already keys it on", async () => {
    const field = await mountField({ description: "You can withdraw consent at any time." });

    expect(field.one("terms-label")).toHaveTextContent(LABEL);
    expect(field.one("terms-checkbox")).toBe(field.box().element());
    expect(field.one("terms-description")).toHaveTextContent(
      "You can withdraw consent at any time.",
    );
  });
});

describe("when a required box is left unchecked", () => {
  const rules = { required: "Please accept to continue." };

  it("shows the rule's message and marks the box invalid", async () => {
    const field = await mountField({ rules });

    await field.submit();

    await expect
      .element(field.within.getByTestId("terms-description"))
      .toHaveTextContent("Please accept to continue.");
    expect(field.box().element()).toHaveAttribute("aria-invalid", "true");
    // Linked rather than shouted: the same line carries the static hint most of the
    // time, so it is `role="status"` and reaches the user through the box's
    // description.
    await expect.element(field.box()).toHaveAccessibleDescription("Please accept to continue.");
  });

  it("lets the caller's own error win over the form's", async () => {
    const field = await mountField({ rules, error: "These terms have changed since you agreed." });

    await field.submit();

    await expect
      .element(field.within.getByTestId("terms-description"))
      .toHaveTextContent("These terms have changed since you agreed.");
  });
});
