import React from "react";
import { View, Image } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { AspectRatio } from "@ui/native/aspect-ratio";

const AspectRatioDemo = ({ ratio }: { ratio: number }) => (
  <View style={{ width: 300 }}>
    <AspectRatio ratio={ratio}>
      <Image
        source={{ uri: "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800" }}
        style={{ width: "100%", height: "100%", borderRadius: 8 }}
        resizeMode="cover"
      />
    </AspectRatio>
  </View>
);

const meta = {
  title: "UI/AspectRatio",
  component: AspectRatioDemo,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16, alignItems: "center" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof AspectRatioDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ratio16x9: Story = {
  args: {
    ratio: 16 / 9,
  },
};

export const Ratio4x3: Story = {
  args: {
    ratio: 4 / 3,
  },
};

export const Square: Story = {
  args: {
    ratio: 1,
  },
};
