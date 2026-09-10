import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { within } from "storybook/test";

import { Checkbox } from "@ui/web/Checkbox";
import { Label } from "@ui/web/Label";

const meta: Meta<typeof Checkbox> = {
  title: "Verified/Atoms/Checkbox",
  id: "Checkbox",
  component: Checkbox,
  tags: ["autodocs", "status:verified", "level:atoms"],
  argTypes: {
    checked: {
      control: "select",
      options: [false, true, "indeterminate"],
      description: "Checked, unchecked, or partially selected",
    },
    disabled: {
      control: "boolean",
      description: "Whether the checkbox is disabled",
    },
    "aria-invalid": {
      control: "boolean",
      description: "Marks the box invalid — a negative border",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
    children: {
      control: false,
      description: "Custom indicator content (defaults to a tick, or a dash when indeterminate)",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

const captionClass = "text-foreground-on-page-muted text-(length:--typography-font-size-body-s)";

/** Figma "Status=Unchecked, State=Default" — Surface fill, Neutral/Strong border. */
export const Default: Story = {
  args: {
    checked: false,
  },
};

/** Figma "Status=Checked, State=Default" — PrimaryContainer fill, tick glyph. */
export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    checked: "indeterminate",
  },
};

export const Focused: Story = {
  args: {
    checked: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("checkbox").focus();
  },
};

/** Figma "State=Disabled" — the disabled fill, and no focus ring. */
export const DisabledUnchecked: Story = {
  args: {
    checked: false,
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    checked: false,
    "aria-invalid": true,
  },
};

export const DisabledInvalid: Story = {
  args: {
    checked: false,
    disabled: true,
    "aria-invalid": true,
  },
};

/** `children` replaces the indicator outright when a product needs its own mark. */
export const CustomIndicator: Story = {
  args: {
    checked: true,
    children: (
      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

export const WithLabel: Story = {
  render: (args) => {
    const [checked, setChecked] = React.useState(false);

    return (
      <div className="flex items-center gap-3">
        <Checkbox
          {...args}
          id="terms"
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    );
  },
};

export const DisabledWithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Checkbox id="disabled-with-label" disabled />
      <Label htmlFor="disabled-with-label">Unavailable option</Label>
    </div>
  ),
};

export const Interactive: Story = {
  render: (args) => {
    const [checked, setChecked] = React.useState<boolean | "indeterminate">(false);

    return <Checkbox {...args} checked={checked} onCheckedChange={setChecked} />;
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(
        [
          ["Unchecked", false],
          ["Checked", true],
          ["Indeterminate", "indeterminate"],
        ] as const
      ).map(([status, checked]) => (
        <div key={status} className="flex flex-col gap-2">
          <Label className={captionClass}>{status}</Label>
          <div className="flex items-center gap-6">
            {(
              [
                ["Default", {}],
                ["Disabled", { disabled: true }],
                ["Invalid", { "aria-invalid": true }],
              ] as const
            ).map(([state, props]) => (
              <div key={state} className="flex items-center gap-3">
                <Checkbox checked={checked} {...props} />
                <Label className={captionClass}>{state}</Label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
