import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "@ui/web/Label";
import { SwitchField } from "@ui/web/SwitchField";

const meta: Meta<typeof SwitchField> = {
  title: "Verified/Molecules/SwitchField",
  id: "SwitchField",
  component: SwitchField,
  tags: ["autodocs", "status:verified", "level:molecules"],
  argTypes: {
    label: { control: "text", description: "The label beside the track" },
    description: { control: "text", description: "The second line under the label" },
    error: { control: "text", description: "Replaces the description and implies invalid" },
    checked: { control: "boolean", description: "Whether the switch is on" },
    disabled: { control: "boolean", description: "Whether the field is disabled" },
  },
  args: {
    name: "marketing",
    label: "Marketing emails",
    description: "Occasional offers and product news.",
  },
};

export default meta;
type Story = StoryObj<typeof SwitchField>;

const captionClass = "text-foreground-on-page-muted text-(length:--typography-font-size-body-s)";

export const Default: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="w-80">
        <SwitchField {...args} checked={checked} onCheckedChange={setChecked} />
      </div>
    );
  },
};

export const Checked: Story = {
  args: { checked: true },
  render: (args) => (
    <div className="w-80">
      <SwitchField {...args} />
    </div>
  ),
};

export const WithoutDescription: Story = {
  args: { description: undefined },
  render: (args) => (
    <div className="w-80">
      <SwitchField {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className="w-80">
      <SwitchField {...args} />
    </div>
  ),
};

export const WithError: Story = {
  args: { error: "Please enable this to continue." },
  render: (args) => (
    <div className="w-80">
      <SwitchField {...args} />
    </div>
  ),
};

/**
 * The combined story the visual suite photographs. A state that is not in this
 * column is covered by nothing.
 *
 * `w-80` rather than `w-full`: `preview.ts` centres the story, so a
 * shrink-wrapped root would let the host platform's font metrics decide the
 * width and the shot would not compare across machines.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      {(
        [
          ["Off", { name: "off" }],
          ["On", { name: "on", checked: true }],
          ["No description", { name: "bare", description: undefined }],
          ["Long label", { name: "long", label: "A label long enough to wrap onto a second line" }],
          ["Error", { name: "err", error: "Please enable this to continue." }],
          ["Disabled", { name: "off-disabled", disabled: true }],
          ["Disabled on", { name: "on-disabled", checked: true, disabled: true }],
        ] as const
      ).map(([caption, props]) => (
        <div key={caption} className="flex flex-col gap-2">
          <Label className={captionClass}>{caption}</Label>
          <SwitchField
            label="Marketing emails"
            description="Occasional offers and product news."
            {...props}
          />
        </div>
      ))}
    </div>
  ),
};
