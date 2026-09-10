import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Form, FormSwitch, type FormSwitchProps } from "@/organisms/Form";
import { Button } from "@/atoms/Button";

type Values = { marketing: boolean };

const LABEL = "Marketing emails";

/** The bound switch inside a real `<Form>`, around a real `SwitchField`. */
async function mountField({
  defaultValue = false,
  onSubmit = vi.fn(),
  ...props
}: Partial<FormSwitchProps<Values, "marketing">> & {
  defaultValue?: boolean;
  onSubmit?: (values: Values) => void;
} = {}) {
  function Fields() {
    const form = useForm<Values>({ defaultValues: { marketing: defaultValue } });

    return (
      <Form {...form}>
        <form
          // `void`, because `handleSubmit` returns a promise and a DOM handler must not.
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        >
          {/* No `data-testid`: a field required to have a `name` is already
              addressable by it. */}
          <FormSwitch control={form.control} name="marketing" label={LABEL} {...props} />
          <Button type="submit">Save</Button>
        </form>
      </Form>
    );
  }

  const view = await render(<Fields />);
  // Scoped to this render, since `getByTestId` otherwise searches the whole page.
  const within = page.elementLocator(view.container);
  const one = (testId: string) => within.getByTestId(testId).element() as HTMLElement;

  const track = () => within.getByRole("switch", { name: LABEL });
  const label = () => within.getByText(LABEL);
  const submit = () => userEvent.click(within.getByRole("button", { name: "Save" }));

  return { view, within, label, one, submit, track };
}

describe("binding a switch to the form", () => {
  it("submits a boolean under the field's name", async () => {
    const onSubmit = vi.fn();
    const field = await mountField({ onSubmit });

    await userEvent.click(field.track());
    await field.submit();

    // Radix reports a plain boolean here — there is no indeterminate state to coerce,
    // unlike a checkbox — so the value arrives as it is given.
    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ marketing: true }, expect.anything()),
    );
  });

  it("toggles from the label as well as from the track", async () => {
    const field = await mountField();

    await userEvent.click(field.label());

    await expect.element(field.track()).toBeChecked();
  });

  it("is addressable by the name the form already keys it on", async () => {
    const field = await mountField({ description: "Occasional offers and product news." });

    expect(field.one("marketing-label")).toHaveTextContent(LABEL);
    expect(field.one("marketing-switch")).toBe(field.track().element());
    expect(field.one("marketing-description")).toHaveTextContent(
      "Occasional offers and product news.",
    );
  });
});

describe("when the switch fails a rule", () => {
  const rules = { required: "Turn this on to continue." };

  it("shows the message and marks the switch invalid", async () => {
    const field = await mountField({ rules });

    await field.submit();

    await expect
      .element(field.within.getByTestId("marketing-description"))
      .toHaveTextContent("Turn this on to continue.");
    expect(field.track().element()).toHaveAttribute("aria-invalid", "true");
    await expect.element(field.track()).toHaveAccessibleDescription("Turn this on to continue.");
  });
});
