"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { panel } from "@/molecules/DropdownMenu/lib/utils";
import { usePortalContainer } from "@/lib/portalContainer";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

// The two panels, together because they are the same rectangle. A submenu's
// differs only in what it does not have: the height and the transform origin a
// root panel takes from its trigger are Radix variables that mean nothing here.

/**
 * The panel the rows sit in.
 *
 * @param {number} [sideOffset=4] - Gap between the trigger and the panel
 * @param {string} [className] - Additional CSS classes
 * @param {string} [data-testid] - Overrides the `<base>-content` the menu derives
 */
function DropdownMenuContent({
  className,
  sideOffset = 4,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("content", override);
  const container = usePortalContainer();

  return (
    <DropdownMenuPrimitive.Portal container={container}>
      <DropdownMenuPrimitive.Content
        data-testid={testId}
        sideOffset={sideOffset}
        className={cn(panel, className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

/**
 * The submenu's own panel.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [data-testid] - Overrides the `<base>-sub-content` the menu derives
 */
function DropdownMenuSubContent({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("sub-content", override);

  return (
    <DropdownMenuPrimitive.SubContent
      data-testid={testId}
      className={cn(panel, className)}
      {...props}
    />
  );
}

export { DropdownMenuContent, DropdownMenuSubContent };
