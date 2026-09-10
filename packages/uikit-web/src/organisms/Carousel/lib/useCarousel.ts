"use client";

import * as React from "react";
// Type-only: this file describes the carousel's state, it never calls Embla.
// `Parameters<typeof …>` needs the binding, not the value behind it.
import type useEmblaCarousel from "embla-carousel-react";
import type { UseEmblaCarouselType } from "embla-carousel-react";

/** The Embla instance behind a `<Carousel />`. `undefined` until it mounts. */
type CarouselApi = UseEmblaCarouselType[1];

type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;

/** Embla's own options. `axis` is derived from `orientation` and ignored here. */
type CarouselOptions = UseCarouselParameters[0];

type CarouselPlugin = UseCarouselParameters[1];

type CarouselOrientation = "horizontal" | "vertical";

/**
 * How the carousel advances on its own. `autoplay` accepts `true` to take every
 * default, or this object to change one of them.
 */
type CarouselAutoplayOptions = {
  /** Milliseconds a slide stays before the next one. */
  delay?: number;
  /**
   * Stop for good the first time the user drags, clicks an arrow or focuses a
   * slide. The default restarts the timer instead, which is what a banner
   * carousel wants.
   */
  stopOnInteraction?: boolean;
  /** Hold while the pointer rests over the carousel. */
  stopOnMouseEnter?: boolean;
  /**
   * Only run while the carousel is on screen. A banner three screens down
   * otherwise burns through its slides before anyone has seen the first one.
   */
  playOnlyInView?: boolean;
};

/**
 * Classes for the parts the root renders itself, which are the parts `className`
 * cannot reach: the viewport and track it wraps the slides in, and the controls
 * it places from `showArrows` / `showPagination`.
 *
 * `Carousel` and `CarouselItem` are absent on purpose. A consumer writes those
 * two, so `className` on them is already the direct way in, and a key here would
 * be a second spelling of the same thing — the division is exactly that: your
 * own elements take `className`, the ones the component renders for you take a
 * key here.
 *
 * Each key names the same part as that part's test id suffix, so the two ways of
 * reaching a part agree without either pinning the layout that produces it: the
 * viewport is `classNames.content` and `<base>-content`.
 */
type CarouselClassNames = {
  /** The clipped viewport Embla measures — `-content`. */
  content?: string;
  /** The flex row of slides inside it — `-track`. */
  track?: string;
  /** The step-back arrow — `-previous`. */
  previous?: string;
  /** The step-forward arrow — `-next`. */
  next?: string;
  /** The row of dots — `-indicator`. */
  indicator?: string;
  /** One dot's hit area — `-indicator-dot`. */
  dot?: string;
  /** Added on top of `dot` for the slide currently in view. */
  activeDot?: string;
};

type CarouselContextValue = {
  carouselRef: UseEmblaCarouselType[0];
  api: CarouselApi;
  orientation: CarouselOrientation;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number) => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  /** Index into `scrollSnaps` of the position currently in view. */
  selectedIndex: number;
  // One entry per scroll position — which is not one per slide. With several
  // slides in view Embla groups them into fewer positions, and the indicator has
  // to draw a dot per position or the last dots become unreachable.
  //
  // A line comment, not a JSDoc block: `codegen:docs` hands the nearest
  // preceding block comment to the next declaration it finds, which here is
  // `CarouselContext` — a member's doc would end up published as the context's.
  scrollSnaps: number[];
  classNames?: CarouselClassNames;
  /**
   * Builds a part's `data-testid` from the base the consumer gave the root, so
   * every part the carousel renders for itself is addressable without each one
   * taking a prop of its own. Returns `undefined` throughout when no base was
   * passed, which is what keeps test ids out of a DOM that did not ask for them.
   */
  testIdFor: (part: string) => string | undefined;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

/**
 * Reads the carousel from inside it.
 *
 * Callable from a slide's own content, which is where it earns its keep — a
 * slide that dims itself while it is not the selected one, say. It is not the
 * way to build a control that sits *beside* the carousel: an unrecognised child
 * is treated as a slide and put in the clipped track, so anything of that shape
 * belongs outside the carousel, driven through `setApi`.
 *
 * @returns {CarouselContextValue} The enclosing carousel's state and controls
 * @throws {Error} When called outside a `<Carousel />`
 *
 * @example
 * ```tsx
 * function DimmedSlide({ index, children }) {
 *   const { selectedIndex } = useCarousel();
 *
 *   return (
 *     <CarouselItem className={index === selectedIndex ? undefined : "opacity-50"}>
 *       {children}
 *     </CarouselItem>
 *   );
 * }
 * ```
 */
function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

export {
  CarouselContext,
  useCarousel,
  type CarouselApi,
  type CarouselAutoplayOptions,
  type CarouselClassNames,
  type CarouselContextValue,
  type CarouselOptions,
  type CarouselOrientation,
  type CarouselPlugin,
};
