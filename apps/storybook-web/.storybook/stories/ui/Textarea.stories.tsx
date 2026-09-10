import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "storybook/test";

import { Textarea } from "@ui/web/Textarea";

/**
 * The bare multi-line box — the same rectangle `Input` is drawn from, with the
 * height a floor instead of a value.
 *
 * Everything the design puts around it (label, link, helper line) lives in
 * `TextareaField`.
 */
const meta: Meta<typeof Textarea> = {
  title: "Needs Review/Atoms/Textarea",
  id: "Textarea",
  component: Textarea,
  tags: ["autodocs", "status:needs-review", "level:atoms"],
  argTypes: {
    placeholder: { control: "text", description: "Placeholder text" },
    rows: { control: "number", description: "Visible rows; never below `min-h-16`" },
    disabled: { control: "boolean", description: "Whether the box is disabled" },
    readOnly: { control: "boolean", description: "Whether the box is read-only" },
    "aria-invalid": { control: "boolean", description: "Error styling" },
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

type Story = StoryObj<typeof Textarea>;

/** `min-h-16` — Figma's 64px floor, which is two lines plus the 12px padding. */
export const Default: Story = {
  args: { name: "message", placeholder: "Type your message here." },
};

export const Filled: Story = {
  args: {
    name: "message",
    defaultValue: "Filled text that runs long enough to wrap onto a second line.",
  },
};

/** `rows` is what sets the height; the floor only applies below it. */
export const WithRows: Story = {
  args: { name: "message", rows: 6, placeholder: "Six rows of room." },
};

/** Figma draws no grab handle, so a consumer that wants one asks for it. */
export const Resizable: Story = {
  args: {
    name: "message",
    className: "resize-y",
    placeholder: "Drag the bottom edge.",
  },
};

/** 2px `state/active` border, rendered as 1px plus a 1px inset shadow. */
export const Focused: Story = {
  args: { name: "message", placeholder: "Type your message here." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("textbox").focus();
  },
};

export const Invalid: Story = {
  args: {
    name: "message",
    "aria-invalid": true,
    defaultValue: "Filled text",
  },
};

export const Disabled: Story = {
  args: { name: "message", disabled: true, defaultValue: "Filled text" },
};

export const ReadOnly: Story = {
  args: { name: "message", readOnly: true, defaultValue: "Read-only value" },
};

/** Every statically representable state of the box. */
export const AllStates: Story = {
  decorators: [],
  render: () => (
    <div className="w-90 flex flex-col gap-4">
      <Textarea name="empty" placeholder="Type your message here." />
      <Textarea name="filled" defaultValue="Filled text" />
      <Textarea name="rows" rows={4} defaultValue="Four rows, so the box is taller." />
      <Textarea name="invalid" aria-invalid defaultValue="Filled text" />
      <Textarea name="disabled" disabled defaultValue="Filled text" />
      <Textarea name="readOnly" readOnly defaultValue="Read-only value" />
    </div>
  ),
};
