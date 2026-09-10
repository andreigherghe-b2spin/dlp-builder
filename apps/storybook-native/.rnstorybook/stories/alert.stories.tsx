import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Alert, AlertTitle, AlertDescription } from "@ui/native/alert";
import { AlertCircleIcon, InfoIcon, LucideIcon } from "lucide-react-native";

const AlertDemo = ({
  icon,
  variant,
  title,
  description,
}: {
  icon: LucideIcon;
  variant?: "default" | "destructive";
  title: string;
  description: string;
}) => (
  <Alert variant={variant} icon={icon}>
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{description}</AlertDescription>
  </Alert>
);

const meta = {
  title: "UI/Alert",
  component: AlertDemo,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    title: "Heads up!",
    description: "You can add components to your app using the cli.",
    icon: InfoIcon,
  },
} satisfies Meta<typeof AlertDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    title: "Error",
    icon: AlertCircleIcon,
    description: "Your session has expired. Please log in again.",
  },
};
