"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { usePartTestId } from "@/lib/testId";

/**
 * The control that opens the menu. Give it `asChild` and a `Button`, rather than
 * styling this — a trigger is whatever the design says it is, and the element is
 * the caller's to supply.
 *
 * @param {string} [data-testid] - Overrides the `<base>-trigger` the menu derives
 */
function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger> & {
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId("trigger", props["data-testid"]);

  return <DropdownMenuPrimitive.Trigger {...props} data-testid={testId} />;
}

export { DropdownMenuTrigger };
