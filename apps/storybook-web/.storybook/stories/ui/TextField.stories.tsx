import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eye, EyeOff, Mail, Search, X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { within } from "storybook/test";
import * as z from "zod";

import { Button } from "@ui/web/Button";
import { Form, FormTextField } from "@ui/web/Form";
import { TextField } from "@ui/web/TextField";

/**
 * The full field from the design: label row with an optional link, the box with
 * its adornment slots, and one line of helper or error text.
 *
 * `Input` stays the bare box; everything around it lives here.
 */
const meta: Meta<typeof TextField> = {
  title: "Verified/Molecules/TextField",
  id: "TextField",
  component: TextField,
  tags: ["autodocs", "status:verified", "level:molecules"],
  argTypes: {
    label: { control: "text", description: "Label above the field" },
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
      description: "Label above the box, or beside it",
    },
    description: {
      control: "text",
      description: "Helper text below the field",
    },
    error: {
      control: "text",
      description: "Replaces the helper text and marks the field invalid",
    },
    invalid: {
      control: "boolean",
      description: "Error styling without a message",
    },
    validation: {
      control: "select",
      options: [undefined, "positive", "negative"],
      description: "Validation glyph in the rightmost slot",
    },
    placeholder: { control: "text", description: "Placeholder text" },
    disabled: { control: "boolean", description: "Whether the field is disabled" },
    readOnly: { control: "boolean", description: "Whether the field is read-only" },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
      description: "The input type",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-90">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TextField>;

/** Label, field and helper text — the anatomy without any optional part. */
export const Default: Story = {
  args: {
    name: "field",
    label: "Label",
    placeholder: "Placeholder",
    description: "This is an input description.",
  },
};

/**
 * Figma's "Link" in the label row. You pass the element that navigates and the
 * field dresses it, so a router's `Link` drops in the same way an `<a>` does.
 */
export const WithAction: Story = {
  args: {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    action: <a href="#reset">Forgot password?</a>,
    description: "At least 8 characters.",
  },
};

/** A decorative icon on `onSurface/Muted`, offsetting the text to 40px. */
export const WithStartAdornment: Story = {
  args: {
    name: "search",
    label: "Search",
    type: "search",
    placeholder: "Search…",
    startAdornment: <Search />,
  },
};

/**
 * The end slot takes an icon button just as readily as an icon: the slot itself
 * is inert so it never steals a click meant for the field, and re-enables
 * pointer events for anything interactive inside it.
 */
export const WithActionableAdornment: Story = {
  render: (args) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <TextField
        {...args}
        type={visible ? "text" : "password"}
        endAdornment={
          <Button
            variant="link"
            size="sm"
            type="button"
            className="size-4 min-w-0 p-0"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        }
      />
    );
  },
  args: {
    name: "password",
    label: "Password",
    defaultValue: "hunter2hunter2",
    description: "Click the eye to reveal the value.",
  },
};

/** Validation glyph — `Icon / Check` on `Feedback/Positive`. */
export const ValidationPositive: Story = {
  args: {
    name: "email",
    label: "Email",
    type: "email",
    defaultValue: "name@example.com",
    startAdornment: <Mail />,
    validation: "positive",
    description: "Address confirmed.",
  },
};

/**
 * `error` replaces the helper line rather than joining it — Figma has no
 * separate error node, the same line recolours to `Feedback/Negative`.
 */
export const WithError: Story = {
  args: {
    name: "email",
    label: "Email",
    type: "email",
    defaultValue: "not-an-email",
    startAdornment: <Mail />,
    validation: "negative",
    error: "Enter a valid email address.",
  },
};

/** Both slots filled, so the field reserves 40px left and 64px right. */
export const BothAdornments: Story = {
  args: {
    name: "email",
    label: "Email",
    action: <a href="#help">Need help?</a>,
    type: "email",
    defaultValue: "name@example.com",
    startAdornment: <Mail />,
    endAdornment: <Eye />,
    validation: "positive",
    description: "We'll only use this to sign you in.",
  },
};

/**
 * A side takes as many adornments as it is given: pass a fragment and each
 * child gets its own box, with the field reserving room for all of them. This
 * is the shape a password field ends up in — a reveal toggle and a clear
 * button beside the validation glyph.
 */
export const MultipleEndAdornments: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("hunter2hunter2");
    const [visible, setVisible] = React.useState(false);

    return (
      <TextField
        {...args}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        validation="positive"
        endAdornment={
          <>
            <Button
              variant="link"
              size="sm"
              type="button"
              className="size-4 min-w-0 p-0"
              aria-label={visible ? "Hide password" : "Show password"}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <EyeOff /> : <Eye />}
            </Button>
            {value !== "" && (
              <Button
                variant="link"
                size="sm"
                type="button"
                className="size-4 min-w-0 p-0"
                aria-label="Clear"
                onClick={() => setValue("")}
              >
                <X />
              </Button>
            )}
          </>
        }
      />
    );
  },
  args: {
    name: "password",
    label: "Password",
    description: "Three boxes on the trailing side, spaced by the design's gap.",
  },
};

/** Figma frame "New Focus" — 2px white border, `SurfaceVariant1`, focus ring. */
export const Focused: Story = {
  args: {
    name: "field",
    label: "Label",
    placeholder: "Placeholder",
    description: "This is an input description.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("textbox").focus();
  },
};

export const Disabled: Story = {
  args: {
    name: "field",
    label: "Label",
    action: <a href="#help">Need help?</a>,
    placeholder: "Placeholder",
    startAdornment: <Mail />,
    endAdornment: <Eye />,
    description: "Sign-in is temporarily unavailable.",
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    name: "field",
    label: "Label",
    defaultValue: "Read-only value",
    startAdornment: <Mail />,
    description: "This value cannot be edited.",
    readOnly: true,
  },
};

/**
 * The label beside the box instead of above it. The label column is
 * `--textfield-label-width`, so it is the field that decides how wide the
 * column is, not the length of the word in it.
 */
export const Horizontal: Story = {
  args: {
    name: "field",
    orientation: "horizontal",
    label: "Name",
    placeholder: "Placeholder",
  },
};

/**
 * What the orientation is for: the Dialog form, where every label lines up
 * because one ancestor sets the column width for all of them.
 *
 * The last field shows where the helper line goes — under the box, not under the
 * label.
 */
export const HorizontalForm: Story = {
  decorators: [],
  render: () => (
    <div className="bg-background-layout-surface w-110 flex flex-col gap-4 rounded-lg p-6 [--textfield-label-width:6rem]">
      <TextField name="name" orientation="horizontal" label="Name" placeholder="Placeholder" />
      <TextField
        name="username"
        orientation="horizontal"
        label="Username"
        placeholder="Placeholder"
      />
      <TextField
        name="email"
        orientation="horizontal"
        label="Email"
        defaultValue="not-an-email"
        error="Enter a valid email address."
        validation="negative"
      />
    </div>
  ),
};

/** Every statically representable state of the composed field. */
export const AllStates: Story = {
  decorators: [],
  render: () => (
    <div className="w-90 flex flex-col gap-6">
      <TextField
        name="empty"
        label="Empty"
        placeholder="Placeholder"
        description="This is an input description."
      />
      <TextField
        name="filled"
        label="Filled"
        defaultValue="Filled value"
        description="This is an input description."
      />
      <TextField
        name="withLink"
        label="With link"
        action={<a href="#">Link</a>}
        defaultValue="Filled value"
        description="This is an input description."
      />
      <TextField
        name="adornments"
        label="Adornments"
        startAdornment={<Mail />}
        endAdornment={<Eye />}
        validation="positive"
        defaultValue="name@example.com"
        description="This is an input description."
      />
      <TextField
        name="error"
        label="Error"
        startAdornment={<Mail />}
        validation="negative"
        defaultValue="not-an-email"
        error="Enter a valid email address."
      />
      <TextField
        name="disabled"
        label="Disabled"
        startAdornment={<Mail />}
        defaultValue="Disabled value"
        description="This is an input description."
        disabled
      />
      <TextField
        name="readOnly"
        label="Read-only"
        defaultValue="Read-only value"
        description="This is an input description."
        readOnly
      />
    </div>
  ),
};

const schema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(8, "At least 8 characters."),
});

/**
 * `FormTextField` binds one field to react-hook-form: it forwards the register
 * handlers and the ref, and turns the validation error into the message under
 * the box. Submit while empty to see both fields fail.
 */
export const WithReactHookForm: Story = {
  decorators: [],
  render: () => {
    const form = useForm<z.infer<typeof schema>>({
      resolver: zodResolver(schema),
      defaultValues: { email: "", password: "" },
      mode: "onSubmit",
    });

    return (
      <Form {...form}>
        <form className="w-90 flex flex-col gap-6" onSubmit={form.handleSubmit(() => undefined)}>
          <FormTextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="name@example.com"
            startAdornment={<Mail />}
            description="We'll only use this to sign you in."
          />
          <FormTextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            action={<a href="#reset">Forgot password?</a>}
          />
          <Button type="submit">Sign in</Button>
        </form>
      </Form>
    );
  },
};

/**
 * `allow` keeps the value matching as it is typed: a character that would
 * break the rule is never recorded, which is how the restricted fields —
 * digits only, no punctuation in a name — are written. It is not validation,
 * so the rule that produces a message still lives in `rules`. `showValidation`
 * then follows the field state once it has been touched.
 *
 * Try typing letters into either field.
 */
export const RestrictedInput: Story = {
  decorators: [],
  render: () => {
    const form = useForm<{ zip: string; name: string }>({
      defaultValues: { zip: "", name: "" },
      mode: "onTouched",
    });

    return (
      <Form {...form}>
        <form className="w-90 flex flex-col gap-6">
          <FormTextField
            control={form.control}
            name="zip"
            label="ZIP code"
            inputMode="numeric"
            placeholder="12345"
            allow={/^\d*$/}
            showValidation
            rules={{ pattern: { value: /^\d{5}$/, message: "Five digits." } }}
            description="Digits only — letters never make it into the value."
          />
          <FormTextField
            control={form.control}
            name="name"
            label="First name"
            placeholder="Ada"
            allow={/^[\p{L} '-]*$/u}
            showValidation
            rules={{ required: "First name is required." }}
            description="Letters, spaces, apostrophes and hyphens."
          />
        </form>
      </Form>
    );
  },
};

/** The same form after a failed submit, so the error state is captured. */
export const ReactHookFormErrors: Story = {
  ...WithReactHookForm,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("button", { name: "Sign in" }).click();
  },
};
