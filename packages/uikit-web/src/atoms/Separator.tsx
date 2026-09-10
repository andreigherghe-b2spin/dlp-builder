"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

// A separator is a 1px rule and nothing else, so it is drawn as a background on
// a zero-thickness box rather than as a border — one property to theme, and no
// box-sizing question about whether the line counts towards the height.
//
// The thickness is `px`, not a token: Figma draws the rule as a 1px stroke and
// the theme files have no separator or hairline variable to point at. The colour
// is the one thing that varies by brand, and it comes from the shared
// `Color/Border/Neutral/Subtle` token.
//
// Radix sets `data-orientation` from the `orientation` prop, so the cross-axis
// size follows the prop with no variant of our own. The main-axis size is `full`
// in both directions, which means the parent decides the length — a vertical
// separator needs a parent with a height (a flex row of known height, or an
// explicit one on the separator).
const base = `
  shrink-0
  bg-border-neutral-subtle

  data-[orientation=horizontal]:h-px
  data-[orientation=horizontal]:w-full

  data-[orientation=vertical]:h-full
  data-[orientation=vertical]:w-px
`;

/**
 * A visual or semantic separator between content.
 * Built on top of Radix UI's Separator primitive.
 *
 * Leave it `decorative` (the default) when the rule is only a visual break —
 * that renders it `aria-hidden` so screen readers skip it. Pass
 * `decorative={false}` when the line is the only thing marking a real boundary
 * between groups of content, which announces it as a separator.
 *
 * - @param {string} [className] - Additional CSS classes
 * - @param {'horizontal' | 'vertical'} [orientation='horizontal'] - The orientation of the separator
 * - @param {boolean} [decorative=true] - Whether the separator is purely decorative or semantically meaningful
 * - @param {React.ComponentProps<typeof SeparatorPrimitive.Root>} props - Props for the separator root element
 *
 *
 * @example
 * ```tsx
 * // Horizontal separator — spans the width of its parent
 * <Separator />
 *
 * // Vertical separator — the parent supplies the height
 * <div className="flex h-8 items-center gap-2">
 *   <span>Left</span>
 *   <Separator orientation="vertical" />
 *   <span>Right</span>
 * </div>
 *
 * // Semantic separator (not decorative)
 * <Separator decorative={false} />
 * ```
 *
 * @cssVariables
 * Semantic colors:
 * - `--color-border-neutral-subtle`
 *
 * @see [Reference](https://www.radix-ui.com/primitives/docs/components/separator#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/separator)
 */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(base, className)}
      {...props}
    />
  );
}

export { Separator };
