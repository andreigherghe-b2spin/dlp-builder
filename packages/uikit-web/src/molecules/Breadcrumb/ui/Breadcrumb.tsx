"use client";

import * as React from "react";

import { collapseCrumbs, type BreadcrumbCrumb } from "@/molecules/Breadcrumb/lib/collapseCrumbs";
import { nameCrumbs, type NamedCrumb } from "@/molecules/Breadcrumb/lib/nameCrumbs";
import { BreadcrumbMenu } from "@/molecules/Breadcrumb/ui/BreadcrumbEllipsis";
import { BreadcrumbLink, BreadcrumbPage } from "@/molecules/Breadcrumb/ui/BreadcrumbLink";
import {
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/molecules/Breadcrumb/ui/BreadcrumbList";
import { TestIdProvider } from "@/lib/testId";
import { createTestIdFor } from "@/lib/utils";

/** Per-part classes for the `items` form; the composed form dresses its own parts. */
type BreadcrumbClassNames = {
  list?: string;
  item?: string;
  link?: string;
  page?: string;
  separator?: string;
};

/**
 * The path to the current page, as a trail of links.
 *
 * Two ways to use it, and the first is the one nearly every page wants:
 *
 * ```tsx
 * // Data. The last crumb has no href, so it renders as the current page.
 * <Breadcrumb
 *   items={[
 *     { label: "Home", href: "/" },
 *     { label: "Slots", href: "/slots" },
 *     { label: "Book of Ra" },
 *   ]}
 * />
 *
 * // Every crumb through the app's own router link, which is what a brand app
 * // actually needs — `components/Link` resolves the locale, starts the progress
 * // bar and handles external hrefs.
 * <Breadcrumb items={crumbs} linkAs={BrandLink} />
 *
 * // Composed, when a crumb needs something the data form cannot say —
 * // an icon, a crumb that is not a link at all.
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem>
 *       <BreadcrumbLink as={BrandLink} href="/">Home</BreadcrumbLink>
 *     </BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem>
 *       <BreadcrumbPage>Book of Ra</BreadcrumbPage>
 *     </BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 * ```
 *
 * `items` exists because every brand app was writing the same `.map()` — crumb,
 * separator, crumb, separator, last-one-is-the-page — and each wrote the
 * off-by-one at the end slightly differently. The separators, the `aria-current`
 * and the test ids all come out of the data, so there is nothing left to get
 * wrong; `children` is still there for the trail that needs more than a label
 * and an href.
 *
 * `maxItems` folds the middle into a `…` that opens a menu of what it hid, which
 * is the `Lenght=more links` state in Figma. Wrapping is the default and costs
 * nothing, so reach for `maxItems` when the labels are long rather than as a
 * matter of course.
 *
 * Naming the trail names every part: a `data-testid` here is published to the
 * subtree, and each part derives its own from it — `-list`, `-page`, `-menu`,
 * and one per link named after where it goes (`/slots` → `-slots`, `/` →
 * `-root`) rather than after its position, because a level inserted in the
 * middle moves every position after it. Without the prop no part carries a test
 * id at all.
 *
 * @param {BreadcrumbCrumb[]} [items] - The trail as data. The crumb without an `href` is the current page.
 * @param {number} [maxItems] - Most crumbs to draw before folding the middle into a `…`. Never folds below 2.
 * @param {React.ReactNode} [separator] - Custom mark between crumbs, for the `items` form. Defaults to the dot.
 * @param {React.ElementType} [linkAs='a'] - What every crumb renders as. Pass the app's router link.
 * @param {BreadcrumbClassNames} [classNames] - Per-part classes: `list`, `item`, `link`, `page`, `separator`
 * @param {string} [className] - Additional CSS classes for the `<nav>`
 * @param {string} [data-testid] - Names the trail; every part derives its own from it
 * @param {React.ComponentProps<'nav'>} props - Props for the nav element
 *
 * @cssVariables
 * Through [Link](../../../atoms/Link.tsx), on every crumb:
 * - `--typography-font-family`
 * - `--typography-font-size-label-l`
 * - `--typography-font-weight-bold`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-state-disabled`
 * - `--color-border-state-focus`
 * - `--border-width-border-4`
 *
 * On the current page, a crumb the user has already followed, and the separator:
 * - `--typography-font-weight-regular`
 * - `--color-foreground-on-surface-muted`
 *
 * On the collapsed menu:
 * - `--radius-offset4`
 * - `--radius-base`
 * - `--typography-font-size-label-m`
 * - `--color-background-layout-surface`
 * - `--color-border-neutral-subtle`
 *
 * @see [Documentation](https://ui.shadcn.com/docs/components/breadcrumb)
 */
function Breadcrumb({
  items,
  maxItems,
  separator,
  linkAs,
  classNames,
  children,
  ...props
}: React.ComponentProps<"nav"> & {
  items?: BreadcrumbCrumb[];
  maxItems?: number;
  separator?: React.ReactNode;
  linkAs?: React.ElementType;
  classNames?: BreadcrumbClassNames;
  "data-testid"?: string;
}) {
  return (
    <TestIdProvider value={props["data-testid"]}>
      <nav aria-label="breadcrumb" {...props}>
        {items ? (
          <BreadcrumbTrail
            items={items}
            maxItems={maxItems}
            separator={separator}
            linkAs={linkAs}
            classNames={classNames}
            testIdFor={createTestIdFor(props["data-testid"])}
          />
        ) : (
          children
        )}
      </nav>
    </TestIdProvider>
  );
}

/**
 * The React key for the `…` slot, and the colon is the whole point: `slugify`
 * replaces every character outside `[a-z0-9]` with a dash, so no crumb can ever
 * be named this. A plain `"collapsed"` could be — a crumb at `/collapsed`
 * resolves to exactly that — and the collision would be the duplicate key
 * `nameCrumbs` exists to prevent, arriving through the one slot it does not name.
 */
const COLLAPSED_KEY = "breadcrumb:collapsed";

/**
 * The `items` form's rendering, kept out of the root so the composed form pays
 * nothing for it.
 *
 * The crumbs and the `…` are flattened into one list of slots first, and the
 * separators are then dropped between the slots rather than after each crumb.
 * Written the other way round, the collapsed trail grows a trailing dot the
 * moment `hidden` is empty, which is the bug the hand-written `.map()`s in the
 * brand apps all had.
 */
function BreadcrumbTrail({
  items,
  maxItems,
  separator,
  linkAs,
  classNames,
  testIdFor,
}: {
  items: BreadcrumbCrumb[];
  maxItems?: number;
  separator?: React.ReactNode;
  linkAs?: React.ElementType;
  classNames?: BreadcrumbClassNames;
  testIdFor: (part: string) => string | undefined;
}) {
  // Named over the whole trail *before* it is split, so a second crumb with no
  // href — or a repeated one — cannot land on the first one's React key or on
  // its `data-testid`. The name rides on the crumb, so the split carries it.
  const { leading, hidden, trailing } = collapseCrumbs(nameCrumbs(items), maxItems);

  const renderCrumb = (crumb: NamedCrumb) =>
    crumb.href == null ? (
      <BreadcrumbPage className={classNames?.page} data-testid={testIdFor(crumb.name)}>
        {crumb.label}
      </BreadcrumbPage>
    ) : (
      <BreadcrumbLink
        as={linkAs}
        href={crumb.href}
        className={classNames?.link}
        data-testid={testIdFor(crumb.name)}
      >
        {crumb.label}
      </BreadcrumbLink>
    );

  const slots: { key: string; node: React.ReactNode }[] = [
    ...leading.map((crumb) => ({ key: crumb.name, node: renderCrumb(crumb) })),
    ...(hidden.length > 0
      ? [{ key: COLLAPSED_KEY, node: <BreadcrumbMenu items={hidden} linkAs={linkAs} /> }]
      : []),
    ...trailing.map((crumb) => ({ key: crumb.name, node: renderCrumb(crumb) })),
  ];

  return (
    <BreadcrumbList className={classNames?.list}>
      {slots.map(({ key, node }, index) => (
        <React.Fragment key={key}>
          {index > 0 ? (
            <BreadcrumbSeparator className={classNames?.separator}>{separator}</BreadcrumbSeparator>
          ) : null}
          <BreadcrumbItem className={classNames?.item}>{node}</BreadcrumbItem>
        </React.Fragment>
      ))}
    </BreadcrumbList>
  );
}

export { Breadcrumb, type BreadcrumbClassNames };
