import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Link } from "@ui/web/Link";
import { TypographyBody } from "@ui/web/Typography";

/**
 * **No story here points a link at `href="#"`, and that is load-bearing.** `#`
 * resolves to the document's own URL, and Chrome styles a link to the page you
 * are already on as visited — so every `#` link would render in the muted
 * visited colour, in the docs page and in a baseline, for a reason nothing about
 * the story says. Real paths never match `:visited` in a fresh browser context,
 * which is what Playwright gives each test.
 */
const meta: Meta<typeof Link> = {
  title: "Needs Review/Atoms/Link",
  id: "Link",
  component: Link,
  tags: ["autodocs", "status:needs-review", "level:atoms"],
  argTypes: {
    as: {
      control: false,
      description:
        "Element or component to render. Pass the app's `components/Link` here — nothing in " +
        "these apps navigates through a bare `<a>`.",
    },
    size: { control: "inline-radio", options: ["xl", "l", "m", "s"] },
    weight: { control: "inline-radio", options: ["regular", "medium", "semibold", "bold"] },
    underline: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: { href: "/promotions", children: "Promotions" },
};

/**
 * Stands in for a brand `components/Link`: a component rather than a tag, taking
 * props an `<a>` does not have. `as` moves the element and nothing else — the
 * type and the tone stay the design system's.
 */
function RouterLink({ prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
  return <a data-router={String(prefetch ?? false)} {...props} />;
}

export const AsRouterLink: Story = {
  render: () => (
    <Link as={RouterLink} href="/slots" prefetch>
      Through the app's router
    </Link>
  ),
};

/**
 * A link inside running text keeps the paragraph's leading, not the label's —
 * and it has to be **the same step of the scale as the paragraph**, or it reads
 * as having slipped down the line even though its baseline is exact.
 *
 * The two scales line up name for name, so matching them is mechanical:
 *
 * ```
 * paragraph        link
 * TypographyBody l   16px   size="l"   ← the default, so pass nothing
 *                m   14px   size="m"
 *                s   12px   size="s"
 * ```
 *
 * This story used to pass `size="m" weight="medium"` into a `Body/L` paragraph —
 * 14px inside 16px. Baselines still coincided to the pixel; the link just looked
 * misaligned because the glyphs were smaller. Overriding the defaults was the
 * whole bug, which is the argument for leaving them alone.
 */
export const InRunningText: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-6">
      <TypographyBody>
        Wagering requirements apply to every bonus. See the{" "}
        <Link href="/terms">terms and conditions</Link> before you claim one.
      </TypographyBody>
      <TypographyBody size="m">
        A smaller paragraph takes a smaller link —{" "}
        <Link href="/terms" size="m">
          Body/M
        </Link>{" "}
        pairs with <code>size=&quot;m&quot;</code>, and the pairing is what keeps the line even.
      </TypographyBody>
    </div>
  ),
};

/**
 * The four sizes the design draws, read off the type style rather than off the
 * Figma variant label — the node's `Size=lg` and `Size=Default` are the same
 * 16px style, and its `sm` / `xs` are this scale's `m` / `s`.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex w-96 flex-col items-start gap-4">
      {(["xl", "l", "m", "s"] as const).map((size) => (
        <Link key={size} href={`/label/${size}`} size={size}>
          Label — Underline / {size}
        </Link>
      ))}
    </div>
  ),
};

/**
 * **The one state with nothing to photograph and no way to assert it.**
 * `:visited` is the browser reporting the user's own history, so there is no prop
 * to pass and nothing a test can read back — `getComputedStyle` returns the
 * unvisited colour by design, and browsers restrict the pseudo-class to colour
 * properties (which is all this state changes: muted, underline kept).
 *
 * Follow one of these links, come back, and it turns
 * `--color-foreground-on-surface-muted` while keeping its underline. That
 * underline is what separates it from the current page, which is muted *without*
 * one — visited means "you have been here", current means "you are here".
 */
export const Visited: Story = {
  render: () => (
    <div className="flex w-96 flex-col items-start gap-4">
      <Link href="https://example.com/one">Somewhere you may have been</Link>
      <Link as="span" aria-current="page">
        The page you are on
      </Link>
    </div>
  ),
};

/**
 * The story the visual suite photographs: every size, the weights and the
 * underline switch, the disabled tone and the current page, at a fixed width so
 * the shot is the same size on macOS and on Linux.
 *
 * Three of the design's five states are missing from it and cannot be added.
 * `Hover`, `Focus` and `Visited` are pseudo-classes — the helper photographs a
 * settled page with nothing focused and no pointer on it, and one shot cannot
 * hold a hovered link and an unhovered one anyway. `Focus` at least has a
 * keyboard path to it in the docs page; `Visited` has none, per the story above.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex w-96 flex-col items-start gap-4">
      {(["xl", "l", "m", "s"] as const).map((size) => (
        <Link key={size} href={`/label/${size}`} size={size}>
          Label — Underline / {size}
        </Link>
      ))}
      <Link href="/regular" weight="regular">
        Regular weight
      </Link>
      <Link href="/plain" underline={false}>
        No underline
      </Link>
      <Link href="/locked" aria-disabled>
        Disabled
      </Link>
      <Link as="span" aria-current="page">
        Current page
      </Link>
    </div>
  ),
};
