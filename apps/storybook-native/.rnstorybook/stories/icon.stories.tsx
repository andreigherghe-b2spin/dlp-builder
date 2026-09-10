import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Icon } from "@ui/native/icon";
import { Star, Heart, Home, Settings, ArrowRight, Check, X } from "lucide-react-native";

const IconDemo = ({ size }: { size: number }) => (
  <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
    <Icon as={Star} size={size} />
    <Icon as={Heart} size={size} />
    <Icon as={Home} size={size} />
    <Icon as={Settings} size={size} />
    <Icon as={ArrowRight} size={size} />
    <Icon as={Check} size={size} />
    <Icon as={X} size={size} />
  </View>
);

const meta = {
  title: "UI/Icon",
  component: IconDemo,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    size: 24,
  },
} satisfies Meta<typeof IconDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 24,
  },
};

export const Large: Story = {
  args: {
    size: 40,
  },
};

export const Small: Story = {
  args: {
    size: 16,
  },
};
