"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { row } from "@/molecules/DropdownMenu/lib/utils";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * One action in the menu.
 *
 * `value` is what names it — `<base>-item-sign-out` — for the same reason a
 * `SelectItem` is named by its value: a row addressed by position moves the
 * moment the menu grows an entry. Without a `value` the row carries no test id
 * of its own, which is the right answer for a row nothing needs to reach.
 *
 * `inset` reaches the DOM as `data-inset={inset || undefined}`, and the
 * `|| undefined` is load-bearing wherever this file writes it. React serialises
 * a `data-*` boolean rather than dropping it, so `inset={false}` would write
 * `data-inset="false"` — and `data-inset:` matches on the attribute being
 * present, not on its value, so the row would be indented exactly when the
 * caller said not to.
 *
 * @param {string} [value] - What this row stands for. Names it, and nothing else.
 * @param {boolean} [inset] - Leave the indicator column empty, so this row lines up with rows that have one
 * @param {('default' | 'destructive')} [variant='default'] - `destructive` recolours the row
 * @param {string} [className] - Additional CSS classes
 */
function DropdownMenuItem({
  className,
  inset,
  value,
  variant = "default",
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  value?: string;
  variant?: "default" | "destructive";
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId(value == null ? "item" : `item-${value}`, override);

  return (
    <DropdownMenuPrimitive.Item
      data-testid={value == null && override == null ? undefined : testId}
      data-inset={inset || undefined}
      data-variant={variant}
      className={cn(row, className)}
      {...props}
    />
  );
}

export { DropdownMenuItem };
