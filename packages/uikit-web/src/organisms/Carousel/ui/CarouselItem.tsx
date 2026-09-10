"use client";

import * as React from "react";

import { useCarousel } from "@/organisms/Carousel/lib/useCarousel";
import { cn } from "@/lib/utils";

/**
 * One slide. Full width by default; override `basis` to show several at once.
 *
 * The item always spans the whole carousel along the scroll axis, so content
 * that should fill it — rather than sit in the top of it — wants `h-full` in a
 * vertical carousel and `w-full` in a horizontal one. `h-full min-h-*` covers
 * both: the height it inherits vertically, the floor it needs horizontally,
 * where the item's own height is `auto`.
 *
 * The gutter lives on this element as padding, matching the negative margin on
 * the track, so changing it means changing both — `pl-2` here against `-ml-2`
 * on the track the root builds.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ComponentProps<'div'>} props - Props for the slide element
 *
 * @example
 * ```tsx
 * // Three slides in view from the medium breakpoint up
 * <CarouselItem className="md:basis-1/3">…</CarouselItem>
 * ```
 */
function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation, testIdFor } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-testid={testIdFor("item")}
      className={cn(
        "basis-(--carousel-slide-size) min-h-0 min-w-0 shrink-0 grow-0",
        orientation === "horizontal" ? "pl-2" : "pt-2",
        className,
      )}
      {...props}
    />
  );
}

export { CarouselItem };
