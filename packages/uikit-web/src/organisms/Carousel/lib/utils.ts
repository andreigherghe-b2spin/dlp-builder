import { cva } from "class-variance-authority";

import type {
  CarouselAutoplayOptions,
  CarouselOptions,
  CarouselOrientation,
} from "@/organisms/Carousel/lib/useCarousel";

/**
 * The arrows are absolutely positioned into the root grid's first row — see the
 * note on `Carousel` — so they centre on the slides and ignore the indicator
 * row underneath. Figma hangs them 8px outside the stage on either side.
 *
 * Both end lines are spelled out, not just the start ones: for an absolutely
 * positioned grid child an `auto` end line resolves to the grid container's
 * padding edge rather than to "one track". `grid-area: 1/1` would therefore
 * give a containing block running to the bottom of the whole grid, and
 * `top-1/2` would centre the arrows on slides-plus-gap-plus-dots — 12px too
 * low the moment an indicator is present.
 */
const carouselArrowVariants = cva("absolute z-10 [grid-area:1/1/2/2]", {
  variants: {
    orientation: {
      horizontal: "top-1/2 -translate-y-1/2",
      vertical: "left-1/2 -translate-x-1/2 rotate-90",
    },
    side: {
      previous: "",
      next: "",
    },
  },
  compoundVariants: [
    { orientation: "horizontal", side: "previous", className: "-left-2" },
    { orientation: "horizontal", side: "next", className: "-right-2" },
    { orientation: "vertical", side: "previous", className: "-top-2" },
    { orientation: "vertical", side: "next", className: "-bottom-2" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    side: "previous",
  },
});

/**
 * The 2px mark inside a dot's hit area. Both the width and the colour are taken
 * from Figma's Carousel Indicator as it is drawn there — the wide mark is the
 * muted one, the narrow marks are full strength.
 */
const carouselDotVariants = cva(
  "h-0.5 rounded-full transition-all duration-200 ease-out motion-reduce:transition-none",
  {
    variants: {
      active: {
        true: "bg-foreground-on-page-muted w-6 opacity-30",
        false: "bg-foreground-on-page-default w-2",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

/** Everything `autoplay` leaves unsaid. */
const AUTOPLAY_DEFAULTS = {
  delay: 5000,
  stopOnInteraction: false,
  stopOnMouseEnter: true,
  playOnlyInView: true,
} satisfies Required<CarouselAutoplayOptions>;

/** Half the carousel on screen is enough to call it seen. */
const IN_VIEW_THRESHOLD = 0.5;

/**
 * Resolved key by key rather than by spreading the caller's object over the
 * defaults: object spread copies keys whose value is `undefined`, so
 * `autoplay={{ delay: props.delay }}` with `props.delay` unset would overwrite
 * the default with `undefined` instead of falling back to it — and for
 * `playOnlyInView` that silently turns the whole in-view gate off.
 */
function resolveAutoplayOptions(autoplay: boolean | CarouselAutoplayOptions | undefined) {
  const given = typeof autoplay === "object" ? autoplay : {};

  return {
    delay: given.delay ?? AUTOPLAY_DEFAULTS.delay,
    stopOnInteraction: given.stopOnInteraction ?? AUTOPLAY_DEFAULTS.stopOnInteraction,
    stopOnMouseEnter: given.stopOnMouseEnter ?? AUTOPLAY_DEFAULTS.stopOnMouseEnter,
    playOnlyInView: given.playOnlyInView ?? AUTOPLAY_DEFAULTS.playOnlyInView,
  };
}

/**
 * Whether enough of the carousel is on screen for autoplay to be worth running.
 *
 * Not `entry.isIntersecting`, which is what an observer reports for a single
 * visible pixel: `threshold` decides when the callback *fires*, never what the
 * entry says, so the threshold has to be re-applied to the ratio by hand or it
 * has no effect at all.
 *
 * The second clause is for a carousel taller than `1 / IN_VIEW_THRESHOLD`
 * viewports, whose ratio can never reach the threshold however far it is
 * scrolled — there, holding out for the ratio would mean autoplay that never
 * starts, so any of it on screen counts.
 */
function isSeen(entry: IntersectionObserverEntry) {
  if (!entry.isIntersecting) return false;
  if (entry.intersectionRatio >= IN_VIEW_THRESHOLD) return true;

  const viewport = entry.rootBounds;

  return viewport !== null && entry.boundingClientRect.height > viewport.height / IN_VIEW_THRESHOLD;
}

// `WheelEvent.DOM_DELTA_*` spelled out rather than read off the global, so this
// stays a pure function: the constants are fixed by the UI Events spec, and
// reaching for `WheelEvent` would make the helper need a window to be called in.
const WHEEL_DELTA_LINE = 1;
const WHEEL_DELTA_PAGE = 2;
const WHEEL_LINE_HEIGHT = 16;
const WHEEL_PAGE_HEIGHT = 400;

/**
 * A wheel event's travel along one axis, in pixels.
 *
 * `deltaMode` decides what the numbers mean: pixels from a trackpad, lines from
 * most mouse wheels, pages from a few. Without normalising, one notch of a
 * line-mode wheel reads as three pixels and the gesture never reaches a step.
 */
function wheelDeltaInPixels(delta: number, deltaMode: number) {
  if (deltaMode === WHEEL_DELTA_LINE) return delta * WHEEL_LINE_HEIGHT;
  if (deltaMode === WHEEL_DELTA_PAGE) return delta * WHEEL_PAGE_HEIGHT;

  return delta;
}

/**
 * What every `CarouselItem` uses as its `flex-basis`. Always a value, so the
 * slides can name the variable unconditionally and never need a fallback.
 */
function resolveSlideSize(peek: number | undefined) {
  return peek === undefined ? "100%" : `calc(100% - ${peek}%)`;
}

/**
 * Embla's options, with the named props layered over whatever `opts` carried.
 *
 * Each of the three spreads is `null` when its prop was not given, so `opts`
 * survives untouched — `opts={{ loop: true }}` on its own still loops. `axis` is
 * the exception: it comes from `orientation` and cannot be set through `opts`,
 * because the component's own layout depends on knowing it.
 */
function resolveEmblaOptions({
  opts,
  orientation,
  infiniteLoop,
  initialSlide,
  peek,
}: {
  opts?: CarouselOptions;
  orientation: CarouselOrientation;
  infiniteLoop?: boolean;
  initialSlide?: number;
  peek?: number;
  // Annotated rather than inferred: the inferred shape reaches into Embla's own
  // internal component types, which cannot be named from here and make the
  // declaration non-portable (TS2742).
}): NonNullable<CarouselOptions> {
  return {
    ...opts,
    axis: orientation === "horizontal" ? ("x" as const) : ("y" as const),
    ...(infiniteLoop === undefined ? null : { loop: infiniteLoop }),
    ...(initialSlide === undefined ? null : { startIndex: initialSlide }),
    // A peek only reads as "there is more this way" when it sits on one edge.
    // Embla centres by default, which would split it across both — so `peek`
    // brings its own alignment, and an explicit `opts.align` still overrides.
    ...(peek === undefined || opts?.align !== undefined ? null : { align: "start" as const }),
  };
}

/**
 * Which way an arrow key moves this carousel, or `null` when the key is not one
 * of its two. Horizontal follows left/right, vertical up/down, so the keys match
 * the direction the slides actually travel.
 */
function resolveArrowDirection(orientation: CarouselOrientation, key: string) {
  const [back, forward] =
    orientation === "horizontal" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];

  if (key === back) return "previous" as const;
  if (key === forward) return "next" as const;

  return null;
}

export {
  AUTOPLAY_DEFAULTS,
  IN_VIEW_THRESHOLD,
  carouselArrowVariants,
  carouselDotVariants,
  isSeen,
  resolveArrowDirection,
  resolveAutoplayOptions,
  resolveEmblaOptions,
  resolveSlideSize,
  wheelDeltaInPixels,
};
