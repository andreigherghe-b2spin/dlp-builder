import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "@ui/web/Label";
import { RadioGroup, RadioGroupItem } from "@ui/web/RadioGroup";

const meta: Meta<typeof RadioGroup> = {
  title: "WIP/Molecules/RadioGroup",
  id: "RadioGroup",
  component: RadioGroup,
  tags: ["autodocs", "status:wip", "level:molecules"],
  argTypes: {
    defaultValue: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: (args) => (
    <RadioGroup {...args}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </RadioGroup>
  ),
  args: {
    defaultValue: "comfortable",
  },
};

export const WithInitialValue: Story = {
  render: (args) => (
    <RadioGroup {...args}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="small" id="size-small" />
        <Label htmlFor="size-small">Small</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="medium" id="size-medium" />
        <Label htmlFor="size-medium">Medium</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="large" id="size-large" />
        <Label htmlFor="size-large">Large</Label>
      </div>
    </RadioGroup>
  ),
  args: {
    defaultValue: "medium",
  },
};

export const Disabled: Story = {
  render: (args) => (
    <RadioGroup {...args}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="d1" disabled />
        <Label htmlFor="d1">Disabled Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="d2" />
        <Label htmlFor="d2">Active Option 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="d3" disabled />
        <Label htmlFor="d3">Disabled Option 3</Label>
      </div>
    </RadioGroup>
  ),
  args: {
    defaultValue: "option2",
  },
};

export const Vertical: Story = {
  render: (args) => (
    <RadioGroup {...args} className="grid gap-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="red" id="color-red" />
        <Label htmlFor="color-red">Red</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="blue" id="color-blue" />
        <Label htmlFor="color-blue">Blue</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="green" id="color-green" />
        <Label htmlFor="color-green">Green</Label>
      </div>
    </RadioGroup>
  ),
  args: {
    defaultValue: "blue",
  },
};

export const WithForm: Story = {
  render: () => (
    <form className="space-y-4">
      <fieldset>
        <legend className="mb-2 block text-sm font-medium">Notification Preferences</legend>
        <RadioGroup defaultValue="email">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="email" id="notify-email" />
            <Label htmlFor="notify-email">Email</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sms" id="notify-sms" />
            <Label htmlFor="notify-sms">SMS</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="push" id="notify-push" />
            <Label htmlFor="notify-push">Push Notification</Label>
          </div>
        </RadioGroup>
      </fieldset>
    </form>
  ),
};
