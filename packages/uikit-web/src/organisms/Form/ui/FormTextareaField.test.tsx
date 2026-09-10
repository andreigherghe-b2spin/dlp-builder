import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Form, FormTextareaField, type FormTextareaFieldProps } from "@/organisms/Form";
import { Button } from "@/atoms/Button";

type Values = { message: string };

/**
 * The bound field inside a real `<Form>`, around a real `TextareaField` and a
 * real `useForm`.
 *
 * Nothing here is stubbed: this component is one composition — a controller
 * bound to a field molecule — and mocking either end would leave the test
 * asserting that a mock forwarded a prop.
 *
 * Three cases, one per line this file actually owns: the binding, the
 * `value ?? ""` that keeps the box controlled, and `error ?? errorMessage(…)`.
 * Everything the field does around them is `TextareaField`'s own test.
 */
async function mountField({
  defaultValue = "",
  onSubmit = vi.fn(),
  ...props
}: Partial<FormTextareaFieldProps<Values, "message">> & {
  defaultValue?: string;
  onSubmit?: (values: Values) => void;
} = {}) {
  function Fields() {
    const form = useForm<Values>({ defaultValues: { message: defaultValue } });

    return (
      <Form {...form}>
        <form
          // `void`, because `handleSubmit` returns a promise and a DOM handler must not.
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        >
          {/* No `data-testid`: a field required to have a `name` is already
              addressable by it. */}
          <FormTextareaField control={form.control} name="message" label="Message" {...props} />
          <Button type="submit">Send</Button>
        </form>
      </Form>
    );
  }

  const view = await render(<Fields />);
  // Scoped to this render, since `getByTestId` otherwise searches the whole page.
  const within = page.elementLocator(view.container);

  const box = () => within.getByLabelText("Message");
  const textarea = () => box().element() as HTMLTextAreaElement;
  const submit = () => userEvent.click(within.getByRole("button", { name: "Send" }));

  return { view, within, box, textarea, submit };
}

describe("binding a multi-line field to the form", () => {
  it("submits what was typed under the field's name", async () => {
    const onSubmit = vi.fn();
    const field = await mountField({ onSubmit });

    await userEvent.fill(field.box(), "Two lines would do.");
    await field.submit();

    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Two lines would do." }),
        expect.anything(),
      ),
    );
  });

  it("opens on the form's value, controlled from the first render", async () => {
    // `value ?? ""` is what keeps this from starting uncontrolled and switching
    // over on the first keystroke — React's one unrecoverable warning here.
    const field = await mountField({ defaultValue: "Filled text" });

    expect(field.textarea().value).toBe("Filled text");
  });
});

describe("when the field fails its rule", () => {
  const rules = { required: "A message is required." };

  it("shows the rule's message, announced, and marks the field invalid", async () => {
    const field = await mountField({ rules });

    await field.submit();

    await expect
      .element(field.within.getByRole("alert"))
      .toHaveTextContent("A message is required.");
    expect(field.textarea()).toHaveAttribute("aria-invalid", "true");
    expect(field.textarea()).toHaveAccessibleDescription("A message is required.");
  });

  it("lets the caller's own error win over the form's", async () => {
    // For an error the form cannot know about — one the server sent back.
    const field = await mountField({ rules, error: "We could not deliver that message." });

    await field.submit();

    await expect
      .element(field.within.getByRole("alert"))
      .toHaveTextContent("We could not deliver that message.");
  });
});
