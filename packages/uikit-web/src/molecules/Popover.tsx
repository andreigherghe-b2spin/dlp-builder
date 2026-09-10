"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { usePortalContainer } from "@/lib/portalContainer";
import { cn } from "@/lib/utils";

/**
 * A component that displays floating content in a portal, triggered by a button.
 * Built on top of Radix UI's Popover primitive.
 *
 * @param {React.ComponentProps<typeof PopoverPrimitive.Root>} props - Props for the popover root element
 *
 *
 * @example
 * <Popover>
 *   <PopoverTrigger>Open</PopoverTrigger>
 *   <PopoverContent>
 *     <p>Popover content</p>
 *   </PopoverContent>
 * </Popover>
 *
 * @cssVariables
 * - `--popover-background-color` - Background color of the popover
 * - `--popover-color` - Text color of the popover
 * - `--popover-border-radius` - Border radius of the popover
 * - `--popover-border-color` - Border color of the popover
 * - `--popover-border-width` - Border width of the popover
 * - `--popover-padding-inline` - Horizontal padding of the popover
 * - `--popover-padding-block` - Vertical padding of the popover
 *
 * @see [Reference](https://www.radix-ui.com/primitives/docs/components/popover#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/popover)
 */
function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

/**
 * The button that triggers the popover.
 *
 * @param {React.ComponentProps<typeof PopoverPrimitive.Trigger>} props - Props for the trigger element
 */
function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * The content displayed when the popover is open.
 * Renders in a portal to avoid z-index issues.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [align='center'] - Alignment of the popover relative to the trigger
 * @param {number} [sideOffset=4] - Distance between the popover and the trigger
 * @param {React.ComponentProps<typeof PopoverPrimitive.Content>} props - Props for the content element
 */
function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const container = usePortalContainer();

  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        data-popover-content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin) rounded-(--popover-border-radius) border-(length:--popover-border-width) bg-(--popover-background-color) px-(--popover-padding-inline) py-(--popover-padding-block) text-(--popover-color) outline-hidden z-50 w-72 border-solid shadow-md",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

/**
 * An optional anchor element that the popover can be positioned relative to.
 *
 * @param {React.ComponentProps<typeof PopoverPrimitive.Anchor>} props - Props for the anchor element
 */
function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
