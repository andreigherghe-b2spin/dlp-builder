import type { Meta, StoryObj } from "@storybook/react-vite";

import { AspectRatio } from "@ui/web/AspectRatio";
import { TypographyLabel } from "@ui/web/Typography";

const meta: Meta<typeof AspectRatio> = {
  title: "Verified/Atoms/AspectRatio",
  id: "AspectRatio",
  component: AspectRatio,
  tags: ["autodocs", "status:verified", "level:atoms"],
  argTypes: {
    ratio: {
      control: { type: "number" },
      description: "Width divided by height — 16 / 9, 1, 2 / 3",
    },
  },
};

export default meta;

type Story = StoryObj<typeof AspectRatio>;

const RATIOS = [
  { label: "1:1", ratio: 1, src: "/placeholders/1-1.svg" },
  { label: "4:3", ratio: 4 / 3, src: "/placeholders/4-3.svg" },
  { label: "16:9", ratio: 16 / 9, src: "/placeholders/16-9.svg" },
  { label: "2:3", ratio: 2 / 3, src: "/placeholders/2-3.svg" },
  { label: "21:9", ratio: 21 / 9, src: "/placeholders/21-9.svg" },
  { label: "7:4", ratio: 7 / 4, src: "/placeholders/7-4.svg" },
];

/**
 * The one story the visual suite photographs. Every ratio the kit is used at, in
 * one shot, so a change to the box shows up here rather than in six separate
 * navigations.
 *
 * `w-160` on the grid rather than `w-full`: `preview.ts` centres the story, so a
 * shrink-wrapped root would take its width from the widest text run and measure
 * differently on macOS and Linux — and Playwright refuses to compare pixels at
 * all once the two sizes disagree.
 */
export const AllRatios: Story = {
  render: () => (
    <div className="w-160 grid grid-cols-3 gap-4">
      {RATIOS.map(({ label, ratio, src }) => (
        <div key={label} className="flex flex-col gap-2">
          <TypographyLabel size="s">{label}</TypographyLabel>
          <AspectRatio ratio={ratio} className="rounded-offset8">
            <img src={src} alt="" className="size-full object-cover" />
          </AspectRatio>
        </div>
      ))}
    </div>
  ),
};

export const Default: Story = {
  args: { ratio: 16 / 9 },
  render: (args) => (
    <div className="w-100">
      <AspectRatio {...args}>
        <img src="/placeholders/16-9.svg" alt="" className="size-full object-cover" />
      </AspectRatio>
    </div>
  ),
};

/**
 * The radius goes on the ratio box, not on a wrapper: the component clips its
 * content, so one class rounds the image with it.
 */
export const Rounded: Story = {
  args: { ratio: 16 / 9 },
  render: (args) => (
    <div className="w-100">
      <AspectRatio {...args} className="rounded-offset16">
        <img src="/placeholders/16-9.svg" alt="" className="size-full object-cover" />
      </AspectRatio>
    </div>
  ),
};

/**
 * Anything can go in the box, not only an image — the point is that the height
 * follows the width rather than the content.
 */
export const NonImageContent: Story = {
  args: { ratio: 16 / 9 },
  render: (args) => (
    <div className="w-125">
      <AspectRatio
        {...args}
        className="bg-background-layout-surface-variant1 rounded-offset8 flex items-center justify-center"
      >
        <TypographyLabel className="text-foreground-on-surface-muted">
          A video player, a map, a game frame
        </TypographyLabel>
      </AspectRatio>
    </div>
  ),
};
