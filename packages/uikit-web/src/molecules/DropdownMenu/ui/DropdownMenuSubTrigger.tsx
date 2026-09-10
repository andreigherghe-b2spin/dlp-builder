"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";

import { row, rowOpen } from "@/molecules/DropdownMenu/lib/utils";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * The row that opens a submenu. Keeps the chevron against the trailing edge, and
 * stays washed while its submenu is open so the path through the menu is visible.
 *
 * @param {boolean} [inset] - Line up with rows that have an indicator column
 * @param {string} [className] - Additional CSS classes
 */
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
  "data-testid"?: string;
}) {
  const { testId, testIdFor } = usePartTestId("sub-trigger", override);

  return (
    <DropdownMenuPrimitive.SubTrigger
      data-testid={testId}
      data-inset={inset || undefined}
      className={cn(row, rowOpen, className)}
      {...props}
    >
      {children}
      <ChevronRight aria-hidden data-testid={testIdFor("chevron")} className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

export { DropdownMenuSubTrigger };
