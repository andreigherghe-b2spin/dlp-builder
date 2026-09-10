"use client";

import type { ComponentProps, ElementType } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/atoms/Button";
import { labelVariants } from "@/atoms/Typography";
import { cn } from "@/lib/utils";

// Three clickables in the row, one implementation, and it is `Button`.
//
// Back and Next are the node Figma points at — `Button / Variant=Outline,
// State=Default, Size=sm` — so 32px tall, `px-3` dropping to `pl-2` when an icon
// leads, `gap-1` between icon and label, 16px icons and `Label/Medium/Bold` all
// arrive with the variant and none of it is restated here. The arrows are
// `ArrowLeft` / `ArrowRight` rather than the chevrons shadcn ships, because that
// is what the design draws.
//
// A page number is `Button variant="ghost" size="sm" icon`, which is already the
// 32px square with the hover wash, the pressed state, the focus ring and the
// disabled reset. Two things in Figma differ from a ghost button and only those
// two are overridden below: the radius is `Radius/comfortable` rather than the
// button's pill, and the type is `Label/Small/Medium` rather than 14px bold. The
// brand apps agree — `apps/platform/src/components/Pagination/styles.module.scss`
// draws the same 32px square at `calc(var(--radius-sm) * 2)`, which is the same
// 8px — so this is the design being specific, not the component drifting.
//
// What all three share is *which element they render*, and that is the only
// thing `PaginationButton` exists to say once. It used to be spelled three
// times, plus a `direction` prop threading Back and Next through one body to
// save eight lines; now the shared half is the element and the per-control half
// is written out, which is the way round that reads.

/**
 * What a page number keeps from Figma that a ghost button does not have. The
 * selected wash is keyed on `aria-current`, so what a screen reader announces and
 * what the eye sees cannot disagree.
 */
const pageBox = `
  rounded-comfortable
  aria-[current=page]:bg-background-state-selected
`;

/**
 * The props every clickable in the row takes.
 *
 * Generic over `as` so a call site keeps its own component's props — `as`
 * matters here because none of these apps renders a bare `<a>`: each brand has a
 * `components/Link` wrapping `next/link` that resolves the locale, starts the
 * progress bar and redirects external hrefs. It is handed straight to `Button`,
 * which takes an `as` of its own.
 */
type PaginationButtonProps<T extends ElementType = "button"> = Omit<ComponentProps<T>, "as"> & {
  as?: T;
  href?: string;
  /** Draw the arrow alone, with no label. The `aria-label` is what names it then. */
  icon?: boolean;
};

/**
 * What `PaginationButton` itself reads, spelled against `"button"` rather than
 * against `ElementType`. `ComponentProps<ElementType>` widens to `any`, which
 * takes `children` and every handler with it — the public generic above keeps a
 * call site's props typed, and this keeps the implementation's.
 */
type PaginationButtonInternalProps = ComponentProps<"button"> & {
  as?: ElementType;
  href?: string;
  icon?: boolean;
  variant: "ghost" | "outline";
};

/**
 * The one place that decides what a slot in the row renders as. Not exported:
 * `variant` is the design's call, not a call site's.
 *
 * A slot is one of two shapes, and both of them are a `Button` — the link one
 * hands it the element to render through, the other lets it render its own.
 *
 * Writing them as two is what removes the conditional attributes. `type`, `href`
 * and `disabled` each belong to exactly one shape — `type="button"` on an anchor
 * is a bogus MIME hint, `href` on a `<button>` does nothing, and `disabled` does
 * nothing to an `<a>` — so folded into one element they were three ternaries held
 * correct by three separate invariants about which element it had resolved to.
 *
 * `type="button"` is passed rather than left to default, because a `<button>`
 * without one submits: a pagination row inside a filter form would submit it on
 * every page change. `Button` has no default of its own to rely on.
 *
 * A disabled control is always the button shape, whatever `as` says: `disabled`
 * does nothing to an `<a>`, a router link would navigate anyway, and an href the
 * user is not meant to follow is one a crawler follows regardless.
 */
function PaginationButton({
  as,
  className,
  disabled = false,
  href,
  icon,
  variant,
  ...props
}: PaginationButtonInternalProps) {
  const chrome = { className, icon, size: "sm" as const, variant };

  if (!disabled && (as != null || href != null)) {
    return <Button as={as ?? "a"} href={href} {...chrome} {...props} />;
  }

  return <Button type="button" disabled={disabled || undefined} {...chrome} {...props} />;
}

/**
 * One page in the row.
 *
 * Renders an `<a>` when given an `href`, a `<button type="button">` when not, and
 * whatever `as` names when it is given — so a row of links, a row of `onClick`
 * handlers and a row through the app's router are the same component.
 *
 * - @param {ElementType} [as] - What to render — the app's router link. Defaults to `<a>` with an href, `<button>` without.
 * - @param {boolean} [isActive=false] - Whether this is the page being viewed
 * - @param {string} [href] - Where the page lives. Omit for an `onClick` row.
 * - @param {string} [className] - Additional CSS classes
 *
 * @example
 * ```tsx
 * <PaginationLink isActive onClick={() => go(4)}>4</PaginationLink>
 * <PaginationLink as={BrandLink} href="/promotions?page=4">4</PaginationLink>
 * ```
 */
function PaginationLink<T extends ElementType = "button">({
  className,
  isActive = false,
  ...props
}: PaginationButtonProps<T> & { isActive?: boolean }) {
  return (
    <PaginationButton
      variant="ghost"
      icon
      aria-current={isActive ? "page" : undefined}
      className={cn(labelVariants({ size: "s", weight: "medium" }), pageBox, className)}
      {...(props as Omit<PaginationButtonInternalProps, "variant">)}
    />
  );
}

/**
 * Back one page.
 *
 * `disabled` on the first page rather than hidden — a control that disappears
 * takes the row's width with it and shifts everything the user was aiming at.
 *
 * The label is wrapped in a `<span>` rather than left as a bare text node, and
 * that is load-bearing. `button-base` draws an icon-only button square with
 * `&:has(> svg:only-child) { aspect-ratio: 1 }`, and `:only-child` counts element
 * children — text is not one, so `<ArrowLeft />Back` would read as icon-only and
 * the 32px-tall button would be forced to 32px wide with the label hanging out of
 * a circular border. Under `icon` the arrow really is alone, and the same rule is
 * then exactly right.
 *
 * - @param {ElementType} [as] - What to render — the app's router link
 * - @param {ReactNode} [children] - Label. Defaults to `Back`.
 * - @param {boolean} [icon=false] - Draw the arrow alone, no label
 * - @param {string} [href] - Where the previous page lives. Omit for an `onClick` row.
 * - @param {string} [className] - Additional CSS classes
 *
 * @example
 * ```tsx
 * <PaginationPrevious onClick={back} disabled={page === 1} />
 * <PaginationPrevious as={BrandLink} href="/promotions?page=2" />
 * <PaginationPrevious icon onClick={back} />
 * ```
 */
function PaginationPrevious<T extends ElementType = "button">({
  children,
  icon = false,
  ...props
}: PaginationButtonProps<T>) {
  return (
    <PaginationButton
      variant="outline"
      icon={icon}
      aria-label="Go to previous page"
      {...(props as Omit<PaginationButtonInternalProps, "variant">)}
    >
      <ArrowLeft />
      {icon ? null : <span>{children ?? "Back"}</span>}
    </PaginationButton>
  );
}

/**
 * Forward one page.
 *
 * - @param {ElementType} [as] - What to render — the app's router link
 * - @param {ReactNode} [children] - Label. Defaults to `Next`.
 * - @param {boolean} [icon=false] - Draw the arrow alone, no label
 * - @param {string} [href] - Where the next page lives. Omit for an `onClick` row.
 * - @param {string} [className] - Additional CSS classes
 */
function PaginationNext<T extends ElementType = "button">({
  children,
  icon = false,
  ...props
}: PaginationButtonProps<T>) {
  return (
    <PaginationButton
      variant="outline"
      icon={icon}
      aria-label="Go to next page"
      {...(props as Omit<PaginationButtonInternalProps, "variant">)}
    >
      {icon ? null : <span>{children ?? "Next"}</span>}
      <ArrowRight />
    </PaginationButton>
  );
}

export { PaginationLink, PaginationNext, PaginationPrevious, type PaginationButtonProps };
