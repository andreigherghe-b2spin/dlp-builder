"use client";

import * as React from "react";

import type { CarouselApi, CarouselOrientation } from "@/organisms/Carousel/lib/useCarousel";
import { wheelDeltaInPixels } from "@/organisms/Carousel/lib/utils";

/** Travel that counts as one slide. Tuned against a trackpad, not derived. */
const WHEEL_STEP = 60;

/** How long a gesture may pause before its leftover travel is forgotten. */
const WHEEL_REST_MS = 120;

/**
 * Moves the carousel from a wheel or trackpad gesture along its own axis.
 *
 * Embla has no wheel handling of its own — its core listens for `touchstart` and
 * `keydown` and nothing else — and the viewport is `overflow: hidden`, so without
 * this a two-finger flick does nothing at all. That is a regression against the
 * scroll containers this component replaces, where the gesture came free from the
 * platform.
 *
 * What it deliberately does not claim: a gesture whose dominant axis is not the
 * carousel's, and any gesture once the carousel has run out of travel that way.
 * Both are left to the page, so a vertical scroll over a horizontal carousel
 * still scrolls the page, and a horizontal carousel at its last slide stops
 * swallowing flicks.
 */
function useWheelGestures(api: CarouselApi, orientation: CarouselOrientation, enabled: boolean) {
  React.useEffect(() => {
    if (!enabled || !api) return;

    const viewport = api.rootNode();
    let travelled = 0;
    let restTimer = 0;

    const onWheel = (event: WheelEvent) => {
      const isHorizontal = orientation === "horizontal";
      const along = isHorizontal ? event.deltaX : event.deltaY;
      const across = isHorizontal ? event.deltaY : event.deltaX;

      if (Math.abs(along) <= Math.abs(across)) return;
      if (along > 0 ? !api.canScrollNext() : !api.canScrollPrev()) return;

      event.preventDefault();

      travelled += wheelDeltaInPixels(along, event.deltaMode);

      // A gesture arrives as a burst of small deltas, so the leftover has to
      // survive between them — but not until the next gesture, or two flicks
      // minutes apart would add up into one step.
      window.clearTimeout(restTimer);
      restTimer = window.setTimeout(() => {
        travelled = 0;
      }, WHEEL_REST_MS);

      // A loop rather than one step per event: a long flick should move as far as
      // it would have scrolled, not one slide however hard it was thrown.
      while (Math.abs(travelled) >= WHEEL_STEP) {
        if (travelled > 0) {
          travelled -= WHEEL_STEP;
          api.scrollNext();
        } else {
          travelled += WHEEL_STEP;
          api.scrollPrev();
        }
      }
    };

    // Not React's `onWheel`: React registers wheel listeners passively at the
    // root, where `preventDefault` is a no-op and the browser would scroll the
    // page as well as the carousel.
    viewport.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      viewport.removeEventListener("wheel", onWheel);
      window.clearTimeout(restTimer);
    };
  }, [api, orientation, enabled]);
}

export { useWheelGestures };
