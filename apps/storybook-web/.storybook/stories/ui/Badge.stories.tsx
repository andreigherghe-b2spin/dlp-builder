import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check } from "lucide-react";

import { Badge } from "@ui/web/Badge";

const VARIANTS = [
  "default",
  "secondary",
  "positive",
  "negative",
  "warning",
  "informative",
  "goldCoins",
  "sweepstakesCoins",
] as const;

const meta: Meta<typeof Badge> = {
  title: "Verified/Atoms/Badge",
  id: "Badge",
  component: Badge,
  tags: ["autodocs", "status:verified", "level:atoms"],
  argTypes: {
    variant: {
      control: "select",
      options: [...VARIANTS],
      description: "The semantic color of the badge",
    },
    shape: {
      control: "select",
      options: ["square", "round"],
      description: "`square` is the uppercase text badge; `round` is the counter pill",
    },
    as: {
      control: false,
      description: "Element or component to render, with that component's props",
    },
    children: {
      control: "text",
    },
  },
  args: {
    children: "Badge",
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { variant: "default", children: "Default" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
};

export const Positive: Story = {
  args: { variant: "positive", children: "Positive" },
};

export const Negative: Story = {
  args: { variant: "negative", children: "Negative" },
};

export const Warning: Story = {
  args: { variant: "warning", children: "Warning" },
};

export const Informative: Story = {
  args: { variant: "informative", children: "Informative" },
};

export const GoldCoins: Story = {
  args: { variant: "goldCoins", children: "Gold Coins" },
};

export const SweepstakesCoins: Story = {
  args: { variant: "sweepstakesCoins", children: "Sweepstakes Coins" },
};

export const Round: Story = {
  args: { variant: "default", shape: "round", children: "9" },
};

export const WithIcon: Story = {
  render: (args) => (
    <Badge {...args}>
      <Check aria-hidden="true" />
      Verified
    </Badge>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Badge as="a" href="#" onClick={(e: React.MouseEvent) => e.preventDefault()}>
      Link badge
    </Badge>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-6">
      <div className="grid grid-cols-3 justify-items-start gap-3">
        {VARIANTS.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-3 justify-items-start gap-3">
        {VARIANTS.map((variant) => (
          <Badge key={variant} variant={variant} shape="round">
            9
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-3 justify-items-start gap-3">
        {VARIANTS.map((variant) => (
          <Badge key={variant} variant={variant} shape="round">
            99
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-3 justify-items-start gap-3">
        <Badge>
          <Check aria-hidden="true" />
          icon
        </Badge>
        <Badge as="a" href="#" onClick={(e: React.MouseEvent) => e.preventDefault()}>
          link
        </Badge>
      </div>
    </div>
  ),
};
