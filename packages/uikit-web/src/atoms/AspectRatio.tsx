"use client";

import type * as React from "react";
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

import { cn } from "@/lib/utils";

/**
 * `overflow-hidden` and nothing else. No radius: a rounded frame is
 * `className="rounded-offset8"` on the ratio box itself.
 *
 * The clip is here because it has to be — Radix puts `className` on the inner
 * absolutely-positioned element, which is the one the content overflows.
 */
const root = "overflow-hidden";

/**
 * Holds its content at a fixed width-to-height ratio, whatever width it is given.
 *
 * For anything whose height must follow its width rather than its content: a
 * game tile, a promo banner, a video frame, an image that must not shift the
 * layout while it loads. Built on Radix's Aspect Ratio primitive, which reserves
 * the box with padding, so the space is held from the first paint and there is
 * no reflow when the image arrives.
 *
 * The content is clipped to the box, so a `rounded-*` class on the ratio box
 * rounds the image inside it with no wrapper of its own.
 *
 * This draws no colour, border or radius of its own — it is geometry, and the
 * frame around it belongs to whatever is being framed. That is why there is no
 * DS v2 token list below: there is nothing here for a brand to theme.
 *
 * - @param {number} [ratio=1] - Width divided by height. `16 / 9` for a
 *   widescreen frame, `1` for a square, `2 / 3` for a portrait card
 * - @param {string} [className] - Additional CSS classes for the ratio box. This
 *   is where a radius, a border or a background goes
 * - @param {React.ReactNode} children - What to hold at the ratio. Size it
 *   `size-full` and let `object-cover` crop it
 *
 * @example
 * ```tsx
 * // A widescreen image that reserves its space before it loads
 * <AspectRatio ratio={16 / 9}>
 *   <img src={src} alt="" className="size-full object-cover" />
 * </AspectRatio>
 * ```
 *
 * @example
 * ```tsx
 * // Rounded: the class goes on the ratio box, and the clip is already there
 * <AspectRatio ratio={1} className="rounded-offset8">
 *   <img src={src} alt="" className="size-full object-cover" />
 * </AspectRatio>
 * ```
 *
 * @see [API Reference](https://www.radix-ui.com/primitives/docs/components/aspect-ratio#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/aspect-ratio)
 */
function AspectRatio({
  className,
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  // No `data-testid` handling: there is one element, and nothing inside it is
  // named from it. `...props` lands the attribute on that element already, so
  // reading it here would add four lines and produce identical DOM.
  return <AspectRatioPrimitive.Root className={cn(root, className)} {...props} />;
}

export { AspectRatio };
