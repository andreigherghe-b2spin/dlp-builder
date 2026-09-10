import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, AvatarFallback, AvatarImage } from "@ui/web/Avatar";
const meta: Meta<typeof Avatar> = {
  title: "WIP/Atoms/Avatar",
  id: "Avatar",
  component: Avatar,
  tags: ["autodocs", "status:wip", "level:atoms"],
  // Define args that will be passed to all stories
  args: {
    className: "",
  },
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

// Default story
export const Default: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="/placeholders/1-1.svg" alt="User avatar" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

// Large size story
export const Large: Story = {
  render: (args) => (
    <Avatar {...args} className="size-16">
      <AvatarImage src="/placeholders/1-1.svg" alt="User avatar" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};
