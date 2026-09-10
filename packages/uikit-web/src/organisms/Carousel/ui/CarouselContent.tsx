"use client";

import * as React from "react";

import { useCarousel } from "@/organisms/Carousel/lib/useCarousel";
import { cn } from "@/lib/utils";

/**
 * The clipped viewport Embla measures, wrapping the track the slides lay out
 * in. Two elements, because Embla needs one box to measure and clip and
 * another to move.
 *
 * Internal: `Carousel` puts this around its children itself, so a carousel is
 * written as `Carousel` > `CarouselItem` with nothing in between. Both
 * elements are still reachable for styling — `classNames.content` for the
 * viewport, `classNames.track` for the track — and both carry a test id derived
 * from the carousel's own.
 */
function CarouselContent({ children }: { children: React.ReactNode }) {
  const { carouselRef, orientation, classNames, testIdFor } = useCarousel();

  return (
    <div
      ref={carouselRef}
      data-testid={testIdFor("content")}
      // Pinned to the root grid's first row, which is the cell the arrows
      // anchor to as well — that is what keeps them centred on the slides
      // rather than on slides-plus-indicator.
      className={cn("overflow-hidden [grid-area:1/1]", classNames?.content)}
    >
      <div
        data-testid={testIdFor("track")}
        className={cn(
          "flex",
          orientation === "horizontal"
            ? "-ml-2 h-full"
            : "-mt-2 h-[calc(100%+var(--spacing)*2)] flex-col",
          classNames?.track,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export { CarouselContent };
