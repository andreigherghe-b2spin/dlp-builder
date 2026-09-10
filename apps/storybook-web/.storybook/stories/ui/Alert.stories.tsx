import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertCircleIcon, InfoIcon, PopcornIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@ui/web/Alert";

const meta: Meta<typeof Alert> = {
  title: "WIP/Molecules/Alert",
  id: "Alert",
  component: Alert,
  tags: ["autodocs", "status:wip", "level:molecules"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
      description: "The visual style of the alert",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <InfoIcon />
      <AlertTitle>Default Alert</AlertTitle>
      <AlertDescription>This is a standard alert with a title and description.</AlertDescription>
    </Alert>
  ),
  args: {
    variant: "default",
    className: "w-100",
  },
};

export const Destructive: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>A critical error has occurred. Please try again later.</AlertDescription>
    </Alert>
  ),
  args: {
    variant: "destructive",
    className: "w-100",
  },
};

export const WithoutIcon: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>This alert provides helpful information to the user.</AlertDescription>
    </Alert>
  ),
  args: {
    variant: "default",
    className: "w-100",
  },
};

export const WithoutTitle: Story = {
  render: (args) => (
    <Alert {...args}>
      <PopcornIcon />
      <AlertTitle>This Alert has a title and an icon. No description.</AlertTitle>
    </Alert>
  ),
  args: {
    variant: "default",
    className: "w-100",
  },
};
