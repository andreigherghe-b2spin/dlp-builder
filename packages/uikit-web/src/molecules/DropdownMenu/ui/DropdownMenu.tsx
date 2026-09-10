"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { usePortalContainer } from "@/lib/portalContainer";
import { TestIdProvider } from "@/lib/testId";

// The parts that render no element of their own — the root and the three Radix
// wrappers around it. They are one file rather than four, because a file per
// three-line pass-through says there is something to read in each.

/**
 * A menu of actions hung off a trigger, built on Radix.
 *
 * Naming the menu names every part: a `data-testid` here is published to the
 * subtree and each part derives its own from it — `-trigger`, `-content`,
 * `-label`, and one per row named after the value it stands for rather than its
 * position, because position reorders with the data. A separator is named only
 * if you name it.
 *
 * @param {string} [data-testid] - Names the menu; every part derives its own from it
 * @param {React.ComponentProps<typeof DropdownMenuPrimitive.Root>} props - Props for the menu root
 *
 * @example
 * ```tsx
 * <DropdownMenu data-testid="account">
 *   <DropdownMenuTrigger asChild>
 *     <Button variant="outline">Account</Button>
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuLabel>Signed in as sam@example.com</DropdownMenuLabel>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem value="profile">Profile</DropdownMenuItem>
 *     <DropdownMenuItem value="sign-out" variant="destructive">Sign out</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 *
 * @cssVariables
 * - `--components-textfield-border`
 * - `--components-textfield-radius`
 * - `--radius-offset4`
 * - `--shadow-md`
 * - `--typography-font-family`
 * - `--typography-font-size-label-m`
 * - `--typography-font-size-body-s`
 * - `--typography-font-weight-regular`
 * - `--typography-font-weight-semibold`
 * - `--color-background-layout-surface`
 * - `--color-background-state-hover`
 * - `--color-background-state-pressed`
 * - `--color-background-state-selected`
 * - `--color-border-neutral-subtle`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-on-surface-muted`
 * - `--color-foreground-state-disabled`
 * - `--color-foreground-feedback-negative`
 *
 * @see [Reference](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)
 * @see [Documentation](https://ui.shadcn.com/docs/components/dropdown-menu)
 */
function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root> & {
  "data-testid"?: string;
}) {
  return (
    <TestIdProvider value={props["data-testid"]}>
      <DropdownMenuPrimitive.Root {...props} />
    </TestIdProvider>
  );
}

/**
 * Renders the menu into the document root — or into the surrounding dialog's
 * panel when there is one, so the menu stacks inside the dialog rather than
 * against it. Pass `container` to override.
 */
function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  const container = usePortalContainer();

  return <DropdownMenuPrimitive.Portal container={container} {...props} />;
}

/** Groups rows together. Purely semantic — the gap is the panel's. */
function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group {...props} />;
}

/** Groups radio rows, and holds which one is chosen. */
function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup {...props} />;
}

/** A menu that opens out of a row. */
function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSub,
};
