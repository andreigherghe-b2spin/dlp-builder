"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

import { useCollapsible } from "@/molecules/Collapsible/lib/context";
import { collapsibleContentVariants } from "@/molecules/Collapsible/lib/utils";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * The panel — Figma's `SectionContent` (`924:1842`, `924:5143`).
 *
 * A column with a 4px gap, so a stack of rows needs no wrapper of its own. What goes
 * in it is entirely yours: this part contributes the fill, the radius and the padding
 * the design specifies, and nothing about the shape of the content.
 *
 * The two sizes fill it differently — `default` is a tinted inner box inset by 4px,
 * `large` is bare with 16px of padding — which is read from context rather than passed,
 * so a call site sets `size` once on the root.
 *
 * **A closed panel is hidden, not unmounted.** Radix keeps the node so it can measure
 * it, and marks it `hidden`; a test should assert `toBeVisible`, not
 * `toBeInTheDocument`. Anything expensive in here therefore renders while the panel is
 * shut — pass `children` conditionally if that matters.
 *
 * @param {React.ReactNode} children - The panel's contents
 * @param {string} [className] - Additional CSS classes for the panel. `animate-none`
 * here turns the 200ms disclosure off; a different one replaces it, and
 * `--radix-collapsible-content-height` is on this element to animate against
 * @param {boolean} [forceMount] - Radix's escape hatch for an animation library that
 * needs the node earlier. It changes nothing here, the panel being mounted while closed
 * either way
 * @param {string} [data-testid] - Replaces the id derived from the root's
 * @param {React.ComponentProps<typeof CollapsiblePrimitive.Content>} props - Props for the panel
 *
 * @example
 * ```tsx
 * <CollapsibleContent>
 *   <TypographyBody size="m">100 Market St, San Francisco</TypographyBody>
 *   <TypographyBody size="m">CA 94103</TypographyBody>
 * </CollapsibleContent>
 * ```
 *
 * @cssVariables
 * Component:
 * - `--animate-collapsible-expand`
 * - `--animate-collapsible-collapse`
 * - `--radius-offset4`
 *
 * Semantic colors:
 * - `--color-background-layout-surface-variant1` (at `size="default"`)
 */
function CollapsibleContent({
  className,
  "data-testid": testId,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content> & { "data-testid"?: string }) {
  const { size } = useCollapsible();
  const { testId: resolvedTestId } = usePartTestId("content", testId);

  return (
    <CollapsiblePrimitive.Content
      className={cn(collapsibleContentVariants({ size }), className)}
      data-testid={resolvedTestId}
      {...props}
    />
  );
}

export { CollapsibleContent };
