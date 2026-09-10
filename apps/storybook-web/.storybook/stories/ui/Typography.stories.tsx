import type { ComponentProps, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  TypographyBody,
  TypographyCaption,
  TypographyDisplay,
  TypographyHeading,
  TypographyLabel,
} from "@ui/web/Typography";

/**
 * One story per family, laid out the way the Figma Typography page is
 * (`🔴 DS Foundation`, node `114:56969`): every size, in every weight the design
 * draws it in, with the token behind it.
 *
 * The `Size` column shows both columns of the design where they differ. Which
 * one is live is decided by the viewport, not by anything in the code — the
 * brand files redeclare those tokens inside `@media (min-width: 1024px)`, so
 * under 1024px you are looking at the mobile scale and at or above it the
 * desktop one. Resize the preview and the specimen follows.
 */
const WEIGHTS = ["regular", "medium", "semibold", "bold"] as const;

/**
 * Sizes come from the components themselves rather than being retyped here, so
 * dropping a size from the design turns the stale specimen row into a type
 * error instead of leaving it to render silently at the default.
 */
type DisplaySize = NonNullable<ComponentProps<typeof TypographyDisplay>["size"]>;
type HeadingSize = NonNullable<ComponentProps<typeof TypographyHeading>["size"]>;
type BodySize = NonNullable<ComponentProps<typeof TypographyBody>["size"]>;
type LabelSize = NonNullable<ComponentProps<typeof TypographyLabel>["size"]>;

type Row<S extends string> = {
  size: S;
  token: string;
  mobile: number;
  desktop: number;
  leading: number;
};

function Specimen<S extends string>({
  family,
  rows,
  render,
}: {
  family: string;
  rows: Row<S>[];
  render: (row: Row<S>, weight: (typeof WEIGHTS)[number]) => ReactNode;
}) {
  return (
    <div className="text-foreground-on-page-default flex flex-col gap-10 p-8">
      <div className="flex flex-col gap-1">
        <TypographyHeading as="h2" size="l">
          {family}
        </TypographyHeading>
        <TypographyBody size="s" className="text-foreground-on-page-muted">
          Sizes marked <code>a → b</code> grow at 1024px. Resize the preview to swap between the
          mobile and desktop scales.
        </TypographyBody>
      </div>

      {rows.map((row) => (
        <div key={row.size} className="flex flex-col gap-3">
          <div className="border-border-neutral-default flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b pb-2">
            <TypographyLabel size="l" weight="bold">
              {family}/{row.size}
            </TypographyLabel>
            <TypographyBody size="s" className="text-foreground-on-page-muted">
              <code>{row.token}</code>
            </TypographyBody>
            <TypographyBody size="s" className="text-foreground-on-page-muted">
              {row.mobile === row.desktop ? `${row.mobile}px` : `${row.mobile} → ${row.desktop}px`}
            </TypographyBody>
            <TypographyBody size="s" className="text-foreground-on-page-muted">
              leading {row.leading}
            </TypographyBody>
          </div>

          {WEIGHTS.map((weight) => (
            <div key={weight} className="flex items-baseline gap-6">
              <TypographyLabel size="s" className="text-foreground-on-page-muted w-20 shrink-0">
                {weight}
              </TypographyLabel>
              {render(row, weight)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const meta: Meta<typeof TypographyBody> = {
  title: "Needs Review/Atoms/Typography",
  id: "Typography",
  // Kept so autodocs still renders the props table, but every story below is a
  // fixed specimen drawn with `render` — there are no args to steer, so the
  // Controls panel would offer knobs that do nothing.
  component: TypographyBody,
  tags: ["autodocs", "status:needs-review", "level:atoms"],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj<typeof meta>;

const DISPLAY_ROWS: Row<DisplaySize>[] = [
  { size: "xl", token: "display-xl", mobile: 56, desktop: 80, leading: 1.29 },
  { size: "l", token: "display-l", mobile: 48, desktop: 64, leading: 1.33 },
  { size: "m", token: "display-m", mobile: 40, desktop: 48, leading: 1.4 },
  { size: "s", token: "display-s", mobile: 36, desktop: 40, leading: 1.33 },
];

const HEADING_ROWS: Row<HeadingSize>[] = [
  { size: "xl", token: "heading-xl", mobile: 28, desktop: 32, leading: 1.43 },
  { size: "l", token: "heading-l", mobile: 24, desktop: 28, leading: 1.33 },
  { size: "m", token: "heading-m", mobile: 22, desktop: 24, leading: 1.45 },
  { size: "s", token: "heading-s", mobile: 20, desktop: 20, leading: 1.4 },
  { size: "xs", token: "heading-xs", mobile: 18, desktop: 18, leading: 1.56 },
];

const BODY_ROWS: Row<BodySize>[] = [
  { size: "l", token: "body-l", mobile: 16, desktop: 16, leading: 1.5 },
  { size: "m", token: "body-m", mobile: 14, desktop: 14, leading: 1.46 },
  { size: "s", token: "body-s", mobile: 12, desktop: 12, leading: 1.46 },
];

const LABEL_ROWS: Row<LabelSize>[] = [
  { size: "xl", token: "label-xl", mobile: 18, desktop: 18, leading: 1 },
  { size: "l", token: "label-l", mobile: 16, desktop: 16, leading: 1 },
  { size: "m", token: "label-m", mobile: 14, desktop: 14, leading: 1 },
  { size: "s", token: "label-s", mobile: 12, desktop: 12, leading: 1 },
];

export const Display: Story = {
  render: () => (
    <Specimen
      family="Display"
      rows={DISPLAY_ROWS}
      render={(row, weight) => (
        <TypographyDisplay size={row.size} weight={weight}>
          Display {row.size}
        </TypographyDisplay>
      )}
    />
  ),
};

export const Heading: Story = {
  render: () => (
    <Specimen
      family="Heading"
      rows={HEADING_ROWS}
      render={(row, weight) => (
        <TypographyHeading size={row.size} weight={weight}>
          The quick brown fox
        </TypographyHeading>
      )}
    />
  ),
};

export const Body: Story = {
  render: () => (
    <Specimen
      family="Body"
      rows={BODY_ROWS}
      render={(row, weight) => (
        <TypographyBody size={row.size} weight={weight}>
          The quick brown fox jumps over the lazy dog.
        </TypographyBody>
      )}
    />
  ),
};

export const Label: Story = {
  render: () => (
    <Specimen
      family="Label"
      rows={LABEL_ROWS}
      render={(row, weight) => (
        <TypographyLabel size={row.size} weight={weight}>
          The quick brown fox
        </TypographyLabel>
      )}
    />
  ),
};

export const Caption: Story = {
  render: () => (
    <div className="text-foreground-on-page-default flex flex-col gap-4 p-8">
      <TypographyHeading as="h2" size="l">
        Caption
      </TypographyHeading>
      <TypographyBody size="s" className="text-foreground-on-page-muted">
        <code>caption-m</code> · 10px · leading 1 · the design draws this one style only, always
        uppercase.
      </TypographyBody>
      <TypographyCaption>The quick brown fox</TypographyCaption>
    </div>
  ),
};

/**
 * `Label - Underline` is a family of its own in Figma; here it is a prop,
 * because nothing but the decoration changes.
 */
export const Underline: Story = {
  render: () => (
    <div className="text-foreground-on-page-default flex flex-col gap-4 p-8">
      <TypographyHeading as="h2" size="l">
        Underline
      </TypographyHeading>
      <TypographyLabel size="l" weight="bold" underline>
        Label, underlined
      </TypographyLabel>
      <TypographyBody underline>Body, underlined</TypographyBody>
    </div>
  ),
};

/**
 * The design names a style, not a heading level, so no component here picks one
 * for you — and the default element of `Display` and `Heading` is a `<div>`,
 * which leaves the text out of the document outline. `as` is how the semantics
 * get in: one prop, the tag and nothing else. The scale stays on `size`, because
 * how deep a heading sits is the page's decision and how big it is drawn is the
 * design's.
 *
 * It takes a component as readily as a tag — `as={Link}` for a router link —
 * which is what replaced `asChild` on these five. There is no `asChild` on
 * Typography any more.
 */
export const As: Story = {
  render: () => (
    <div className="text-foreground-on-page-default flex flex-col gap-4 p-8">
      <TypographyDisplay size="s" as="h1">
        Display s as h1
      </TypographyDisplay>
      <TypographyHeading size="l" as="h2">
        Heading l as h2
      </TypographyHeading>
      <TypographyHeading size="xs" as="h3">
        Heading xs as h3
      </TypographyHeading>
      <TypographyBody as="a" className="hover:opacity-50" href="#" underline>
        Body as a link
      </TypographyBody>
    </div>
  ),
};
