import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Switch } from "@ui/native/switch";

const SwitchWithState = ({ disabled }: { disabled?: boolean }) => {
  const [checked, setChecked] = React.useState(false);
  return <Switch checked={checked} onCheckedChange={setChecked} disabled={disabled} />;
};

const meta = {
  title: "UI/Switch",
  component: SwitchWithState,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16, alignItems: "flex-start" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof SwitchWithState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
