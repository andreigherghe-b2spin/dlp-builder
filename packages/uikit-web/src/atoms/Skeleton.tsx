import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * One grey block that stands in for content that has not arrived.
 *
 * Figma draws three of these — `Default`, `Card`, `Text` — but they are three
 * *compositions* of the same block, not three variants of it: an avatar circle
 * beside two lines, a picture above two lines, two lines alone. So there is no
 * `variant` prop. The block is the component; the shape is the call site's, set
 * with the size and radius utilities every consumer is already passing.
 *
 * The fill is `background/layout/inverted` at 10% — the design's one skeleton
 * colour, and the reason this reads on both a page and a surface: it is the
 * inverse of the theme's own ground, so it darkens a light brand and lightens a
 * dark one without either being named.
 *
 * `animate-pulse` is Tailwind's, unchanged. It is the only motion here, and a
 * consumer who wants none removes it with `animate-none`.
 *
 * @param {string} [className] - Size, radius and anything else the shape needs.
 * A skeleton has no intrinsic size, so **this is not optional in practice** — a
 * `<Skeleton />` with no classes is a zero-height block.
 *
 * @example
 * ```tsx
 * // Figma's `Text`: two lines.
 * <div className="flex flex-col gap-2">
 *   <Skeleton className="h-4 w-full" />
 *   <Skeleton className="h-4 w-full" />
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // Figma's `Default`: an avatar beside two lines.
 * <div className="flex items-center gap-4">
 *   <Skeleton className="size-12 rounded-full" />
 *   <div className="flex flex-1 flex-col gap-2">
 *     <Skeleton className="h-4 w-full" />
 *     <Skeleton className="h-4 w-full" />
 *   </div>
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // Figma's `Card`: a picture above two lines.
 * <div className="flex w-50 flex-col gap-4">
 *   <Skeleton className="rounded-base h-31 w-full" />
 *   <div className="flex flex-col gap-2">
 *     <Skeleton className="h-4 w-full" />
 *     <Skeleton className="h-4 w-full" />
 *   </div>
 * </div>
 * ```
 *
 * @remarks
 * **Recolour it with a class, not a variable.** The old
 * `--skeleton-background-color` and `--skeleton-border-radius` are gone; they
 * were never declared in any brand file, so a skeleton had no colour at all
 * unless a call site set one. `className` is the replacement and it wins,
 * because `cn()` puts it last:
 *
 * ```tsx
 * <Skeleton className="bg-background-layout-surface h-4 w-full" />
 * ```
 *
 * @cssVariables
 * Radius:
 * - `--radius-comfortable`
 *
 * Semantic colors:
 * - `--color-background-layout-inverted`
 *
 * @see [Documentation](https://ui.shadcn.com/docs/components/skeleton)
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-background-layout-inverted/10 rounded-comfortable animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
