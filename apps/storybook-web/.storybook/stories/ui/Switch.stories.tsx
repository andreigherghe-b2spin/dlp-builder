import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "@ui/web/Label";
import { Switch } from "@ui/web/Switch";

const meta: Meta<typeof Switch> = {
  title: "Verified/Atoms/Switch",
  id: "Switch",
  component: Switch,
  tags: ["autodocs", "status:verified", "level:atoms"],
  argTypes: {
    checked: {
      control: "boolean",
      description: "Whether the switch is on",
    },
    disabled: {
      control: "boolean",
      description: "Whether the switch is disabled",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

const captionClass = "text-foreground-on-page-muted text-(length:--typography-font-size-body-s)";

export const Default: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return <Switch {...args} checked={checked} onCheckedChange={setChecked} />;
  },
};

export const Checked: Story = {
  args: { checked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { disabled: true, checked: true },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane mode</Label>
    </div>
  ),
};

/**
 * The combined story the visual suite photographs. Every state that matters
 * lives here — a state that is not in this grid is covered by nothing.
 *
 * The wrapper is `w-80` rather than `w-full`, because `preview.ts` centres the
 * story and a shrink-wrapped root would let the host platform's font metrics
 * decide the width.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      {(
        [
          ["Off", false],
          ["On", true],
        ] as const
      ).map(([status, checked]) => (
        <div key={status} className="flex flex-col gap-2">
          <Label className={captionClass}>{status}</Label>
          <div className="flex items-center gap-6">
            {(
              [
                ["Default", {}],
                ["Disabled", { disabled: true }],
              ] as const
            ).map(([state, props]) => (
              <div key={state} className="flex items-center gap-3">
                <Switch checked={checked} {...props} />
                <Label className={captionClass}>{state}</Label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <Label className={captionClass}>With label</Label>
        <div className="flex items-center gap-2">
          <Switch id="all-states-labelled" defaultChecked />
          <Label htmlFor="all-states-labelled">Airplane mode</Label>
        </div>
      </div>
    </div>
  ),
};
