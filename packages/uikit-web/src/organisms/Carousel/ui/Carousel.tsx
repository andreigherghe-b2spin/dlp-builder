"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";

import { useAutoplayGate, useAutoplayPlugins } from "@/organisms/Carousel/lib/useAutoplay";
import {
  CarouselContext,
  type CarouselApi,
  type CarouselAutoplayOptions,
  type CarouselClassNames,
  type CarouselOptions,
  type CarouselOrientation,
  type CarouselPlugin,
} from "@/organisms/Carousel/lib/useCarousel";
import { useWheelGestures } from "@/organisms/Carousel/lib/useWheelGestures";
import { CarouselContent } from "@/organisms/Carousel/ui/CarouselContent";
import {
  CarouselIndicator,
  CarouselNext,
  CarouselPrevious,
} from "@/organisms/Carousel/ui/CarouselNavigation";
import {
  resolveArrowDirection,
  resolveEmblaOptions,
  resolveSlideSize,
} from "@/organisms/Carousel/lib/utils";
import { cn, createTestIdFor } from "@/lib/utils";

// The three controls a consumer may place among the children. Everything else
// in `children` is a slide. Lowercase so `codegen:docs`, which collects every
// top-level binding starting with a capital, does not file it next to the real
// components.
const rootLevelParts = new Set<unknown>([CarouselIndicator, CarouselNext, CarouselPrevious]);

/**
 * Separates the slides from the controls sitting beside them.
 *
 * The slides go into the viewport and track the root builds for them, which is
 * what lets a carousel be written as `Carousel` > `CarouselItem` and nothing
 * else. The controls have to stay outside that track: it is clipped, so an
 * arrow swept into it would simply vanish.
 */
function splitChildren(children: React.ReactNode) {
  const parts: React.ReactElement[] = [];
  const slides: React.ReactNode[] = [];
  // Which of the three a consumer composed by hand, so `showArrows` /
  // `showPagination` can stand down rather than render a second one.
  const composedParts = new Set<unknown>();

  const collect = (nodes: React.ReactNode, prefix: string) => {
    // `toArray` over `forEach`: it flattens `.map()` results and gives every
    // child a stable key, including the ones written as literal JSX. What it
    // does *not* flatten is a fragment, so `<>{a}{b}</>` arrives as one element
    // — hence the recursion below. Without it a pair of arrows written inside a
    // fragment, or behind a `cond ? <>…</> : null`, would be filed as slides and
    // disappear into the clipped track.
    for (const child of React.Children.toArray(nodes)) {
      if (!React.isValidElement(child)) {
        slides.push(child);
        continue;
      }

      // The fragment's own key prefixes everything inside it. `toArray` numbers
      // the children it is handed from `.0` upwards and knows nothing of the call
      // above it, so a slide written directly and the first slide inside a
      // fragment both arrive as `.0` — two slides, one key, and React drops or
      // swaps one of them.
      if (child.type === React.Fragment) {
        collect((child.props as { children?: React.ReactNode }).children, `${prefix}${child.key}/`);
        continue;
      }

      if (rootLevelParts.has(child.type)) {
        parts.push(child);
        composedParts.add(child.type);
        continue;
      }

      slides.push(prefix ? React.cloneElement(child, { key: `${prefix}${child.key}` }) : child);
    }
  };

  collect(children, "");

  return { parts, composedParts, slides };
}

type CarouselProps = React.ComponentProps<"div"> & {
  /**
   * Embla's own options — `align`, `slidesToScroll`, and everything the named
   * props below do not cover. `axis` comes from `orientation` and cannot be set
   * here; `loop` and `startIndex` are overridden by `infiniteLoop` and
   * `initialSlide` when those are given, and left alone when they are not.
   */
  opts?: CarouselOptions;
  /**
   * Extra Embla plugins. A fresh array on every render is fine — Embla compares
   * plugin lists by their options, not by array identity, and a real difference
   * only triggers `reInit`, which keeps the current slide.
   */
  plugins?: CarouselPlugin;
  /** Which way the slides run. */
  orientation?: CarouselOrientation;
  /** Receives the Embla instance once it mounts, for imperative control. */
  setApi?: (api: CarouselApi) => void;
  /** Advance on a timer. `true` takes every default; an object tunes them. */
  autoplay?: boolean | CarouselAutoplayOptions;
  /** Wrap around at either end, so neither arrow ever disables. Embla's `loop`. */
  infiniteLoop?: boolean;
  /** Which slide to open on, counting from zero. Embla's `startIndex`. */
  initialSlide?: number;
  /**
   * The share of the carousel each slide gives up so the next one shows through
   * — the cue that there is more to come. `peek={10}` makes every slide 90% of
   * the track instead of all of it.
   *
   * Read it as roughly, not exactly, how much of the next slide appears: the
   * 8px gutter sits inside that sliver, so the neighbour's *content* shows
   * `peek%` minus 8px, and because the gutter is absolute rather than
   * proportional the pixel result shifts with the carousel's width. Figma's
   * proportions — 224px slides and a 24px sliver in a 256px box — are about
   * `peek={12}`. Tune it against the real content rather than deriving it.
   *
   * Slides align to the start when this is set, so the peek falls on the
   * trailing edge only; `opts={{ align: "center" }}` splits it across both.
   * A slide with its own `basis` in `className` opts out.
   */
  peek?: number;
  /**
   * Let a wheel or trackpad gesture along the carousel's axis move it, the way a
   * scroll container would. On by default: the carousels this replaces were
   * scroll containers, so losing the gesture reads as a bug rather than a
   * simplification. A gesture across the axis, or one at either end, is left to
   * the page.
   */
  wheelGestures?: boolean;
  /** Render the two arrows without composing them by hand. */
  showArrows?: boolean;
  /**
   * Render the dots without composing them by hand. Named for `B2Carousel`'s
   * prop; the part it renders keeps Figma's name, `CarouselIndicator`.
   */
  showPagination?: boolean;
  /**
   * Classes for the parts the root renders itself — the viewport, the track, the
   * arrows, the dots. The carousel and its slides take `className` instead,
   * because those two are yours to write.
   */
  classNames?: CarouselClassNames;
  /**
   * Names the carousel. Every part the root renders derives its own id from this
   * one — `-content`, `-track`, `-item`, `-previous`, `-next`, `-indicator`,
   * `-indicator-dot` — so one prop makes the whole component addressable.
   *
   * No default: without it no part carries a test id at all, which is what keeps
   * the attribute out of the DOM of a consumer who never asked for it. A slide can
   * still override its own with a `data-testid` of its own on `CarouselItem`.
   */
  "data-testid"?: string;
};

/**
 * A horizontally or vertically scrolling set of slides, built on Embla.
 *
 * Children are the slides. The root wraps them in the viewport Embla measures
 * and the track they lay out in, so a carousel is `Carousel` > `CarouselItem`
 * and nothing in between.
 *
 * Size it on the carousel itself with `className` — `className="h-46 w-96"` —
 * never with a class aimed at the viewport. A horizontal carousel needs only a
 * width; a vertical one also needs a height, since that is what tells Embla there
 * is anything to scroll. Either way a height flows down to the slides, so a
 * carousel without one sizes to its content, and one with a height stretches the
 * slides to fill it — content inside a slide then wants `h-full` to follow.
 *
 * The width and height are the carousel's outer box: it carries Figma's
 * `px-3 py-2` and box-sizing is `border-box`, so the slides get 24px less than
 * the width and the arrows sit inside that padding rather than outside the
 * component. `className="p-0"` takes it off.
 *
 * Controls come either from `showArrows` / `showPagination`, which place them
 * for you and are the whole of what a banner carousel needs, or as children —
 * `CarouselPrevious`, `CarouselNext`, `CarouselIndicator` — when the layout has
 * to say where one goes or an arrow needs a different icon. Those three are
 * recognised and kept out of the track; everything else among the children is
 * treated as a slide.
 *
 * The root is a one-column grid: the slides take the first row and the dots the
 * second, and the arrows are absolutely positioned into that first row. That is
 * what centres them on the slides rather than on slides-plus-dots, without a
 * wrapper element for the parts to be nested in.
 *
 * Give it an `aria-label` — "Promotions", "Top games" — or point `aria-labelledby`
 * at the heading above it. The root is a `region` with
 * `aria-roledescription="carousel"`, and two carousels on a page are two
 * landmarks a screen-reader user has to tell apart; a default label here would
 * name both of them the same and look filled in while doing it.
 *
 * @param {string} [className] - Additional CSS classes for the root
 * @param {('horizontal' | 'vertical')} [orientation='horizontal'] - Which way the slides run
 * @param {CarouselOptions} [opts] - Embla options; `axis` comes from `orientation`
 * @param {CarouselPlugin} [plugins] - Extra Embla plugins
 * @param {(api: CarouselApi) => void} [setApi] - Receives the Embla instance on mount
 * @param {boolean | CarouselAutoplayOptions} [autoplay] - Advance on a timer
 * @param {boolean} [infiniteLoop] - Wrap around at either end
 * @param {number} [initialSlide] - Which slide to open on, counting from zero
 * @param {number} [peek] - Percentage of the carousel left showing the next slide
 * @param {boolean} [wheelGestures=true] - Move on a wheel or trackpad gesture along the axis
 * @param {boolean} [showArrows=false] - Let the root render the two arrows
 * @param {boolean} [showPagination=false] - Let the root render the dots
 * @param {CarouselClassNames} [classNames] - Classes for the parts the root renders itself
 * @param {React.ReactNode} children - The carousel's parts
 * @param {string} [data-testid] - Names the carousel; the parts derive theirs from it
 * @param {React.ComponentProps<'div'>} props - Props for the root element
 *
 * @example
 * ```tsx
 * // Banner carousel: arrows and dots placed for you, autoplay paused off-screen
 * <Carousel showArrows showPagination autoplay infiniteLoop className="w-96">
 *   {banners.map((banner) => (
 *     <CarouselItem key={banner.id}>
 *       <img src={banner.src} alt={banner.alt} />
 *     </CarouselItem>
 *   ))}
 * </Carousel>
 * ```
 *
 * @example
 * ```tsx
 * // Three slides in view, with arrows carrying a different icon
 * <Carousel opts={{ align: "start" }} className="w-96">
 *   {items.map((item) => (
 *     <CarouselItem key={item.id} className="basis-1/3">{item.label}</CarouselItem>
 *   ))}
 *   <CarouselPrevious>
 *     <ChevronLeft aria-hidden />
 *   </CarouselPrevious>
 *   <CarouselNext>
 *     <ChevronRight aria-hidden />
 *   </CarouselNext>
 * </Carousel>
 * ```
 *
 * @cssVariables
 * Through `Button`, for the two arrows:
 * - `--components-button-border`
 * - `--components-button-radius`
 * - `--typography-font-family`
 * - `--typography-font-size-label-m`
 * - `--typography-font-weight-bold`
 * - `--color-background-brand-secondary-container`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-background-state-pressed`
 * - `--color-border-neutral-default`
 * - `--color-foreground-brand-on-secondary-container`
 * - `--color-foreground-state-disabled`
 *
 * Semantic colors, for the indicator:
 * - `--color-border-state-focus`
 * - `--color-foreground-on-page-default`
 * - `--color-foreground-on-page-muted`
 *
 * @see [Embla Carousel API](https://www.embla-carousel.com/api)
 */
function Carousel({
  orientation = "horizontal",
  opts,
  plugins,
  setApi,
  autoplay,
  infiniteLoop,
  initialSlide,
  peek,
  wheelGestures = true,
  showArrows = false,
  showPagination = false,
  classNames,
  className,
  style,
  children,
  onKeyDown,
  ...props
}: CarouselProps) {
  const testIdFor = createTestIdFor(props["data-testid"]);
  const allPlugins = useAutoplayPlugins(autoplay, plugins);
  const [carouselRef, api] = useEmblaCarousel(
    resolveEmblaOptions({ opts, orientation, infiniteLoop, initialSlide, peek }),
    allPlugins,
  );

  useAutoplayGate(api, autoplay);
  useWheelGestures(api, orientation, wheelGestures);

  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  const { parts, composedParts, slides } = splitChildren(children);

  const slideSize = resolveSlideSize(peek);

  const scrollPrev = () => api?.scrollPrev();
  const scrollNext = () => api?.scrollNext();
  const scrollTo = (index: number) => api?.scrollTo(index);

  React.useEffect(() => {
    if (!api || !setApi) return;

    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) return;

    const sync = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
      setSelectedIndex(api.selectedScrollSnap());
      setScrollSnaps(api.scrollSnapList());
    };

    // Once for the state the first render could not know, then follow Embla.
    sync();
    api.on("reInit", sync);
    api.on("select", sync);

    return () => {
      api.off("reInit", sync);
      api.off("select", sync);
    };
  }, [api]);

  // `onKeyDown` is pulled out of the props rather than left to the spread: the
  // spread would replace this handler outright and arrow-key navigation would
  // stop working with no error. The consumer's handler runs first and can opt
  // out of the carousel's by calling `preventDefault`.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented) return;

    // A text control inside a slide owns its own arrow keys.
    if (
      (event.target as HTMLElement).closest("input, textarea, select, [contenteditable='true']")
    ) {
      return;
    }

    const direction = resolveArrowDirection(orientation, event.key);

    if (!direction) return;

    event.preventDefault();

    if (direction === "previous") scrollPrev();
    else scrollNext();
  };

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        orientation,
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev,
        canScrollNext,
        selectedIndex,
        scrollSnaps,
        classNames,
        testIdFor,
      }}
    >
      <div
        role="region"
        aria-roledescription="carousel"
        data-orientation={orientation}
        onKeyDown={handleKeyDown}
        // Inline because the value is computed at runtime, which is the only
        // thing inline style is for here. The slides read it as their
        // `flex-basis`, so one number on the root resizes all of them.
        style={{ ...style, "--carousel-slide-size": slideSize } as React.CSSProperties}
        className={cn(
          "relative grid grid-cols-1 grid-rows-[minmax(0,1fr)] gap-3 px-3 py-2",
          className,
        )}
        {...props}
      >
        <CarouselContent>{slides}</CarouselContent>
        {parts}
        {/*
          A part composed by hand wins over the prop that renders the same one.
          The two routes are alternatives, and stacking them is not a harmless
          duplicate: two arrows land in the identical `[grid-area:1/1/2/2]
          -left-2 top-1/2` cell, where the prop-driven one covers the custom
          icon and takes its clicks, and two indicators occupy two grid rows.
        */}
        {showArrows && !composedParts.has(CarouselPrevious) ? <CarouselPrevious /> : null}
        {showArrows && !composedParts.has(CarouselNext) ? <CarouselNext /> : null}
        {showPagination && !composedParts.has(CarouselIndicator) ? <CarouselIndicator /> : null}
      </div>
    </CarouselContext.Provider>
  );
}

export { Carousel, splitChildren, type CarouselProps };
