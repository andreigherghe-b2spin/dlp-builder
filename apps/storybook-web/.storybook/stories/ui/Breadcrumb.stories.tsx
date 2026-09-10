import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  type BreadcrumbCrumb,
} from "@ui/web/Breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "Needs Review/Molecules/Breadcrumb",
  id: "Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  argTypes: {
    items: {
      control: "object",
      description:
        "The trail as data. The crumb without an `href` is the current page — that is the " +
        "whole way of saying it, there is no `isCurrent` flag to keep in step.",
    },
    maxItems: {
      control: { type: "number", min: 2 },
      description:
        "Most crumbs to draw before the middle folds into a `…` that opens a menu of what " +
        "it hid. Unset, the trail wraps instead.",
    },
    separator: {
      control: "text",
      description: "Custom mark between crumbs. Defaults to the dot Figma draws.",
    },
    linkAs: {
      control: false,
      description:
        "What every crumb renders as. Pass the app's `components/Link` — nothing in these " +
        "apps navigates through a bare `<a>`.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

const trail: BreadcrumbCrumb[] = [
  { label: "Home", href: "/" },
  { label: "Slots", href: "/slots" },
  { label: "Megaways", href: "/slots/megaways" },
  { label: "Book of Ra", href: "/slots/megaways/book-of-ra" },
  { label: "Paytable" },
];

/** Stands in for a brand `components/Link`: a component rather than a tag. */
function RouterLink({ prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
  return <a data-router={String(prefetch ?? false)} {...props} />;
}

/** The shape a page actually writes: an array in, a trail out. */
export const Default: Story = {
  args: { items: trail.slice(0, 3) },
};

/**
 * `maxItems` is the `Lenght=more links` state. The `…` is a real button — it
 * opens a menu of the crumbs it is standing in for, so nothing the trail hides
 * becomes unreachable.
 */
export const Collapsed: Story = {
  args: { items: trail, maxItems: 3 },
};

/**
 * What a brand app actually renders: every crumb through that app's own router
 * link. `RouterLink` stands in for `components/Link`, which resolves the locale,
 * starts the progress bar and handles external hrefs.
 */
export const ThroughARouterLink: Story = {
  render: (args) => <Breadcrumb {...args} />,
  args: { items: trail.slice(0, 3), linkAs: RouterLink },
};

/** Compose the parts when a crumb needs more than a label and an href. */
export const Composed: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/promotions">Promotions</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Weekend reload</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

/**
 * The one story the visual suite photographs — every length Figma draws, in one
 * shot, at a fixed width.
 *
 * `w-160` rather than `max-w-*`: `preview.ts` centres the story, so the root
 * shrink-wraps its content and a fluid width resolves to whatever the host
 * platform measures the longest label as. macOS and Linux disagree by enough
 * that Playwright refuses to compare the images at all.
 *
 * The collapsed row is here with its menu shut. The open menu is a portal and
 * gets its own spec entry, pointed at `Collapsed`.
 */
export const AllStates: Story = {
  render: () => (
    <div className="w-160 flex flex-col items-start gap-4">
      {[1, 2, 3, 4].map((length) => (
        <Breadcrumb key={length} items={[...trail.slice(0, length), { label: "Current page" }]} />
      ))}
      <Breadcrumb items={[...trail.slice(0, 4), { label: "Current page" }]} maxItems={2} />
    </div>
  ),
};
