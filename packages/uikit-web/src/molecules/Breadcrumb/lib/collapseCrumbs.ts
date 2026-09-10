import type * as React from "react";

/**
 * Splits a trail into the crumbs that stay visible and the ones that fold into
 * the `…`.
 *
 * Figma draws exactly one collapsed shape — `Breadcrumb • … • Current page` —
 * so the split is first crumb, everything else hidden, last `maxItems - 1`
 * kept. There is no `itemsBeforeCollapse` knob to go with it: a second leading
 * crumb is not a state the design has, and a prop nothing draws is a prop that
 * drifts.
 *
 * Generic in the crumb rather than typed to `BreadcrumbCrumb`, so the helper
 * has no import from `ui/` and its test runs in node rather than in Chromium.
 *
 * @param crumbs - The full trail, root first
 * @param maxItems - How many crumbs may be rendered. `undefined`, or anything
 * below 2, never collapses — one leading crumb plus one trailing is the
 * smallest trail the `…` can sit between.
 */
function collapseCrumbs<T>(crumbs: T[], maxItems?: number) {
  if (maxItems == null || maxItems < 2 || crumbs.length <= maxItems) {
    return { leading: crumbs, hidden: [] as T[], trailing: [] as T[] };
  }

  const trailingCount = maxItems - 1;

  return {
    leading: crumbs.slice(0, 1),
    hidden: crumbs.slice(1, crumbs.length - trailingCount),
    trailing: crumbs.slice(crumbs.length - trailingCount),
  };
}

export { collapseCrumbs };

/**
 * One rung of the trail.
 *
 * `href` is what separates the two kinds: a crumb with one is a place the user
 * can go back to, a crumb without one is where they already are. The trail
 * renders the second as [BreadcrumbPage](../ui/BreadcrumbLink.tsx) rather than
 * as a dead link, so "no href" is the whole way of saying "current page" — there
 * is no `isCurrent` flag to keep in step with it.
 */
type BreadcrumbCrumb = {
  /** What the crumb reads as. */
  label: React.ReactNode;
  /** Where it goes. Omit on the crumb the user is on. */
  href?: string;
};

export type { BreadcrumbCrumb };
