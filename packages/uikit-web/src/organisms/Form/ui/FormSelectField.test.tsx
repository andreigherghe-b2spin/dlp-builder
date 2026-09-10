import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Form, FormSelectField, type FormSelectFieldProps } from "@/organisms/Form";
import { Button } from "@/atoms/Button";

type Values = { country: string };

const OPTIONS = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "de", label: "Germany", disabled: true },
];

/**
 * The bound select inside a real `<Form>`, around a real `SelectField`.
 *
 * The menu is portalled to the document root, so the locators for it are
 * page-level; the setup unmounts after every test, so only one menu can exist.
 */
async function mountField({
  defaultValue = "",
  onSubmit = vi.fn(),
  ...props
}: Partial<FormSelectFieldProps<Values, "country">> & {
  defaultValue?: string;
  onSubmit?: (values: Values) => void;
} = {}) {
  function Fields() {
    const form = useForm<Values>({ defaultValues: { country: defaultValue } });

    return (
      <Form {...form}>
        <form
          // `void`, because `handleSubmit` returns a promise and a DOM handler must not.
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        >
          {/* No `data-testid` by default: a field required to have a `name` is
              already addressable by it. */}
          <FormSelectField
            control={form.control}
            name="country"
            label="Country"
            placeholder="Select a country"
            options={OPTIONS}
            {...props}
          />
          <Button type="submit">Continue</Button>
        </form>
      </Form>
    );
  }

  const view = await render(<Fields />);
  // Scoped to this render for the field itself; the menu is looked up on the page.
  const within = page.elementLocator(view.container);
  const one = (testId: string) => within.getByTestId(testId).element() as HTMLElement;

  const trigger = () => within.getByRole("combobox", { name: "Country" });
  const option = (label: string) => page.getByRole("option", { name: label });
  const submit = () => userEvent.click(within.getByRole("button", { name: "Continue" }));

  const open = async () => {
    await userEvent.click(trigger());
    await expect.element(page.getByRole("listbox")).toBeVisible();
  };

  const choose = async (label: string) => {
    await open();
    await userEvent.click(option(label));
  };

  return { view, within, choose, one, open, submit, trigger };
}

describe("binding a select to the form", () => {
  it("submits the value of the item that was picked", async () => {
    const onSubmit = vi.fn();
    const field = await mountField({ onSubmit });

    await field.choose("United States");
    await expect.element(field.trigger()).toHaveTextContent("United States");

    await field.submit();

    // The value, not the label: what a select reports through `onValueChange` is what
    // the form holds, since there is no change event to forward.
    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ country: "us" }, expect.anything()),
    );
  });

  it("keeps the placeholder while the form holds nothing", async () => {
    // No item can carry `""`, so the empty string the binding falls back to reads as
    // "nothing chosen" rather than as a choice.
    const field = await mountField();

    await expect.element(field.trigger()).toHaveTextContent("Select a country");
  });

  it("opens on the label of the value the form already holds", async () => {
    const field = await mountField({ defaultValue: "ca" });

    await expect.element(field.trigger()).toHaveTextContent("Canada");
  });
});

describe("naming the field and its menu", () => {
  it("names both halves from the field's own name", async () => {
    const field = await mountField();

    expect(field.one("country-label")).toHaveTextContent("Country");
    expect(field.one("country-trigger")).toBe(field.trigger().element());

    await field.open();

    // Named by the value it stands for rather than by position, which reorders with
    // the data.
    await expect.element(page.getByTestId("country-item-us")).toBeInTheDocument();
  });

  it("renames the menu along with the trigger when the field is given a name", async () => {
    // The bug this replaced: the field handed its `data-testid` to the trigger alone,
    // so the trigger was named from it and the menu from `name`, and the two silently
    // disagreed. The base goes to `Select`, which is what both halves read.
    const field = await mountField({ "data-testid": "birth-country" });

    expect(field.one("birth-country-trigger")).toBe(field.trigger().element());

    await field.open();

    await expect.element(page.getByTestId("birth-country-item-ca")).toBeInTheDocument();
  });
});

describe("when nothing was chosen", () => {
  const rules = { required: "Pick a country." };

  it("shows the rule's message and marks the trigger invalid", async () => {
    const field = await mountField({ rules });

    await field.submit();

    // An error arriving mid-form is news, so the message line becomes a live region.
    await expect.element(field.within.getByRole("alert")).toHaveTextContent("Pick a country.");
    expect(field.trigger().element()).toHaveAttribute("aria-invalid", "true");
    await expect.element(field.trigger()).toHaveAccessibleDescription("Pick a country.");
  });
});
