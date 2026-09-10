import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Separator } from "@ui/native/separator";
import { TypographyP } from "@ui/native/typography";

const SeparatorHorizontalDemo = () => (
  <View>
    <TypographyP>Above the separator</TypographyP>
    <Separator orientation="horizontal" />
    <TypographyP>Below the separator</TypographyP>
  </View>
);

const SeparatorVerticalDemo = () => (
  <View style={{ flexDirection: "row", alignItems: "center", height: 40, gap: 8 }}>
    <TypographyP>Left</TypographyP>
    <Separator orientation="vertical" />
    <TypographyP>Right</TypographyP>
  </View>
);

const meta = {
  title: "UI/Separator",
  component: SeparatorHorizontalDemo,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof SeparatorHorizontalDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  render: () => <SeparatorVerticalDemo />,
};
