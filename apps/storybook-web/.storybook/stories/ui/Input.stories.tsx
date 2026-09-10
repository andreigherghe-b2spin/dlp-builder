import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Eye, Mail, Search, X } from "lucide-react";
import * as React from "react";
import { within } from "storybook/test";

import { Button } from "@ui/web/Button";
import { Input } from "@ui/web/Input";
import { Label } from "@ui/web/Label";

const meta: Meta<typeof Input> = {
  title: "Verified/Atoms/Input",
  id: "Input",
  component: Input,
  tags: ["autodocs", "status:verified", "level:atoms"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
      description: "The input type",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    readOnly: {
      control: "boolean",
      description: "Whether the input is read-only",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    value: {
      control: "text",
      description: "Input value",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

const captionClass = "text-foreground-on-page-muted text-(length:--typography-font-size-body-s)";

/** Figma variant "Empty" — the placeholder is showing. */
export const Default: Story = {
  args: {
    type: "text",
    placeholder: "Enter text...",
  },
};

/** Figma variant "Filled text". */
export const Filled: Story = {
  args: {
    type: "text",
    placeholder: "Enter text...",
    defaultValue: "Filled value",
  },
};

/** Figma variant "Filled password". */
export const FilledPassword: Story = {
  args: {
    type: "password",
    placeholder: "Enter your password",
    defaultValue: "hunter2hunter2",
  },
};

export const Focused: Story = {
  args: {
    type: "text",
    placeholder: "Enter text...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("textbox").focus();
  },
};

/** Figma `Variant=Empty, Error=True`. */
export const Invalid: Story = {
  args: {
    type: "text",
    placeholder: "Invalid input",
    "aria-invalid": true,
  },
};

/** Figma `Variant=Filled text, Error=True`, without the caret. */
export const InvalidFilled: Story = {
  args: {
    type: "text",
    placeholder: "Invalid input",
    defaultValue: "not-an-email",
    "aria-invalid": true,
  },
};

/** Figma state "Disabled". */
export const Disabled: Story = {
  args: {
    type: "text",
    placeholder: "Disabled input",
    disabled: true,
  },
};

/**
 * Not designed in Figma yet — renders as Default with pointer interactions
 * muted. This story is where the state shows up once the design lands.
 */
export const ReadOnly: Story = {
  args: {
    type: "text",
    readOnly: true,
    defaultValue: "Read-only value",
  },
};

/** Every statically representable state side by side. */
export const AllStates: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      {(
        [
          ["Empty", { placeholder: "Enter text..." }],
          ["Filled", { defaultValue: "Filled value" }],
          ["Filled password", { type: "password", defaultValue: "hunter2hunter2" }],
          ["Error — empty", { placeholder: "Enter text...", "aria-invalid": true }],
          ["Error — filled", { defaultValue: "not-an-email", "aria-invalid": true }],
          ["Disabled", { defaultValue: "Disabled value", disabled: true }],
          ["Read-only", { defaultValue: "Read-only value", readOnly: true }],
        ] as const
      ).map(([label, props]) => (
        <div key={label} className="flex flex-col gap-1">
          <Label className={captionClass}>{label}</Label>
          <Input type="text" {...props} />
        </div>
      ))}
    </div>
  ),
};

/**
 * Adornments live on the box, so a search field needs no wrapper component:
 * the icon and the clear button go straight on `Input`, and the field reserves
 * room for them. Either side takes several at once — pass a fragment.
 */
export const WithAdornments: Story = {
  render: () => {
    const [value, setValue] = React.useState("Blackjack");

    return (
      <div className="flex w-80 flex-col gap-4">
        <Input
          type="search"
          placeholder="Search…"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          startAdornment={<Search />}
          endAdornment={
            value !== "" && (
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
            )
          }
        />
        <Input
          type="email"
          defaultValue="name@example.com"
          startAdornment={<Mail />}
          endAdornment={
            <>
              <Eye />
              <Check className="text-foreground-feedback-positive" />
            </>
          }
        />
        <Input
          type="text"
          defaultValue="Disabled value"
          startAdornment={<Mail />}
          endAdornment={<Eye />}
          disabled
        />
      </div>
    );
  },
};

export const Types: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-4">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
    </div>
  ),
};
