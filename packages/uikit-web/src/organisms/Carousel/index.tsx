"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the ones on the files behind
// this barrel are dropped on the way into dist/. So the boundary is declared
// here, where the built consumer actually sees it. Every export below is
// client-only anyway: they render Radix primitives and read React context.

/**
 * The carousel's single entry point: `@ui/web/Carousel` resolves here, and
 * nothing outside this directory imports any deeper.
 *
 * A carousel is `Carousel` > `CarouselItem` and nothing in between. The
 * viewport Embla measures and the track the slides lay out in are built by the
 * root — they are two elements with a job, not a decision, and every call site
 * spelled them identically. They stay reachable as `classNames.content` /
 * `classNames.track`, and by test id once the carousel is given a
 * `data-testid`.
 *
 * `CarouselPrevious`, `CarouselNext` and `CarouselIndicator` are the controls.
 * The root places them for you from `showArrows` / `showPagination`; pass them
 * as children instead when the layout has to say where one goes, or when an
 * arrow needs a different icon. Those three are the only children exempt from
 * being treated as slides — a control the design system does not ship goes
 * *outside* the carousel and drives it through `setApi`, because a child the
 * root does not recognise ends up in the clipped track.
 *
 * `lib/` is internal: the context behind `useCarousel`, the autoplay wiring, and
 * the `*Variants` behind the arrows and the dots. A consumer restyles the
 * carousel through `classNames`, whose keys name the same parts as the test ids
 * derived from `data-testid` — neither pins the layout that produces them.
 *
 * ## Coming from `B2Carousel`
 *
 * Most of it carries its own name across:
 *
 * | `B2Carousel`                          | here                                          |
 * | ------------------------------------- | --------------------------------------------- |
 * | `showArrows`                          | `showArrows`                                  |
 * | `showPagination`                      | `showPagination`                              |
 * | `infiniteLoop`                        | `infiniteLoop`                                |
 * | `initialSlide`                        | `initialSlide`, counted from zero             |
 * | `autoScroll` + `autoScrollInterval`   | `autoplay={{ delay }}`                        |
 * | `autoscrollDelayValueAfterUserAction` | `autoplay={{ stopOnInteraction: false }}`     |
 * | `classNameContainer`                  | `classNames.content`                          |
 * | `prevArrowClassName`                  | `classNames.previous`                         |
 * | `nextArrowClassName`                  | `classNames.next`                             |
 * | `dotClassName` / `activeDotClassName` | `classNames.dot` / `classNames.activeDot`     |
 * | `ArrowIcon`                           | `<CarouselPrevious>{icon}</CarouselPrevious>` |
 * | `scrollCallback`                      | `setApi` + `api.on("select", …)`              |
 *
 * The rest of `B2Carousel`'s props — `paginationThreshold`, `scrollTolerance`,
 * `scrolledItemDataAttr`, `shouldThrottle`, `customScroll`, `pathname`,
 * `scrollPage`, `scrollToEndEnabled` — existed to drive its hand-written scroll
 * maths and have no counterpart: Embla measures the slides itself.
 */
export { Carousel, type CarouselProps } from "@/organisms/Carousel/ui/Carousel";
export { CarouselItem } from "@/organisms/Carousel/ui/CarouselItem";
export {
  CarouselIndicator,
  CarouselNext,
  CarouselPrevious,
} from "@/organisms/Carousel/ui/CarouselNavigation";
export {
  useCarousel,
  type CarouselApi,
  type CarouselAutoplayOptions,
  type CarouselClassNames,
  type CarouselOptions,
  type CarouselOrientation,
  type CarouselPlugin,
} from "@/organisms/Carousel/lib/useCarousel";
