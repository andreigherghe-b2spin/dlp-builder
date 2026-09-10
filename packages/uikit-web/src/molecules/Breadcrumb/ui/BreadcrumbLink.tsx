import type { ElementType } from "react";

import { Link, type LinkProps } from "@/atoms/Link";
import { cn } from "@/lib/utils";

// A crumb, in its two states, and both of them are `Link`.
//
// Figma points a crumb at `Button / Variant=Link, Size=default`, which is the
// older of two nodes that draw the same thing — the `Link` component set
// (3370:17133) is the one with a design of its own now, and every pixel the
// crumb needs is already in it: `Label - Underline/Large/Bold` is `Link`'s own
// default, and the 8px either side is `crumbBox` below. What settled it is not
// the pixels anyway but the element: a crumb has to be the brand's
// `components/Link` rather than an `<a>`, which is a question about which
// component renders, not about which classes it wears — and `Link` takes `as`.
//
// Everything `Link` gained from that node arrives here without a line of code:
// hover and focus drop the underline, `active` puts it back, and a followed
// crumb goes muted through `:visited`. A change to how a crumb looks belongs in
// `Link`, not here.
//
// The current page is the same `Link` with `aria-current="page"` on it, and
// nothing else. It used to be a `<span role="link" aria-disabled>` carrying a
// hand-written `labelVariants()` call — shadcn's shape, and a fake on both
// counts: it announced a link the user could not follow, and it restated the
// type scale in a second place. `aria-current` is the real attribute for "you
// are here", `Link` styles it, and the element underneath is honestly a span,
// because the last rung of a trail is not somewhere to go.

/**
 * The 8px either side of a crumb — Figma's, and the crumb's hit area rather than
 * the link's. It belongs here rather than in `Link`, because a link inside a
 * paragraph must not carry padding.
 */
const crumbBox = "px-2";

/**
 * An interactive crumb — a place the trail can go back to.
 *
 * Renders an `<a>` by default and whatever `as` names otherwise, which in a
 * brand app is that app's `components/Link`:
 *
 * ```tsx
 * <BreadcrumbLink as={BrandLink} href="/slots">Slots</BreadcrumbLink>
 * ```
 *
 * - @param {ElementType} [as='a'] - Element or component to render, with that component's props
 * - @param {string} [className] - Additional CSS classes
 */
function BreadcrumbLink<T extends ElementType = "a">({ className, ...props }: LinkProps<T>) {
  return <Link className={cn(crumbBox, className)} {...(props as LinkProps<T>)} />;
}

/**
 * The crumb the user is on: the same [Link](../../../atoms/Link.tsx) as every
 * other crumb, marked `aria-current="page"` and rendered as a `<span>` because
 * it leads nowhere.
 *
 * The mark is what does the work in both directions — a screen reader announces
 * it as the current page, and `Link` reads the same attribute for the muted,
 * un-underlined treatment Figma draws. There is no way to style one without the
 * other, which is the point.
 *
 * A crumb that *should* still be followable while being the current page is a
 * `BreadcrumbLink aria-current="page"` — same tone, real href.
 *
 * - @param {('xl' | 'l' | 'm' | 's')} [size='l'] - Design size, from the Label scale
 * - @param {('regular' | 'medium' | 'semibold' | 'bold')} [weight='regular'] - Defaults to `regular`, against the link's `bold`
 * - @param {string} [className] - Additional CSS classes
 * - @param {LinkProps<'span'>} props - Props for the span element
 */
function BreadcrumbPage({ className, ...props }: Omit<LinkProps<"span">, "as">) {
  return (
    <Link
      as="span"
      weight="regular"
      underline={false}
      aria-current="page"
      className={cn(crumbBox, className)}
      {...props}
    />
  );
}

export { BreadcrumbLink, BreadcrumbPage };
