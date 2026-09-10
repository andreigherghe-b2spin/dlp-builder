import type { Meta, StoryObj } from "@storybook/react-vite";

import { Page } from "@ui/web/Page";
import { TypographyHeading } from "@ui/web/Typography";

const meta: Meta<typeof Page> = {
  title: "Needs Review/Molecules/Page",
  id: "Page",
  component: Page,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  argTypes: {
    className: {
      control: "text",
      description:
        "Classes for the **surface** — its padding, its background, a radius if you want " +
        "one. Inverted from the rest of the kit on purpose; see the component's notes.",
    },
    rootClassName: {
      control: "text",
      description: "Classes for the **root band** — its width, its margins, its position",
    },
    sticky: {
      control: "boolean",
      description: "Pins the band, offset by `--page-sticky-top`",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Page>;

const Heading = ({ children }: { children: React.ReactNode }) => (
  <TypographyHeading as="h2" size="xs">
    {children}
  </TypographyHeading>
);

const Body = () => (
  <p className="text-(length:--typography-font-size-body-m) font-(family-name:--typography-font-family)">
    The surface is padded 24px vertically at every width, and 12px horizontally below `lg` (1024px)
    / 48px above it. Override that with a `p-*` in `className`.
  </p>
);

/**
 * One band with one padded surface inside it. `--page-min-height` is trimmed here so
 * the story is not 40vh of empty space; a real page wants the default.
 */
export const Default: Story = {
  args: {
    children: <Body />,
    rootClassName: "w-140 [--page-min-height:0px]",
  },
};

/**
 * Stacked. The band carries no margin — the design puts a page block's 24px of vertical
 * space inside the surface — so consecutive pages touch unless the parent separates
 * them. Space them there, with one `gap-*`, rather than by giving every band a margin
 * and letting adjacent ones collapse into half a gap each.
 */
export const Stacked: Story = {
  render: () => (
    <div className="w-140 flex flex-col gap-6">
      {["First section", "Second section", "Third section"].map((title) => (
        <Page key={title} rootClassName="[--page-min-height:0px]">
          <Heading>{title}</Heading>
        </Page>
      ))}
    </div>
  ),
};

/** Without that gap the surfaces meet, reading as one block with a seam in it. */
export const Touching: Story = {
  render: () => (
    <div className="w-140">
      {["First section", "Second section"].map((title) => (
        <Page key={title} rootClassName="[--page-min-height:0px]">
          <Heading>{title}</Heading>
        </Page>
      ))}
    </div>
  ),
};

/**
 * `sticky` pins the band below whatever the app's header height is, which it reads from
 * `--page-sticky-top`. Scroll the frame to watch the first band hold at 24px while the
 * others pass under it.
 */
export const Sticky: Story = {
  render: () => (
    <div className="w-140 h-80 overflow-y-auto [--page-sticky-top:24px]">
      <Page rootClassName="[--page-min-height:0px]" sticky>
        <Heading>Pinned filters</Heading>
      </Page>
      {["Results", "More results", "Still more results"].map((title) => (
        <Page key={title} rootClassName="[--page-min-height:0px]">
          <Heading>{title}</Heading>
          <Body />
        </Page>
      ))}
    </div>
  ),
};

/** The surface's padding removed, which is what a full-bleed block inside a page needs. */
export const NoPadding: Story = {
  args: {
    children: <Body />,
    className: "p-0",
    rootClassName: "w-140 [--page-min-height:0px]",
  },
};

/**
 * Everything at once. This is the story the visual suite will photograph once the
 * component is promoted out of WIP.
 */
export const AllStates: Story = {
  render: () => (
    <div className="w-140 flex flex-col gap-8">
      <Page rootClassName="[--page-min-height:0px]">
        <Heading>Default surface</Heading>
        <Body />
      </Page>

      <Page className="p-0" rootClassName="[--page-min-height:0px]">
        <Heading>Padding removed</Heading>
      </Page>

      <div className="flex flex-col gap-6">
        {["Stacked one", "Stacked two"].map((title) => (
          <Page key={title} rootClassName="[--page-min-height:0px]">
            <Heading>{title}</Heading>
          </Page>
        ))}
      </div>

      <div>
        {["Touching one", "Touching two"].map((title) => (
          <Page key={title} rootClassName="[--page-min-height:0px]">
            <Heading>{title}</Heading>
          </Page>
        ))}
      </div>
    </div>
  ),
};
