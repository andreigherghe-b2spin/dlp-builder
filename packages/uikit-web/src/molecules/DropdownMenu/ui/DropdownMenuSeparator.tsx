"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { separator } from "@/molecules/DropdownMenu/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Rule between groups of rows.
 *
 * Carries a `data-testid` only when it is given one. A menu has as many
 * separators as it has groups, and a separator stands for nothing a test would
 * want to address — deriving `<base>-separator` for each of them meant one
 * locator matching four elements, which is the ambiguity the naming rules exist
 * to prevent. Same answer as a `DropdownMenuItem` with no `value`.
 *
 * (`BreadcrumbSeparator` deliberately does the opposite: its separators are
 * `aria-hidden`, so the shared name is the only way to count them, and counting
 * them is how the trail proves it puts no dot after the last crumb.)
 *
 * @param {string} [data-testid] - Names this separator. Nothing is emitted without it.
 * @param {string} [className] - Additional CSS classes
 */
function DropdownMenuSeparator({
  className,
  "data-testid": testId,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator> & { "data-testid"?: string }) {
  return (
    <DropdownMenuPrimitive.Separator
      data-testid={testId}
      className={cn(separator, className)}
      {...props}
    />
  );
}

export { DropdownMenuSeparator };
