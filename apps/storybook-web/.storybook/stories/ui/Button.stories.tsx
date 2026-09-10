import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowLeft, ArrowRight, Check, LampCeiling } from "lucide-react";
import { Button, type ButtonProps } from "@ui/web/Button";

const meta: Meta<typeof Button> = {
  title: "Verified/Atoms/Button",
  id: "Button",
  component: Button,
  tags: ["autodocs", "status:verified", "level:atoms"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "overlay", "ghost", "link"],
      description: "The visual variant of the button",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg", "xl"],
      description: "The size of the button",
    },
    icon: {
      control: "boolean",
      description:
        "Draws the icon-only shape — square, no padding — at whichever `size` is set. " +
        "Its own axis, so the variant and the size stay free. Needs an `aria-label`.",
    },
    as: {
      control: false,
      description:
        "Element or component to render, with that component's props. " +
        "In a brand app this is `components/Link`, not a bare anchor.",
    },
    isLoading: {
      control: "boolean",
      description: "Whether the button is loading",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

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

export const Overlay: Story = {
  args: {
    children: "Overlay Button",
    variant: "overlay",
  },
};

export const Link: Story = {
  args: {
    children: "Link Button",
    variant: "link",
  },
};

export const ExtraSmall: Story = {
  args: {
    children: "Extra Small Button",
    variant: "default",
    size: "xs",
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

export const ExtraLarge: Story = {
  args: {
    children: "Extra Large Button",
    variant: "default",
    size: "xl",
  },
};

export const Icon: Story = {
  args: {
    "aria-label": "Ceiling lamp",
    children: (
      <LampCeiling data-icon="inline-start" fill="none" stroke="currentColor" viewBox="0 0 24 24" />
    ),
    variant: "default",
    size: "default",
    icon: true,
  },
};

type WithIconsArgs = ButtonProps & {
  iconPlacement: "leading" | "trailing" | "both";
};

export const WithIcons: StoryObj<WithIconsArgs> = {
  argTypes: {
    iconPlacement: {
      control: "select",
      options: ["leading", "trailing", "both"],
      description: "Where to place icons relative to the label",
    },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    iconPlacement: "both",
  },
  render: ({ iconPlacement, children, ...args }) => (
    <Button {...args}>
      {iconPlacement === "leading" || iconPlacement === "both" ? (
        <ArrowLeft data-icon="inline-start" />
      ) : null}
      {children}
      {iconPlacement === "trailing" || iconPlacement === "both" ? (
        <ArrowRight data-icon="inline-end" />
      ) : null}
    </Button>
  ),
};

export const IconPlacements: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {(["xs", "sm", "default", "lg", "xl"] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-4">
          <Button size={size}>
            <ArrowLeft data-icon="inline-start" />
            Button
          </Button>
          <Button size={size}>
            Button
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button size={size}>
            <ArrowLeft data-icon="inline-start" />
            Button
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button size={size}>
            <ArrowRight data-icon="inline-start" />
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    variant: "default",
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    "aria-label": "Loading",
    variant: "default",
    size: "default",
    icon: true,
    isLoading: true,
  },
};

/**
 * `as` makes the root whatever was named, so the underline is decided by the
 * variant and not by the tag: an `<a>` rendered as a `default` button is not
 * underlined, and the `link` variant is — the same as it is with a `<button>`.
 *
 * The props of the element named go on the button itself, so there is no wrapper
 * to lose a `className` or a handler on the way in.
 */
export const AsLink: Story = {
  render: () => (
    <div className="flex w-96 flex-wrap items-center gap-4">
      <Button as="a" href="#link" variant="default">
        Button as Link
      </Button>
      <Button as="a" href="#link" variant="link">
        Link as Link
      </Button>
    </div>
  ),
};

export const VariantsGroup: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(
        ["default", "destructive", "outline", "secondary", "overlay", "ghost", "link"] as const
      ).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)}
        </Button>
      ))}
    </div>
  ),
};

const SIZES = ["xs", "sm", "default", "lg", "xl"] as const;

/**
 * The photographed one. `icon` is a second axis rather than a sixth size, so the
 * two rows are the same five sizes drawn twice — 24, 32, 40, 48 and 56px, as a
 * labelled button and as the square icon-only shape.
 */
export const SizesGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        {SIZES.map((size) => (
          <Button key={size} size={size}>
            {`${size.charAt(0).toUpperCase() + size.slice(1)} Size`}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {SIZES.map((size) => (
          <Button key={size} aria-label={`${size} icon`} icon size={size}>
            <Check />
          </Button>
        ))}
      </div>
    </div>
  ),
};
