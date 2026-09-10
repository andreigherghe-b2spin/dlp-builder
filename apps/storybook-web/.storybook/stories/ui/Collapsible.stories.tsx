import { useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { HouseIcon } from "lucide-react";

import { Badge } from "@ui/web/Badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  CollapsibleLabel,
  CollapsibleToggle,
  CollapsibleTrigger,
} from "@ui/web/Collapsible";
import { TypographyBody } from "@ui/web/Typography";

const meta: Meta<typeof Collapsible> = {
  title: "Needs Review/Molecules/Collapsible",
  id: "Collapsible",
  component: Collapsible,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["default", "large"],
      description:
        "Which of Figma's two sizes to draw. It also decides which parts you compose: " +
        "`default` makes the whole row the button (`CollapsibleTrigger`), `large` makes " +
        "an inert row (`CollapsibleHeader`) with a 40×40 `CollapsibleToggle` in it.",
    },
    open: { control: "boolean", description: "Expanded, when controlled" },
    defaultOpen: { control: "boolean", description: "Expanded on mount, when uncontrolled" },
    disabled: {
      control: "boolean",
      description: "Turns the disclosure off and fades the row",
    },
    className: { control: "text", description: "Classes for the shell. A width goes here" },
  },
};

export default meta;

type Story = StoryObj<typeof Collapsible>;

/**
 * Figma's own `.Placeholder` block (`924:6199`): `background/layout/page`, 40px tall,
 * `radius/base`, its two lines centred.
 *
 * The stories fill the panel with this rather than with prose so that a design review
 * can put Storybook and the Figma frame side by side and be comparing the component
 * rather than the filler — the panel is most of what an open collapsible shows, and two
 * lines of text against Figma's two solid blocks reads as a different component even
 * when every measurement matches.
 *
 * A fixed height also keeps the combined story's box from moving between platforms,
 * which wrapping text would not.
 */
function Placeholder() {
  return (
    <div className="bg-background-layout-page rounded-base flex h-10 w-full flex-col items-center justify-center">
      <TypographyBody size="m" weight="bold" className="text-foreground-on-page-default">
        Placeholder
      </TypographyBody>
      <TypographyBody size="s" className="text-foreground-on-page-default">
        (swap it with your content)
      </TypographyBody>
    </div>
  );
}

/** Figma draws two of them in every expanded variant. */
function PanelRows() {
  return (
    <>
      <Placeholder />
      <Placeholder />
    </>
  );
}

function Compact({
  label = "Order #4189",
  badge = "New",
  selected,
  ...props
}: ComponentProps<typeof Collapsible> & { label?: string; badge?: string; selected?: boolean }) {
  return (
    <Collapsible {...props}>
      <CollapsibleTrigger selected={selected}>
        <HouseIcon aria-hidden />
        <CollapsibleLabel>{label}</CollapsibleLabel>
        {badge ? <Badge>{badge}</Badge> : null}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <PanelRows />
      </CollapsibleContent>
    </Collapsible>
  );
}

function Large({
  label = "Recent activity",
  badge = "3",
  ...props
}: ComponentProps<typeof Collapsible> & { label?: string; badge?: string }) {
  return (
    <Collapsible size="large" {...props}>
      <CollapsibleHeader>
        <HouseIcon aria-hidden />
        <CollapsibleLabel>{label}</CollapsibleLabel>
        {badge ? <Badge>{badge}</Badge> : null}
        {/* No `aria-label`: the toggle names itself from the `CollapsibleLabel` above,
            so the title is written once rather than once as text and once as a string
            somebody has to remember to translate alongside it. */}
        <CollapsibleToggle />
      </CollapsibleHeader>
      <CollapsibleContent>
        <PanelRows />
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * The compact size, where the whole row is the button.
 */
export const Default: Story = {
  render: () => <Compact className="w-96" />,
};

/**
 * The large size. The row is inert, so the badge beside the label could just as well be
 * a menu or a second control — only the 40×40 toggle opens the panel.
 */
export const LargeSize: Story = {
  name: "Large",
  render: () => <Large className="w-96" />,
};

/**
 * `selected` marks the current row in a list. It is orthogonal to `open`: a row can be
 * the selected one whether or not its panel is showing.
 */
export const Selected: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-2">
      <Compact label="Order #4188" badge="" />
      <Compact label="Order #4189" badge="" selected />
      <Compact label="Order #4190" badge="" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-4">
      <Compact disabled />
      <Large disabled />
    </div>
  ),
};

/**
 * Controlled from outside, which is how a page opens one section and closes the rest.
 */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [open, setOpen] = useState<string | null>("shipping");

    return (
      <div className="flex w-96 flex-col gap-2">
        {[
          { id: "shipping", label: "Shipping address" },
          { id: "billing", label: "Billing address" },
        ].map(({ id, label }) => (
          <Compact
            key={id}
            label={label}
            badge=""
            open={open === id}
            onOpenChange={(next) => setOpen(next ? id : null)}
          />
        ))}
      </div>
    );
  },
};

/**
 * Every state the design draws that a still frame can hold, in one shot — this is the
 * only story the visual suite photographs. Hover, pressed and focus are left out
 * because a screenshot cannot hold them; adding a state here is what puts it under test.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-4">
      <Compact label="Compact, closed" badge="New" />
      <Compact label="Compact, open" badge="New" defaultOpen />
      <Compact label="Compact, selected" badge="" selected />
      <Compact label="Compact, disabled" badge="New" disabled />
      <Large label="Large, closed" badge="3" />
      <Large label="Large, open" badge="3" defaultOpen />
      <Large label="Large, disabled" badge="3" disabled />
    </div>
  ),
};
