import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "@ui/web/Skeleton";
import { TypographyBody } from "@ui/web/Typography";

/**
 * Every sheet below is drawn in a box of this width rather than left to
 * shrink-wrap. A skeleton has no intrinsic size, so a story whose width comes
 * from its widest text run measures differently on macOS and on the Linux
 * runner — and Playwright refuses to compare two shots whose sizes disagree at
 * all.
 */
const SHEET_WIDTH = "w-90";

const meta: Meta<typeof Skeleton> = {
  title: "Needs Review/Atoms/Skeleton",
  id: "Skeleton",
  component: Skeleton,
  tags: ["autodocs", "status:needs-review", "level:atoms"],
  argTypes: {
    className: {
      control: "text",
      description:
        "Size, radius and anything else the shape needs. Not optional in practice — a Skeleton with no classes is a zero-height block.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

/** A labelled block, for the sheets that show several compositions at once. */
function Example({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <TypographyBody size="s" className="text-foreground-on-page-muted">
        {label}
      </TypographyBody>
      {children}
    </div>
  );
}

/**
 * Figma's `Text`: two lines and nothing else. This is the whole component — one
 * block, sized and shaped by the call site.
 */
export const Text: Story = {
  render: () => (
    <div className={`${SHEET_WIDTH} flex flex-col gap-2`}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  ),
};

/**
 * Figma's `Default`: an avatar beside two lines. The circle is the same block
 * with `rounded-full` on it — there is no `variant` prop, because the three
 * things the design sheet draws are three compositions rather than three
 * appearances.
 */
export const Default: Story = {
  render: () => (
    <div className={`${SHEET_WIDTH} flex items-center gap-4`}>
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  ),
};

/**
 * Figma's `Card`: a picture above two lines — the shape a game tile or a
 * promotion loads into.
 */
export const Card: Story = {
  render: () => (
    <div className="w-50 flex flex-col gap-4">
      <Skeleton className="rounded-base h-31 w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  ),
};

/**
 * The block reads on any ground because its fill is the theme's *inverse* at
 * 10% — it darkens a light brand and lightens a dark one without either being
 * named. Here it is over the page and over a surface.
 */
export const OnSurfaces: Story = {
  render: () => (
    <div className={`${SHEET_WIDTH} flex flex-col gap-4`}>
      <div className="bg-background-layout-page rounded-base flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="bg-background-layout-surface rounded-base flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  ),
};

/**
 * Recolour it with a class, not a variable. The old `--skeleton-background-color`
 * and `--skeleton-border-radius` are gone — they were never declared in any brand
 * file, so a skeleton had no colour at all unless a call site set one.
 * `className` is the replacement, and it wins because `cn()` puts it last.
 */
export const CustomColor: Story = {
  render: () => (
    <div className={`${SHEET_WIDTH} flex flex-col gap-2`}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="bg-background-brand-primary-container/40 h-4 w-full" />
      <Skeleton className="bg-background-layout-inverted/25 h-4 w-full" />
    </div>
  ),
};

/**
 * `animate-pulse` is the only motion here and it is Tailwind's, unchanged.
 * `animate-none` takes it off — for a print view, or for a test that would
 * rather not photograph a moving target.
 */
export const WithoutAnimation: Story = {
  render: () => (
    <div className={`${SHEET_WIDTH} flex flex-col gap-2`}>
      <Skeleton className="h-4 w-full animate-none" />
      <Skeleton className="h-4 w-2/3 animate-none" />
    </div>
  ),
};

/** The block with its animation off — what the photographed sheet is built from. */
function Still({ className }: { className: string }) {
  return <Skeleton className={`${className} animate-none`} />;
}

/**
 * The combined sheet, and the only story the visual suite photographs — Figma's
 * three compositions at once, plus the block over a surface. The animation is
 * what every other story draws; this one is about the fill, the radius and the
 * geometry.
 *
 * Every block here goes through `Still`, which adds `animate-none`:
 * `animate-pulse` has no resting frame, so a baseline of it would be a picture of
 * whichever point of the fade the shutter caught. It is folded into each block's
 * own `className` rather than set once on the sheet with `**:animate-none` —
 * both work, but the descendant variant wins by specificity, and a baseline is
 * not the place to depend on which of two rules the cascade happens to prefer.
 * `cn()` merging the two animation classes into one is a fact, not an ordering.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className={`${SHEET_WIDTH} flex flex-col gap-6`}>
      <Example label="Text">
        <div className="flex flex-col gap-2">
          <Still className="h-4 w-full" />
          <Still className="h-4 w-full" />
        </div>
      </Example>

      <Example label="Default">
        <div className="flex items-center gap-4">
          <Still className="size-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Still className="h-4 w-full" />
            <Still className="h-4 w-full" />
          </div>
        </div>
      </Example>

      <Example label="Card">
        <div className="w-50 flex flex-col gap-4">
          <Still className="rounded-base h-31 w-full" />
          <div className="flex flex-col gap-2">
            <Still className="h-4 w-full" />
            <Still className="h-4 w-full" />
          </div>
        </div>
      </Example>

      <Example label="On a surface">
        <div className="bg-background-layout-surface rounded-base flex flex-col gap-2 p-4">
          <Still className="h-4 w-full" />
          <Still className="h-4 w-2/3" />
        </div>
      </Example>
    </div>
  ),
};
