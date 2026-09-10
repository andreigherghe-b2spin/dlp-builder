import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Input } from "@ui/native/input";

const meta = {
  title: "UI/Input",
  component: Input,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Type something...",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Hello world",
    placeholder: "Type something...",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    editable: false,
  },
};

export const Password: Story = {
  args: {
    placeholder: "Password",
    secureTextEntry: true,
  },
};
