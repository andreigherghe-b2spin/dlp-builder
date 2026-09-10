"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Circle } from "lucide-react";

import { indicatorSlot, row } from "@/molecules/DropdownMenu/lib/utils";
import { usePartTestId } from "@/lib/testId";
import { cn, menuRowLabel } from "@/lib/utils";

/**
 * One choice in a `DropdownMenuRadioGroup`, named by the value it stands for.
 *
 * The dot follows the check to the trailing edge, and that part is extrapolated
 * rather than drawn: the node (`🔵 DS Components` 3427:5416) draws a *check* on
 * its selected row and no radio row at all. A menu whose radio rows indicated on
 * the left while its checkbox rows indicated on the right would be the worse
 * reading of a design that is simply silent here, so the two agree. Worth
 * confirming with the designer if a radio menu ever gets its own node.
 *
 * @param {string} value - The value chosen when this row is picked
 * @param {string} [className] - Additional CSS classes
 */
function DropdownMenuRadioItem({
  className,
  children,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & { "data-testid"?: string }) {
  const { testId, testIdFor } = usePartTestId(`item-${props.value}`, override);

  return (
    <DropdownMenuPrimitive.RadioItem data-testid={testId} className={cn(row, className)} {...props}>
      <span className={menuRowLabel}>{children}</span>
      <span className={indicatorSlot}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle
            aria-hidden
            data-testid={testIdFor("indicator")}
            className="size-2 fill-current"
          />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    </DropdownMenuPrimitive.RadioItem>
  );
}

export { DropdownMenuRadioItem };
