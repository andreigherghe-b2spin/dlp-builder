"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A vertically stacked set of interactive headings that each reveal a section of content.
 * Built on top of Radix UI's Accordion primitive.
 *
 * @param {string} [className] - Additional CSS classes to apply to the accordion
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Is it accessible?</AccordionTrigger>
 *     <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 *
 * @cssVariables
 * - `--accordion-gap`
 *
 * @see [API Reference](https://www.radix-ui.com/primitives/docs/components/accordion#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/accordion)
 */
function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("[&_[data-accordion-item]:not(:last-child)]:mb-(--accordion-gap)", className)}
      {...props}
    />
  );
}

/**
 * Individual item in the accordion.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the item
 *
 * @cssVariables
 * - `--accordion-item-default-background-color`
 * - `--accordion-item-default-color`
 * - `--accordion-item-default-border-color`
 * - `--accordion-item-default-border-width`
 * - `--accordion-item-default-border-radius`
 * - `--accordion-item-expanded-background-color`
 * - `--accordion-item-hover-background-color`
 * - `--accordion-item-hover-color`
 */
function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      // Named for the one thing it does — the root's gap rule selects on it. Not
      // `data-slot`, which is being retired, and not `data-testid`, which is
      // `undefined` unless a consumer asks for it and so cannot carry styling.
      data-accordion-item
      className={cn(
        "rounded-(--accordion-item-default-border-radius) border-(length:--accordion-item-default-border-width) border-(--accordion-item-default-border-color) bg-(--accordion-item-default-background-color) text-(--accordion-item-default-color) data-[state=open]:bg-(--accordion-item-expanded-background-color) overflow-hidden",
        "hover:bg-(--accordion-item-hover-background-color) hover:text-(--accordion-item-hover-color) data-[state=open]:hover:bg-(--accordion-item-hover-background-color)",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The trigger button that expands/collapses the accordion item.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the trigger
 * - @param {React.ReactNode} children - The content of the trigger
 *
 * @cssVariables
 * - `--accordion-item-expanded-trigger-border-bottom-color`
 * - `--accordion-item-expanded-trigger-border-bottom-width`
 * - `--accordion-trigger-default-padding-bottom`
 * - `--accordion-trigger-default-padding-inline`
 * - `--accordion-trigger-default-padding-top`
 * - `--accordion-trigger-default-font-size`
 * - `--accordion-trigger-icon-color`
 * - `--accordion-trigger-icon-size`
 */
function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 border-(--accordion-item-expanded-trigger-border-bottom-color) px-(--accordion-trigger-default-padding-inline) pt-(--accordion-trigger-default-padding-top) pb-(--accordion-trigger-default-padding-bottom) text-(--accordion-trigger-default-font-size) [&[data-state=open]]:border-b-(length:--accordion-item-expanded-trigger-border-bottom-width) flex flex-1 items-start justify-between gap-4 py-4 text-left font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="size-(--accordion-trigger-icon-size) text-(--accordion-trigger-icon-color) pointer-events-none shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/**
 * The content section of an accordion item.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the content
 * - @param {React.ReactNode} children - The content to be displayed
 *
 * @cssVariables
 * - `--accordion-content-padding-bottom`
 * - `--accordion-content-padding-inline`
 * - `--accordion-content-padding-top`
 */
function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down px-(--accordion-content-padding-inline) overflow-hidden text-sm"
      {...props}
    >
      <div
        className={cn(
          "pt-(--accordion-content-padding-top) pb-(--accordion-content-padding-bottom)",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
