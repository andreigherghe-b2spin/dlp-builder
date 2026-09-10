import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Badge } from "@ui/native/badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16, alignItems: "flex-start" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    children: "Badge",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    children: "Default",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Destructive",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};
