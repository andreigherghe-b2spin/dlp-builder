"use client";

import * as React from "react";

import type { BreadcrumbCrumb } from "@/molecules/Breadcrumb/lib/collapseCrumbs";
import { nameCrumbs } from "@/molecules/Breadcrumb/lib/nameCrumbs";
import { BreadcrumbLink } from "@/molecules/Breadcrumb/ui/BreadcrumbLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/molecules/DropdownMenu";
import { usePartTestId } from "@/lib/testId";

// The collapsed middle of a trail: the `…` and the menu behind it.
//
// The `…` is `BreadcrumbLink as="button"` rather than a `<span>` — Figma draws it
// in the same `Label - Underline/Large/Bold` as every other crumb, so it is a
// crumb, and it opens a menu, so it is a control. `as` is what lets those two be
// the same thing: the type and the 8px hit area come from the crumb, the element
// is a real `<button>` a keyboard can reach. `MoreHorizontal` went with the
// `<span>` — the design draws three type dots on the baseline, not an icon.
//
// `BreadcrumbMenu` is `DropdownMenu` and nothing else. It used to hand the panel
// and the row a set of DS v2 classes from here, because `DropdownMenu` still
// carried shadcn's `bg-popover` / `rounded-md` / `text-sm` defaults; now that it
// is migrated, `DropdownMenuContent` already renders them, so there is nothing
// left to overlay. Which is also where a change to the collapsed menu's
// appearance belongs from now on — in `DropdownMenu`, not here.

/**
 * The `…` that stands in for the crumbs a collapsed trail is not showing.
 *
 * Presentational on its own — it opens nothing. Either let
 * [Breadcrumb](./Breadcrumb.tsx)'s `maxItems` place it, or wrap it in
 * `BreadcrumbMenu`; on its own it is the right thing only when the hidden crumbs
 * are genuinely unreachable.
 *
 * - @param {React.ReactNode} [children] - Custom content. Defaults to `…`.
 * - @param {React.ComponentProps<'button'>} props - Props for the button element
 */
function BreadcrumbEllipsis({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <BreadcrumbLink as="button" type="button" {...props}>
      {children ?? "…"}
      <span className="sr-only">Show hidden breadcrumbs</span>
    </BreadcrumbLink>
  );
}

/**
 * The `…` plus the menu of everything it is standing in for.
 *
 * - @param {BreadcrumbCrumb[]} items - The hidden crumbs, in trail order
 * - @param {React.ElementType} [linkAs='a'] - What each row renders as — the app's router link
 * - @param {object} [classNames] - Per-part classes: `trigger`, `content`, `item`
 * - @param {string} [data-testid] - Overrides the `<base>-menu` the trail derives
 * - @param {React.ComponentProps<typeof DropdownMenu>} props - Props for the menu root
 */
function BreadcrumbMenu({
  items,
  linkAs,
  classNames,
  "data-testid": testIdOverride,
  ...props
}: React.ComponentProps<typeof DropdownMenu> & {
  items: BreadcrumbCrumb[];
  linkAs?: React.ElementType;
  classNames?: { trigger?: string; content?: string; item?: string };
  "data-testid"?: string;
}) {
  const { testId, testIdFor } = usePartTestId("menu", testIdOverride);
  // Same naming as the trail, so a menu holding two crumbs that read or resolve
  // alike still gives each its own key and test id.
  const named = nameCrumbs(items);
  const Anchor = linkAs ?? "a";

  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger asChild>
        <BreadcrumbEllipsis className={classNames?.trigger} data-testid={testIdFor("trigger")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={classNames?.content} data-testid={testId}>
        {named.map((crumb) => (
          // Keyed by the name, not by the href: `label` is a `ReactNode` rather
          // than a string, so it cannot serve as a key, and two crumbs may share
          // an href or none at all.
          <DropdownMenuItem
            key={crumb.name}
            asChild={crumb.href != null}
            className={classNames?.item}
            data-testid={testIdFor(crumb.name)}
          >
            {crumb.href != null ? <Anchor href={crumb.href}>{crumb.label}</Anchor> : crumb.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { BreadcrumbEllipsis, BreadcrumbMenu };
