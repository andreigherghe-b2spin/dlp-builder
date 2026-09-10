import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Checkbox } from "@ui/native/checkbox";

const CheckboxWithState = (props: { disabled?: boolean }) => {
  const [checked, setChecked] = React.useState(false);
  return <Checkbox checked={checked} onCheckedChange={setChecked} disabled={props.disabled} />;
};

const meta = {
  title: "UI/Checkbox",
  component: CheckboxWithState,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16, alignItems: "flex-start" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof CheckboxWithState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
