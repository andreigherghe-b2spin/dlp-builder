import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Form, FormTextField, type FormTextFieldProps } from "@/organisms/Form";
import { Button } from "@/atoms/Button";

type Values = { zip: string };

/**
 * The bound field inside a real `<Form>`, around a real `TextField` and a real
 * `useForm`.
 *
 * Nothing here is stubbed: this component is one composition — a controller bound
 * to a field molecule — and mocking either end would leave the test asserting that
 * a mock forwarded a prop.
 */
async function mountField({
  defaultValue = "",
  onSubmit = vi.fn(),
  ...props
}: Partial<FormTextFieldProps<Values, "zip">> & {
  defaultValue?: string;
  onSubmit?: (values: Values) => void;
} = {}) {
  function Fields() {
    const form = useForm<Values>({ defaultValues: { zip: defaultValue } });

    return (
      <Form {...form}>
        <form
          // `void`, because `handleSubmit` returns a promise and a DOM handler must not.
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        >
          {/* No `data-testid`: a field required to have a `name` is already
              addressable by it, and passing a second one would only hide the id the
              app will really have. */}
          <FormTextField control={form.control} name="zip" label="ZIP code" {...props} />
          <Button type="submit">Continue</Button>
        </form>
      </Form>
    );
  }

  const view = await render(<Fields />);
  // Scoped to this render, since `getByTestId` otherwise searches the whole page.
  const within = page.elementLocator(view.container);
  const one = (testId: string) => within.getByTestId(testId).element() as HTMLElement;

  const box = () => within.getByLabelText("ZIP code");
  const input = () => box().element() as HTMLInputElement;
  const submit = () => userEvent.click(within.getByRole("button", { name: "Continue" }));

  /**
   * How many graphics the field draws. The validation tick and cross are
   * `aria-hidden` SVGs with no name and no test id of their own — there is nothing
   * to address one by, so whether a graphic is there at all is what this reads.
   */
  const glyphs = () => one("zip").querySelectorAll("svg").length;

  return { view, within, box, glyphs, input, one, submit };
}

describe("binding a text field to the form", () => {
  it("submits what was typed under the field's name", async () => {
    const onSubmit = vi.fn();
    const field = await mountField({ onSubmit });

    await userEvent.fill(field.box(), "10001");
    await field.submit();

    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ zip: "10001" }),
        expect.anything(),
      ),
    );
  });

  it("opens on the form's value, controlled from the first render", async () => {
    // `value ?? ""` is what keeps this from starting uncontrolled and switching over
    // on the first keystroke — React's one unrecoverable warning for an input.
    const field = await mountField({ defaultValue: "90210" });

    expect(field.input().value).toBe("90210");
  });

  it("is addressable by the name the form already keys it on", async () => {
    const field = await mountField({ description: "Five digits." });

    expect(field.one("zip-label")).toHaveTextContent("ZIP code");
    expect(field.one("zip-input")).toBe(field.input());
    expect(field.one("zip-description")).toHaveTextContent("Five digits.");
  });

  it("passes the form's disabled state down to the input", async () => {
    const field = await mountField({ disabled: true });

    await expect.element(field.box()).toBeDisabled();
  });
});

describe("the `allow` rule", () => {
  it("drops a keystroke that would leave the value not matching", async () => {
    const field = await mountField({ allow: /^\d*$/ });

    await userEvent.type(field.box(), "12a3");

    // Not validation: nothing is said to the user, the letter simply never lands.
    expect(field.input().value).toBe("123");
  });

  it("still lets the field be emptied", async () => {
    // An empty value always passes, otherwise a field with a rule could never be
    // cleared once something had been typed into it.
    const field = await mountField({ allow: /^\d{5}$/, defaultValue: "10001" });

    await userEvent.clear(field.box());

    expect(field.input().value).toBe("");
  });
});

describe("when the field fails its rule", () => {
  const rules = { required: "Enter your ZIP code." };

  it("shows the rule's message, announced, and marks the field invalid", async () => {
    const field = await mountField({ rules });

    await field.submit();

    // An error arriving mid-form is news, so the message line becomes a live region
    // — which is the difference between this and a static hint in the same place.
    await expect.element(field.within.getByRole("alert")).toHaveTextContent("Enter your ZIP code.");
    expect(field.input()).toHaveAttribute("aria-invalid", "true");
    expect(field.input()).toHaveAccessibleDescription("Enter your ZIP code.");
  });

  it("clears the message once the field is filled in", async () => {
    const field = await mountField({ rules });

    await field.submit();
    await expect.element(field.within.getByRole("alert")).toBeVisible();

    await userEvent.fill(field.box(), "10001");

    await vi.waitFor(() => expect(field.input()).not.toHaveAttribute("aria-invalid", "true"));
  });

  it("lets the caller's own error win over the form's", async () => {
    // For an error the form cannot know about — one the server sent back.
    const field = await mountField({ rules, error: "That ZIP is not in our region." });

    await field.submit();

    await expect
      .element(field.within.getByRole("alert"))
      .toHaveTextContent("That ZIP is not in our region.");
  });
});

describe("the validation glyph", () => {
  it("waits for the field to be left before it appears", async () => {
    const field = await mountField({ showValidation: true });

    // A form should not open covered in ticks and crosses.
    expect(field.glyphs()).toBe(0);

    await userEvent.fill(field.box(), "10001");
    // Touched is set on blur, which is the moment the user is done with the field.
    await userEvent.tab();

    await vi.waitFor(() => expect(field.glyphs()).toBe(1));
  });

  it("can be forced either way whatever the field state is", async () => {
    const field = await mountField({ validation: "negative" });

    expect(field.glyphs()).toBe(1);
  });
});
