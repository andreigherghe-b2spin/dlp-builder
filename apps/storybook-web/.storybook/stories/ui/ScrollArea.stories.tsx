import { Fragment } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScrollArea, ScrollBar } from "@ui/web/ScrollArea";
import { Separator } from "@ui/web/Separator";
import { TypographyBody, TypographyLabel } from "@ui/web/Typography";

const meta: Meta<typeof ScrollArea> = {
  title: "Verified/Atoms/ScrollArea",
  id: "ScrollArea",
  component: ScrollArea,
  tags: ["autodocs", "status:verified", "level:atoms"],
  argTypes: {
    type: {
      control: "select",
      options: ["auto", "always", "scroll", "hover"],
      description: "When the bars are drawn. `hover` is Radix's default",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const TAGS = Array.from({ length: 40 }, (_, index) => `v1.2.0-beta.${40 - index}`);

const TILES = Array.from({ length: 8 }, (_, index) => `Tile ${index + 1}`);

function TagList() {
  return (
    <div className="p-4">
      {TAGS.map((tag) => (
        <Fragment key={tag}>
          <TypographyBody size="s">{tag}</TypographyBody>
          <Separator className="my-2" />
        </Fragment>
      ))}
    </div>
  );
}

/**
 * The one story the visual suite photographs — both axes and both bars in a
 * single shot.
 *
 * `type="always"` throughout, and not only for the camera: Radix's default
 * reveals the bars on hover, so a screenshot of it is a screenshot of an empty
 * gutter. Every box below is given an explicit width and height, because a
 * scroll area with neither is just a `<div>`.
 */
export const AllStates: Story = {
  render: () => (
    <div className="w-180 flex flex-col gap-6">
      <div className="flex gap-6">
        <div className="flex flex-col gap-2">
          <TypographyLabel size="s">Vertical</TypographyLabel>
          <ScrollArea type="always" className="rounded-offset8 h-56 w-52">
            <TagList />
          </ScrollArea>
        </div>

        <div className="flex flex-col gap-2">
          <TypographyLabel size="s">Both axes</TypographyLabel>
          <ScrollArea type="always" className="rounded-offset8 h-56 w-64">
            <div className="grid w-max grid-cols-4 gap-3 p-4">
              {TILES.map((tile) => (
                <div
                  key={tile}
                  className="bg-background-layout-surface-variant1 rounded-base flex size-24 items-center justify-center"
                >
                  <TypographyLabel size="s">{tile}</TypographyLabel>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <TypographyLabel size="s">Horizontal</TypographyLabel>
        <ScrollArea type="always" className="rounded-offset8 w-180">
          <div className="flex w-max gap-3 p-4">
            {TILES.map((tile) => (
              <div
                key={tile}
                className="bg-background-layout-surface-variant1 rounded-base flex h-24 w-40 shrink-0 items-center justify-center"
              >
                <TypographyLabel size="s">{tile}</TypographyLabel>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  ),
};

export const Default: Story = {
  args: { type: "always" },
  render: (args) => (
    <ScrollArea {...args} className="rounded-offset8 h-72 w-52">
      <TagList />
    </ScrollArea>
  ),
};

/**
 * Radix's own default: the bars stay out of the way until the pointer is over the
 * box. Hover it to see them.
 */
export const RevealedOnHover: Story = {
  args: { type: "hover" },
  render: (args) => (
    <ScrollArea {...args} className="rounded-offset8 h-72 w-52">
      <TagList />
    </ScrollArea>
  ),
};

/**
 * The horizontal bar is composed in as the last child, and the content sets its
 * own width with `w-max` — the scroll area only supplies the window.
 */
export const Horizontal: Story = {
  render: () => (
    <ScrollArea type="always" className="rounded-offset8 w-150">
      <div className="flex w-max gap-3 p-4">
        {TILES.map((tile) => (
          <div
            key={tile}
            className="bg-background-layout-surface-variant1 rounded-base flex h-32 w-48 shrink-0 items-center justify-center"
          >
            <TypographyLabel size="s">{tile}</TypographyLabel>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

/**
 * Context is scoped by the tree, so the inner area names its own bars and the
 * outer one goes on naming its own — nothing has to keep track of the nesting.
 */
export const Nested: Story = {
  render: () => (
    <ScrollArea data-testid="outer" type="always" className="rounded-offset8 h-80 w-72">
      <div className="flex flex-col gap-4 p-4">
        <TypographyBody size="s">Outer content, above the inner box.</TypographyBody>

        <ScrollArea data-testid="inner" type="always" className="rounded-offset8 h-40 w-full">
          <TagList />
        </ScrollArea>

        <TypographyBody size="s">Outer content, below it.</TypographyBody>
        <TagList />
      </div>
    </ScrollArea>
  ),
};
