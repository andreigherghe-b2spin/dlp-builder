"use client";

import * as React from "react";
import { Dot } from "lucide-react";

import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

// The row: the list, one slot in it, and the mark between two slots. One file
// because they are one decision — how a trail is spaced — and none of the three
// is big enough to read on its own.
//
// There is no `gap` anywhere in it, which looks like an omission and is not.
// Figma gives the separator a 20×20 box around a 3.3px dot and hangs the rest of
// the spacing off the crumb itself — `crumbBox` in
// [BreadcrumbLink](./BreadcrumbLink.tsx) is the 8px it draws either side of the
// label. A `gap` on the list would be added to both and push every crumb apart.

/**
 * The ordered list the crumbs sit in.
 *
 * Wraps rather than scrolls, because a trail that runs off the side of a phone
 * is a trail with no root — and the root is the crumb a user actually reaches
 * for. `maxItems` on [Breadcrumb](./Breadcrumb.tsx) is the other answer to the
 * same problem, and the better one when the labels are long.
 *
 * - @param {string} [className] - Additional CSS classes
 * - @param {string} [data-testid] - Overrides the `<base>-list` the trail derives
 * - @param {React.ComponentProps<'ol'>} props - Props for the ordered list element
 */
function BreadcrumbList({
  className,
  ...props
}: React.ComponentProps<"ol"> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("list", props["data-testid"]);

  return (
    <ol
      className={cn("wrap-break-word flex flex-wrap items-center", className)}
      {...props}
      data-testid={testId}
    />
  );
}

/**
 * One slot in the trail — a link, the current page, or the collapsed `…`.
 *
 * - @param {string} [className] - Additional CSS classes
 * - @param {React.ComponentProps<'li'>} props - Props for the list item element
 */
function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("inline-flex items-center", className)} {...props} />;
}

/**
 * The mark between two crumbs — a dot, in this design, rather than the chevron
 * shadcn ships.
 *
 * `aria-hidden` and `role="presentation"`, so a screen reader reads the trail as
 * a list of links and not as a list of links and punctuation. Pass children to
 * draw something else.
 *
 * - @param {React.ReactNode} [children] - Custom separator content. Defaults to the dot.
 * - @param {string} [className] - Additional CSS classes
 * - @param {string} [data-testid] - Overrides the `<base>-separator` the trail derives
 * - @param {React.ComponentProps<'li'>} props - Props for the list item element
 */
function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li"> & { "data-testid"?: string }) {
  // Every separator answers to the same name, which is the exception that proves
  // the rule against naming by position: a crumb stands for a place and is named
  // after it, a separator stands for nothing and there is no value to name it
  // by. Counting them is the only thing a test wants from them.
  const { testId } = usePartTestId("separator", props["data-testid"]);

  return (
    <li
      role="presentation"
      aria-hidden="true"
      data-testid={testId}
      className={cn("text-foreground-on-surface-muted flex items-center [&>svg]:size-5", className)}
      {...props}
    >
      {children ?? <Dot />}
    </li>
  );
}

export { BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator };
