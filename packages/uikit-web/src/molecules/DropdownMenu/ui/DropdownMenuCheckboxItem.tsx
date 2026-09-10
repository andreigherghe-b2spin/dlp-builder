"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";

import { indicatorSlot, row } from "@/molecules/DropdownMenu/lib/utils";
import { usePartTestId } from "@/lib/testId";
import { cn, menuRowLabel } from "@/lib/utils";

/**
 * A row that toggles. The check sits against the trailing edge, which is where
 * the node draws it and where `SelectItem` already put it.
 *
 * It used to sit in a leading `absolute` slot with the row indented to clear it,
 * so that ticking a row could not shift its label sideways. The trailing
 * position gives that for free — `ItemIndicator` renders nothing when unchecked,
 * and the label starts at the same 12px either way — so the indent is gone.
 *
 * The label is wrapped rather than left bare, and the wrapper is what makes
 * Figma's truncation work at all: see `menuRowLabel`. Bare children would clip
 * with no ellipsis and shove the check out of the row.
 *
 * `value` names it, the same way it names a [DropdownMenuItem](./DropdownMenuItem.tsx).
 * Radix gives a checkbox row no value of its own — unlike a radio row, which is
 * chosen *by* its value — so the prop is ours. It has to be something the row
 * *is* rather than something it is currently doing: named from `checked`, two
 * unticked rows would collide on one id, and a row's id would change the moment
 * it was ticked.
 *
 * @param {string} [value] - What this row stands for. Names it, and nothing else.
 * @param {boolean} [checked] - Whether it is ticked
 * @param {string} [className] - Additional CSS classes
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  value,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  value?: string;
  "data-testid"?: string;
}) {
  const named = value != null || override != null;
  const { testId, testIdFor } = usePartTestId(value == null ? "item" : `item-${value}`, override);

  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-testid={named ? testId : undefined}
      className={cn(row, className)}
      checked={checked}
      {...props}
    >
      <span className={menuRowLabel}>{children}</span>
      <span className={indicatorSlot}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Check aria-hidden data-testid={named ? testIdFor("indicator") : undefined} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export { DropdownMenuCheckboxItem };
