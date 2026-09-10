import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDownIcon, HeartIcon } from "lucide-react";

import { SplitButton } from "@ui/web/SplitButton";
import { TypographyBody } from "@ui/web/Typography";

const VARIANTS = ["default", "secondary", "destructive", "outline", "overlay", "ghost"] as const;

const SIZES = ["xs", "sm", "default", "lg", "xl"] as const;

const meta: Meta<typeof SplitButton> = {
  title: "Needs Review/Atoms/SplitButton",
  id: "SplitButton",
  component: SplitButton,
  tags: ["autodocs", "status:needs-review", "level:atoms"],
  argTypes: {
    actionLabel: {
      control: "text",
      description:
        "The icon half's accessible name. **Required** — the half is icon-only and the " +
        "glyph is swappable, so there is no sane default to fall back to.",
    },
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description:
        "Shared by both halves. These are `Button`'s variants — `link` is excluded, " +
        "because it is not a box and has nothing for a seam to divide.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description:
        "`Button`'s size axis, unchanged: a 24, 32, 40, 48 or 56px tall control. Height, " +
        "type and glyph size all come from `Button` — only the label's padding is this " +
        "component's own.",
    },
    disabled: {
      control: "boolean",
      description:
        "Inerts **both** halves — the one state the design draws for the whole " +
        "control. A half can still be disabled on its own through its slot.",
    },
    slotProps: {
      control: false,
      description:
        "Per-half `<button>` props minus `children`: handlers, `disabled`, a " +
        "`className`, a `data-testid`. The label's slot also takes `asChild`.",
    },
    className: { control: "text", description: "Classes for the shell" },
  },
};

export default meta;

type Story = StoryObj<typeof SplitButton>;

/** A row label, so the combined story reads without hunting for which size is which. */
function Row({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <TypographyBody size="s" className="text-foreground-on-surface-muted">
        {title}
      </TypographyBody>
      {/*
        A grid rather than a wrapping flex row, and that is about the camera: `flex-wrap`
        breaks from the measured width of the text, so a label two pixels wider on Linux
        wraps there and the shot changes height — which Playwright refuses to compare at
        all. Three fixed columns hold six variants in two rows on every platform.
      */}
      <div className="grid grid-cols-3 items-center justify-items-start gap-3">{children}</div>
    </div>
  );
}

export const Default: Story = {
  args: {
    actionLabel: "Remove game",
    children: "Split Button",
    size: "default",
    variant: "default",
  },
};

/**
 * The reason this is not a `Button` with an icon in it: the two halves are two
 * controls. Hover one and the other stays put; tab and you stop on each in turn.
 */
export const TwoActions: Story = {
  render: function TwoActionsStory() {
    const [log, setLog] = useState<string | null>(null);

    return (
      <div className="flex w-96 flex-col items-start gap-3">
        <SplitButton
          actionLabel="Remove game"
          slotProps={{
            label: { onClick: () => setLog("opened the game") },
            action: { onClick: () => setLog("removed the game") },
          }}
        >
          Game name
        </SplitButton>
        <TypographyBody size="s" className="text-foreground-on-surface-muted">
          {log ?? "click either half"}
        </TypographyBody>
      </div>
    );
  },
};

/** `Button`'s five steps, by the same names and at the same heights. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {SIZES.map((size) => (
        <SplitButton key={size} actionLabel="Remove game" size={size}>
          {`Size ${size}`}
        </SplitButton>
      ))}
    </div>
  ),
};

/**
 * The story the visual suite photographs. Its width is a fixed `w-176` and its columns a
 * fixed three, not a wrapping row: `preview.ts` centres the story, so a shrink-wrapped
 * box would take its width from the widest text run in the host platform's font metrics —
 * which is how a shot comes out narrower on Linux and stops comparing at all.
 */
export const Variants: Story = {
  render: () => (
    <div className="w-176 grid grid-cols-3 items-center justify-items-start gap-3">
      {VARIANTS.map((variant) => (
        <SplitButton key={variant} actionLabel="Remove game" variant={variant}>
          {variant}
        </SplitButton>
      ))}
    </div>
  ),
};

/**
 * The label is often a link — that is the shape the brand apps' `Pill` had, and the
 * porting path for it. `asChild` is on the label's slot only; the action is icon-only
 * and has no element to hand over.
 */
export const LabelAsLink: Story = {
  render: () => (
    <SplitButton
      actionLabel="Remove from recent"
      variant="secondary"
      slotProps={{ label: { asChild: true } }}
    >
      <a href="#starburst">Starburst</a>
    </SplitButton>
  ),
};

/** Any glyph, not just the default `X`. */
export const OtherGlyphs: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <SplitButton actionLabel="Remove game">Game name</SplitButton>
      <SplitButton actionIcon={<ChevronDownIcon aria-hidden />} actionLabel="Show options">
        Show options
      </SplitButton>
      <SplitButton
        actionIcon={<HeartIcon aria-hidden />}
        actionLabel="Add to favourites"
        variant="secondary"
      >
        Starburst
      </SplitButton>
    </div>
  ),
};

/**
 * `disabled` on the root is the whole control; `disabled` in a slot is only that half,
 * which is what two independent actions means in practice.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <SplitButton actionLabel="Remove game" disabled>
        Both halves
      </SplitButton>
      <SplitButton actionLabel="Remove game" slotProps={{ action: { disabled: true } }}>
        Action only
      </SplitButton>
      <SplitButton actionLabel="Remove game" slotProps={{ label: { disabled: true } }}>
        Label only
      </SplitButton>
    </div>
  ),
};

/**
 * Every variant at every size, plus the disabled state — the whole sheet in one frame, for
 * reading against Figma. The camera points at `Variants` instead, so nothing here is under
 * test; hover, pressed and focus are left out because a still frame cannot hold them.
 *
 * The width is a fixed `w-176` and every label a fixed string: `preview.ts` centres the
 * story, so `w-full` would resolve to max-content and the host platform's font metrics
 * would decide the width — 80px narrower on Linux, and Playwright then refuses to
 * compare at all.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="w-176 flex flex-col gap-5">
      {SIZES.map((size) => (
        <Row key={size} title={`size="${size}"`}>
          {VARIANTS.map((variant) => (
            <SplitButton key={variant} actionLabel="Remove game" size={size} variant={variant}>
              {variant}
            </SplitButton>
          ))}
        </Row>
      ))}
      <Row title="disabled">
        {VARIANTS.map((variant) => (
          <SplitButton key={variant} actionLabel="Remove game" disabled variant={variant}>
            {variant}
          </SplitButton>
        ))}
      </Row>
    </div>
  ),
};
