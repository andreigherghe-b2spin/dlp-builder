import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "@ui/web/Checkbox";
import { Label } from "@ui/web/Label";

const meta: Meta<typeof Label> = {
  title: "Verified/Atoms/Label",
  id: "Label",
  component: Label,
  tags: ["autodocs", "status:verified", "level:atoms"],
  argTypes: {
    children: { control: "text" },
    className: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms" {...args}>
        {args.children || "Accept terms and conditions"}
      </Label>
    </div>
  ),
};

export const CustomText: Story = {
  args: {
    children: "Subscribe to newsletter",
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="newsletter" />
      <Label htmlFor="newsletter" {...args} />
    </div>
  ),
};

/**
 * Disabled through `peer-disabled`: the label reads the state off the control
 * next to it, which works because the control precedes it and carries `peer`.
 */
export const Disabled: Story = {
  args: {
    children: "Disabled option",
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled" disabled />
      <Label htmlFor="disabled" {...args} />
    </div>
  ),
};

/**
 * The other way round: when the label is not a DOM sibling of its control —
 * a field with the label on its own row, which is how `TextField` is built —
 * the state comes from a `group` ancestor marked `data-disabled`.
 */
export const DisabledThroughGroup: Story = {
  args: {
    children: "Disabled option",
  },
  render: (args) => (
    <div className="group flex flex-col gap-2" data-disabled={true}>
      <Label htmlFor="grouped" {...args} />
      <div className="flex items-center space-x-2">
        <Checkbox id="grouped" disabled />
        <span className="text-foreground-state-disabled text-(length:--typography-font-size-body-s)">
          The control is a level down, so `peer-disabled` cannot reach it.
        </span>
      </div>
    </div>
  ),
};

/** A required field marks itself with `Foreground/Feedback/Negative`. */
export const Required: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="required" />
      <Label htmlFor="required">
        Accept terms and conditions <span className="text-foreground-feedback-negative">*</span>
      </Label>
    </div>
  ),
};

/**
 * Every state on one canvas — this is the story the visual suite photographs.
 * The single-state stories above stay for the docs page and for working on one
 * case in isolation; adding a state here is what puts it under test.
 *
 * Both disabled routes are present on purpose: they reach the label through
 * different CSS, `peer-disabled` from a sibling control and
 * `group-data-[disabled]` from an ancestor, so one passing says nothing about
 * the other.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <div className="flex items-center space-x-2">
        <Checkbox id="all-default" />
        <Label htmlFor="all-default">Accept terms and conditions</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="all-required" />
        <Label htmlFor="all-required">
          Accept terms and conditions <span className="text-foreground-feedback-negative">*</span>
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="all-disabled" disabled />
        <Label htmlFor="all-disabled">Disabled through peer</Label>
      </div>

      <div className="group flex flex-col gap-2" data-disabled={true}>
        <Label htmlFor="all-grouped">Disabled through group</Label>
        <div className="flex items-center space-x-2">
          <Checkbox id="all-grouped" disabled />
          <span className="text-foreground-state-disabled text-(length:--typography-font-size-body-s)">
            The control is a level down, so `peer-disabled` cannot reach it.
          </span>
        </div>
      </div>
    </div>
  ),
};
