import * as React from "react";

import { cn, createTestIdFor } from "@/lib/utils";

/**
 * The outer band. `mx-auto` does nothing until a caller gives the section a width
 * through `rootClassName`, which is where a page's max-width belongs — the design
 * system does not know how wide this product's content column is.
 *
 * No vertical margin. The design puts the block's 24px of vertical space inside the
 * surface, as padding, so the `margin: 16px auto` the source carried would sit on top
 * of it and make the gap under the app bar 40px where the design draws 24px.
 *
 * The consequence is that stacked `Page`s now touch: two of them read as 24px + 24px
 * of padding between their contents rather than a 16px gap between two cards. That is
 * the arrangement the design shows — one block per page — and a caller who wants the
 * cards separated adds the gap on the parent, where a `flex flex-col gap-*` puts it
 * once instead of every band carrying half of it.
 *
 * (The source also had a `margin-bottom: 16px` on the inner surface with a
 * `:nth-last-of-type(1) { margin-bottom: 0 }` beside it — dead code, since the surface
 * is its parent's only `<div>` and therefore always the last one, so the rule always
 * matched and the margin never applied.)
 *
 * `40vh` keeps a nearly-empty page from collapsing to a strip under the header, and it
 * is a `var()` with a default so a caller can say otherwise without fighting a class.
 */
const root = "mx-auto min-h-[var(--page-min-height,40vh)]";

/**
 * A header height is a property of the app, not of this component, so the offset is a
 * variable the consumer sets — on `:root`, on a layout wrapper, wherever their header
 * height is already known. The `0px` default makes an unset one stick to the top of
 * the viewport, which is wrong-looking but visibly wrong, rather than an invalid
 * `top` that silently degrades to no stickiness at all.
 */
const stickyRoot = "sticky top-[var(--page-sticky-top,0px)] z-2";

/**
 * The surface itself, padded the way the design pads a page block:
 *
 * |          | inline    | block |
 * | -------- | --------- | ----- |
 * | `< lg`   | 12px      | 24px  |
 * | `>= lg`  | 48px      | 24px  |
 *
 * Only the inline padding is responsive; 24px of block padding holds at every width.
 * The design draws the mobile block with **no** top padding, its search field sitting
 * flush under the app bar — that is a property of that one screen rather than of a page
 * block, so this uses 24px on both edges and stays symmetrical.
 *
 * The breakpoint comes from the design, not from the source. `DS App Templates` draws
 * exactly two device variants of every page — Desktop and Mobile — and the Mobile one
 * carries a `Max Width: 1023` variable, so the split the design intends is at 1024px:
 * `lg`. The app's own stylesheet split at `$sm: 933px`, which is on the same side of
 * both, and an earlier pass here used `md` (768px), which is on the wrong side of both
 * — a 900px tablet got the desktop padding the design gives to nothing under 1024.
 *
 * The responsive step is a variable rather than an `lg:px-12`, because `className` has
 * to be able to beat it. `cn()` resolves a conflict in favour of the last class it
 * sees, but only between classes in the same variant group: a caller's `px-0` beats a
 * bare `px-3` and leaves `lg:px-12` untouched, so the padding they asked to remove
 * comes back above 1024px. Moving the breakpoint into `--page-padding-inline` leaves
 * exactly one `px-*` for `px-0` to win against, at every width. `py-6` needs no such
 * treatment — it has no responsive twin to hide behind.
 *
 * The variable is plumbing, not a knob: both declarations sit on this element, so the
 * `lg:` one beats anything a caller sets on it. Override the padding with a `p-*` or
 * `px-*`, which is what the variable exists to make work.
 *
 * No radius and no shadow. Both came from a global Material `Paper` class in the
 * source, which is exactly the coupling this component exists to remove; the design
 * system has no `Page` node to take them from, so a caller who wants either adds it
 * through `className`.
 */
const content = `
  [--page-padding-inline:--spacing(3)]
  lg:[--page-padding-inline:--spacing(12)]
  bg-background-layout-surface
  text-foreground-on-surface-default
  px-(--page-padding-inline)
  py-6
`;

type PageProps = React.ComponentProps<"section"> & {
  rootClassName?: string;
  sticky?: boolean;
  "data-testid"?: string;
};

/**
 * A page section: a full-width band with a padded surface inside it.
 *
 * The surface carries 24px of vertical padding at every width and 12px of horizontal
 * padding, stepping up to 48px from `lg` (1024px) — the widths the design draws a page
 * block at. Stack several to build a page, or pass `sticky` to pin one below the app's
 * header.
 *
 * The band has no margin of its own, so stacked `Page`s touch. Space them from the
 * parent — `flex flex-col gap-6` — rather than by giving each band a margin.
 *
 * **`className` styles the surface, not the root.** That is inverted from every other
 * component here, and it is deliberate: this replaces a pair of app components whose
 * `className`/`rootClassName` split was already this way round at every call site, and
 * quietly swapping their meanings would move padding and backgrounds at each one. Use
 * `rootClassName` for the band — a max-width goes there.
 *
 * @param {React.ReactNode} [children] - The section's content, inside the surface
 * @param {string} [className] - Classes for the **surface**: its padding, its
 * background, a radius if you want one
 * @param {string} [rootClassName] - Classes for the **root** band: its width, its
 * margins, its position
 * @param {boolean} [sticky=false] - Pins the band, offset by `--page-sticky-top`
 * @param {string} [data-testid] - Names the root band, and derives `-content` for the
 * surface inside it
 *
 * @example
 * ```tsx
 * <Page rootClassName="max-w-5xl">
 *   <TypographyHeading as="h1" size="xs">Payment history</TypographyHeading>
 *   <Table />
 * </Page>
 *
 * // Pinned below a 64px header the app already knows the height of
 * <div style={{ "--page-sticky-top": "64px" }}>
 *   <Page sticky>{filters}</Page>
 * </div>
 * ```
 *
 * @cssVariables
 * Component:
 * - `--page-min-height` — the band's minimum height. Defaults to `40vh`
 * - `--page-sticky-top` — the offset a `sticky` band pins at. Defaults to `0px`
 *
 * The surface's padding is 24px vertically at every width, and 12px horizontally below
 * `lg` (1024px) / 48px above it — 1024px being the width the design splits its Desktop
 * and Mobile variants at. Change it with a `p-*` or `px-*` in `className`, not with the
 * `--page-padding-inline` variable behind it — that one is set on the element itself,
 * so the breakpoint's declaration wins over anything set there.
 *
 * Semantic colors:
 * - `--color-background-layout-surface`
 * - `--color-foreground-on-surface-default`
 */
function Page({ children, className, rootClassName, sticky = false, ...props }: PageProps) {
  // Read, not destructured: `...props` still carries it to the root.
  const testIdFor = createTestIdFor(props["data-testid"]);

  return (
    <section className={cn(root, sticky && stickyRoot, rootClassName)} {...props}>
      <div className={cn(content, className)} data-testid={testIdFor("content")}>
        {children}
      </div>
    </section>
  );
}

export { Page };
export type { PageProps };
