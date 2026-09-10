import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { within } from "storybook/test";
import * as z from "zod";

import { Button } from "@ui/web/Button";
import { Form, FormTextareaField, FormTextField } from "@ui/web/Form";
import { TextareaField } from "@ui/web/TextareaField";

/**
 * The full multi-line field from the design (node 3176:5907): label row with an
 * optional link, the box, and one line of helper or error text.
 *
 * `Textarea` stays the bare box; everything around it lives here.
 */
const meta: Meta<typeof TextareaField> = {
  title: "Needs Review/Molecules/TextareaField",
  id: "TextareaField",
  component: TextareaField,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  argTypes: {
    label: { control: "text", description: "Label above the box" },
    description: { control: "text", description: "Helper text below the box" },
    error: {
      control: "text",
      description: "Replaces the helper text and marks the field invalid",
    },
    invalid: { control: "boolean", description: "Error styling without a message" },
    placeholder: { control: "text", description: "Placeholder text" },
    rows: { control: "number", description: "Visible rows; never below `min-h-16`" },
    disabled: { control: "boolean", description: "Whether the field is disabled" },
    readOnly: { control: "boolean", description: "Whether the field is read-only" },
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

type Story = StoryObj<typeof TextareaField>;

/** Label, box and helper text — the anatomy without any optional part. */
export const Default: Story = {
  args: {
    name: "message",
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
    name: "message",
    label: "Message",
    action: <a href="#help">Need help?</a>,
    placeholder: "Type your message here.",
    description: "We usually reply within a day.",
  },
};

/** No label row at all — the box and its helper line keep their own spacing. */
export const WithoutLabel: Story = {
  args: {
    name: "message",
    placeholder: "Type your message here.",
    description: "This is an input description.",
  },
};

export const Filled: Story = {
  args: {
    name: "message",
    label: "Label",
    defaultValue: "Filled text",
    description: "This is an input description.",
  },
};

/** `rows` reaches the box through the spread, like every other native prop. */
export const WithRows: Story = {
  args: {
    name: "bio",
    label: "Bio",
    rows: 6,
    placeholder: "Tell us about yourself.",
    description: "Up to 200 characters.",
  },
};

/**
 * `error` replaces the helper line rather than joining it — Figma has no
 * separate error node, the same line recolours to `Feedback/Negative`.
 */
export const WithError: Story = {
  args: {
    name: "message",
    label: "Label",
    defaultValue: "Filled text",
    error: "This is an input description.",
  },
};

/** Figma frame "State=Focus" — 2px `state/active` border. */
export const Focused: Story = {
  args: {
    name: "message",
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
    name: "message",
    label: "Label",
    action: <a href="#help">Link</a>,
    defaultValue: "Filled text",
    description: "This is an input description.",
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    name: "message",
    label: "Label",
    defaultValue: "Read-only value",
    description: "This value cannot be edited.",
    readOnly: true,
  },
};

/** Every statically representable state of the composed field. */
export const AllStates: Story = {
  decorators: [],
  render: () => (
    <div className="w-90 flex flex-col gap-6">
      <TextareaField
        name="empty"
        label="Empty"
        placeholder="Placeholder"
        description="This is an input description."
      />
      <TextareaField
        name="filled"
        label="Filled"
        defaultValue="Filled text"
        description="This is an input description."
      />
      <TextareaField
        name="withLink"
        label="With link"
        action={<a href="#">Link</a>}
        defaultValue="Filled text"
        description="This is an input description."
      />
      <TextareaField
        name="error"
        label="Error"
        defaultValue="Filled text"
        error="This is an input description."
      />
      <TextareaField
        name="disabled"
        label="Disabled"
        action={<a href="#">Link</a>}
        defaultValue="Filled text"
        description="This is an input description."
        disabled
      />
      <TextareaField
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
  subject: z.string().min(1, "Subject is required."),
  message: z
    .string()
    .min(20, "Tell us a little more — at least 20 characters.")
    .max(200, "Keep it under 200 characters."),
});

/**
 * `FormTextareaField` binds one field to react-hook-form: it forwards the
 * register handlers and the ref, and turns the validation error into the message
 * under the box. It sits beside `FormTextField` in the same form — both are the
 * same `FormField` pattern with the boilerplate collapsed.
 *
 * Submit while empty to see both fields fail.
 */
export const WithReactHookForm: Story = {
  decorators: [],
  render: () => {
    const form = useForm<z.infer<typeof schema>>({
      resolver: zodResolver(schema),
      defaultValues: { subject: "", message: "" },
      mode: "onSubmit",
    });

    return (
      <Form {...form}>
        <form className="w-90 flex flex-col gap-6" onSubmit={form.handleSubmit(() => undefined)}>
          <FormTextField
            control={form.control}
            name="subject"
            label="Subject"
            placeholder="What is this about?"
          />
          <FormTextareaField
            control={form.control}
            name="message"
            label="Message"
            rows={5}
            placeholder="Type your message here."
            action={<a href="#help">Need help?</a>}
            description="Between 20 and 200 characters."
          />
          <Button type="submit">Send</Button>
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
    canvas.getByRole("button", { name: "Send" }).click();
  },
};
