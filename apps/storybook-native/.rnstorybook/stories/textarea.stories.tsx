import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Textarea } from "@ui/native/textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here...",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "This is some pre-filled content in the textarea.",
    numberOfLines: 4,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled textarea",
    editable: false,
  },
};
