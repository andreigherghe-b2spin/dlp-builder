import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Avatar, AvatarImage, AvatarFallback } from "@ui/native/avatar";
import { TypographySmall } from "@ui/native/typography";

const AvatarDemo = ({ showImage, fallbackText }: { showImage: boolean; fallbackText: string }) => (
  <Avatar alt="User avatar">
    {showImage && <AvatarImage source={{ uri: "https://github.com/shadcn.png" }} />}
    <AvatarFallback>
      <TypographySmall>{fallbackText}</TypographySmall>
    </AvatarFallback>
  </Avatar>
);

const meta = {
  title: "UI/Avatar",
  component: AvatarDemo,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16, alignItems: "flex-start" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    fallbackText: "CN",
    showImage: true,
  },
} satisfies Meta<typeof AvatarDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {
    showImage: true,
  },
};

export const WithFallback: Story = {
  args: {
    showImage: false,
    fallbackText: "AB",
  },
};
