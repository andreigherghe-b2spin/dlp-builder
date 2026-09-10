import { Button } from "@ui/native/button";
import { fn } from "storybook/test";
import { View } from "react-native";
import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";

const meta = {
  title: "UI/Button",
  component: Button,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16, alignItems: "flex-start" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "The visual variant of the button",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
      description: "The size of the button",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
  },
  args: { onPress: fn() },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Default Button",
    variant: "default",
    size: "default",
  },
};

export const Destructive: Story = {
  args: {
    children: "Destructive Button",
    variant: "destructive",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline Button",
    variant: "outline",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost Button",
    variant: "ghost",
  },
};

export const Link: Story = {
  args: {
    children: "Link Button",
    variant: "link",
  },
};

export const Small: Story = {
  args: {
    children: "Small Button",
    variant: "default",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    children: "Large Button",
    variant: "default",
    size: "lg",
  },
};

export const Icon: Story = {
  args: {
    children: "✓",
    variant: "default",
    size: "icon",
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    variant: "default",
    disabled: true,
  },
};

export const VariantsGroup: Story = {
  args: { children: "" },
  render: () => (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      {(["default", "destructive", "outline", "secondary", "ghost", "link"] as const).map(
        (variant) => (
          <Button key={variant} variant={variant}>
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </Button>
        ),
      )}
    </View>
  ),
};

export const SizesGroup: Story = {
  args: { children: "" },
  render: () => (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 16,
      }}
    >
      {(["sm", "default", "lg", "icon"] as const).map((size) => (
        <Button key={size} size={size}>
          {size === "icon" ? "✓" : `${size.charAt(0).toUpperCase() + size.slice(1)} Size`}
        </Button>
      ))}
    </View>
  ),
};
