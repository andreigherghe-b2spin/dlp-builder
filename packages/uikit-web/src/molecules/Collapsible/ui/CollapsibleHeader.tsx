"use client";

import * as React from "react";

import { useCollapsible, useSizedFor } from "@/molecules/Collapsible/lib/context";
import { collapsibleHeaderVariants } from "@/molecules/Collapsible/lib/utils";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * The inert header row — Figma's `Size=Large` container (`924:5310`).
 *
 * A plain row, not a button. That is the whole difference between the two sizes: at
 * `large` Figma paints the hover overlay on the 40×40 `CollapsibleToggle` alone
 * (`924:6038`), so the row around it is free to hold a badge, a count, a menu or a
 * second control — none of which may be nested inside a `<button>`.
 *
 * Put the toggle in it wherever you want it; it takes `ml-auto` itself, so it lands at
 * the right edge without the row having to arrange anything. An icon passed as a direct
 * child is sized for you (24px at this size).
 *
 * **At `size="default"` use `CollapsibleTrigger` instead**, where the whole row is the
 * button. Using this part there warns in development rather than failing: an inert row
 * inside a compact collapsible has nothing to click at all.
 *
 * The row carries the text colour rather than each part setting its own, so a disabled
 * collapsible fades the label and any icon beside it from one place. It reads
 * `disabled` from context because it is not a Radix part — Radix marks only what it
 * owns.
 *
 * @param {React.ReactNode} children - The row's contents, including a `CollapsibleToggle`
 * @param {string} [className] - Additional CSS classes for the row
 * @param {string} [data-testid] - Replaces the id derived from the root's
 * @param {React.ComponentProps<'div'>} props - Props for the row element
 *
 * @example
 * ```tsx
 * <CollapsibleHeader>
 *   <Home aria-hidden />
 *   <CollapsibleLabel>Recent activity</CollapsibleLabel>
 *   <Badge>3</Badge>
 *   <CollapsibleToggle aria-label="Show recent activity" />
 * </CollapsibleHeader>
 * ```
 *
 * @cssVariables
 * See [Collapsible](./collapsible.tsx).
 */
function CollapsibleHeader({
  className,
  "data-testid": testId,
  ...props
}: React.ComponentProps<"div"> & { "data-testid"?: string }) {
  const { disabled } = useCollapsible();
  useSizedFor("large", "CollapsibleHeader");
  const { testId: resolvedTestId } = usePartTestId("header", testId);

  return (
    <div
      className={cn(collapsibleHeaderVariants({ disabled }), className)}
      data-testid={resolvedTestId}
      {...props}
    />
  );
}

export { CollapsibleHeader };
