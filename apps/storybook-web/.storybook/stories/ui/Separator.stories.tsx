import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "@ui/web/Separator";

const meta: Meta<typeof Separator> = {
  title: "Verified/Atoms/Separator",
  id: "Separator",
  component: Separator,
  tags: ["autodocs", "status:verified", "level:atoms"],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="flex w-40 flex-col gap-2 text-center text-xs font-semibold uppercase tracking-wide">
      <div>Above</div>
      <Separator orientation="horizontal" />
      <div>Below</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-40 items-center gap-2 text-center text-xs font-semibold uppercase tracking-wide">
      <div>Left</div>
      <Separator orientation="vertical" />
      <div>Right</div>
    </div>
  ),
};

/**
 * Both orientations on one canvas — this is the story the visual suite
 * photographs. The two above stay for the docs page.
 *
 * Each is shown twice, once flush and once inside a padded box, because the rule
 * takes its length from the parent: `w-full` horizontally and `h-full`
 * vertically. A separator that silently collapsed to zero in a parent with no
 * height would still pass a shot of the flush case alone.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-8 text-xs font-semibold uppercase tracking-wide">
      <div className="flex flex-col gap-2">
        <div>Horizontal</div>
        <Separator />
        <div>Spans the full width of its parent</div>
      </div>

      <div className="flex h-16 items-center gap-4">
        <div>Vertical</div>
        <Separator orientation="vertical" />
        <div>Takes its height from the row</div>
      </div>

      <div className="border-border-neutral-default flex flex-col gap-2 border p-4">
        <div>Inset</div>
        <Separator />
        <div className="flex h-12 items-center gap-4">
          <span>Inside padding</span>
          <Separator orientation="vertical" />
          <span>Both orientations</span>
        </div>
      </div>
    </div>
  ),
};
