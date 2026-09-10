"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { label } from "@/molecules/DropdownMenu/lib/utils";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * Caption above a group of rows. The same treatment `SelectLabel` gets, because
 * Figma draws one caption for both.
 *
 * @param {boolean} [inset] - Line the caption up with rows that have an indicator column
 * @param {string} [className] - Additional CSS classes
 * @param {string} [data-testid] - Overrides the `<base>-label` the menu derives
 */
function DropdownMenuLabel({
  className,
  inset,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId("label", override);

  return (
    <DropdownMenuPrimitive.Label
      data-testid={testId}
      data-inset={inset || undefined}
      className={cn(label, className)}
      {...props}
    />
  );
}

export { DropdownMenuLabel };
