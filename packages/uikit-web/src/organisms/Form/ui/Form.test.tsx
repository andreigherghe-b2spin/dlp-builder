import type * as React from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/organisms/Form";
import { Input } from "@/atoms/Input";
import { Button } from "@/atoms/Button";

type Values = { email: string };

type Fixture = {
  /** A rule with a message, so the field can be pushed into its error state. */
  rules?: React.ComponentProps<typeof FormField<Values, "email">>["rules"];
  /** Names the field, which is what its parts derive their ids from. */
  testId?: string;
  /** Left off for the case about a field nobody named. */
  named?: boolean;
  description?: React.ReactNode;
  /** Text for `FormMessage` to fall back to while the field is valid. */
  messageChildren?: React.ReactNode;
  onSubmit?: (values: Values) => void;
  /** Replaces the plain input, for the cases about what `FormControl` clones onto it. */
  control?: React.ReactElement;
};

/**
 * The primitives assembled the way the JSDoc example assembles them, around a real
 * `Input` and a real `useForm`.
 *
 * Neither is stubbed, deliberately: every one of these components is a read of
 * react-hook-form's field state placed onto a control it does not own, so a fake
 * form or a fake input would leave the test asserting that a mock was called.
 */
async function mountForm({
  rules,
  testId = "email-field",
  description = "We only use it to sign you in.",
  messageChildren,
  onSubmit = vi.fn(),
  control,
  named = true,
}: Fixture = {}) {
  function Fields() {
    const form = useForm<Values>({ defaultValues: { email: "" } });

    return (
      <Form {...form}>
        <form
          // `void`, because `handleSubmit` returns a promise and a DOM handler must not.
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        >
          <FormField
            control={form.control}
            name="email"
            rules={rules}
            render={({ field }) => (
              <FormItem data-testid={named ? testId : undefined}>
                <FormLabel>Email</FormLabel>
                <FormControl>{control ?? <Input {...field} />}</FormControl>
                {description != null && <FormDescription>{description}</FormDescription>}
                <FormMessage>{messageChildren}</FormMessage>
              </FormItem>
            )}
          />
          <Button type="submit">Sign in</Button>
        </form>
      </Form>
    );
  }

  const view = await render(<Fields />);
  // Scoped to this render, since `getByTestId` otherwise searches the whole page.
  const within = page.elementLocator(view.container);
  const count = (id: string) => within.getByTestId(id).elements().length;
  const one = (id: string) => within.getByTestId(id).element() as HTMLElement;

  const input = () => within.getByLabelText("Email").element() as HTMLInputElement;
  /**
   * By test id rather than by role: `FormMessage` is a plain `<p>` — it carries no
   * `role="alert"` and no live region, unlike the message line in `TextField`. What
   * makes it reach a screen reader is the `aria-describedby` on the control, which
   * is asserted where it matters below.
   */
  const message = () => within.getByTestId(`${testId}-message`);
  const submit = () => userEvent.click(within.getByRole("button", { name: "Sign in" }));

  return { view, within, count, input, message, one, submit };
}

describe("what a field wires together", () => {
  it("points the label at the control and describes it by the helper line", async () => {
    const form = await mountForm();

    // The label reaches the input by `htmlFor`, which is the only reason
    // `getByLabelText` finds it at all — so this passing is the wiring working.
    const input = form.input();
    const description = form.one("email-field-description");

    expect(input.id).toBe(form.one("email-field-label").getAttribute("for"));
    expect(input.getAttribute("aria-describedby")).toBe(description.id);
    expect(input).toHaveAccessibleDescription("We only use it to sign you in.");
  });

  it("submits what the control holds", async () => {
    const onSubmit = vi.fn();
    const form = await mountForm({ onSubmit });

    await userEvent.fill(form.within.getByLabelText("Email"), "player@example.com");
    await form.submit();

    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ email: "player@example.com" }),
        expect.anything(),
      ),
    );
  });
});

describe("when the field fails its rule", () => {
  const rules = { required: "Enter your email address." };

  it("marks the control invalid and adds the message to what describes it", async () => {
    const form = await mountForm({ rules });

    await form.submit();

    await expect.element(form.message()).toHaveTextContent("Enter your email address.");

    const input = form.input();

    expect(input).toHaveAttribute("aria-invalid", "true");
    // What the message is actually for: it is read out after the helper line when the
    // control is reached, which is the only route it has to a screen reader.
    expect(input).toHaveAccessibleDescription(
      "We only use it to sign you in. Enter your email address.",
    );
    expect(form.one("email-field-label")).toHaveAttribute("data-error", "true");
    // Both, and in that order: the rule replaces nothing — the helper line is still
    // what the field is for, and the error is what is wrong with it right now.
    expect(input.getAttribute("aria-describedby")).toBe(
      `${form.one("email-field-description").id} ${form.one("email-field-message").id}`,
    );
  });

  it("goes clean again once the field is filled in", async () => {
    const form = await mountForm({ rules });

    await form.submit();
    await expect.element(form.message()).toBeVisible();

    await userEvent.fill(form.within.getByLabelText("Email"), "player@example.com");

    await vi.waitFor(() => expect(form.count("email-field-message")).toBe(0));
    expect(form.input()).not.toHaveAttribute("aria-invalid", "true");
  });
});

describe("the message line", () => {
  it("renders nothing at all while there is neither an error nor anything to say", async () => {
    // An empty `<p>` in the grid would be a gap under every valid field.
    const form = await mountForm();

    expect(form.count("email-field-message")).toBe(0);
  });

  it("shows what it was given, until the rule's message takes its place", async () => {
    const form = await mountForm({
      messageChildren: "Use the address on your account.",
      rules: { required: "Enter your email address." },
    });

    await expect.element(form.message()).toHaveTextContent("Use the address on your account.");

    await form.submit();

    await expect
      .element(form.within.getByTestId("email-field-message"))
      .toHaveTextContent("Enter your email address.");
  });
});

describe("naming a field's parts", () => {
  it("leaves a control that already has a name alone", async () => {
    // `FormControl` clones onto whatever was composed in, and a field molecule
    // already names itself from its `name` — the id the app will really have.
    const form = await mountForm({
      control: <Input name="email" data-testid="email-input" />,
    });

    expect(form.count("email-input")).toBe(1);
    expect(form.count("email-field-control")).toBe(0);
    // Still wired, so keeping its own name cost it nothing.
    expect(form.input().getAttribute("aria-describedby")).toBe(
      form.one("email-field-description").id,
    );
  });

  it("leaves the primitives silent when nobody named the field", async () => {
    const form = await mountForm({ named: false, rules: { required: "Enter it." } });

    await form.submit();

    for (const part of ["label", "description", "message"]) {
      expect(form.count(`email-field-${part}`)).toBe(0);
    }
    // The control is the exception, and it is a rule rather than a lapse: it takes its
    // name from the `name` the form already keys it on, so a field nobody named is
    // still addressable by the one id the app will really have.
    expect(form.count("email")).toBe(1);
    expect(form.one("email")).toBe(form.input());
  });
});
