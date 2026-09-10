"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button, type ButtonProps } from "@/atoms/Button";
import { carouselArrowVariants, carouselDotVariants } from "@/organisms/Carousel/lib/utils";
import { useCarousel } from "@/organisms/Carousel/lib/useCarousel";
import { cn } from "@/lib/utils";

// Everything that moves the carousel without being part of it: the two arrows
// and the dot row. They are one file because they are one decision — a carousel
// either offers navigation or it does not — and because the root places them
// together from `showArrows` / `showPagination`.

type CarouselSide = "previous" | "next";

// camelCase, not SCREAMING_CASE: `codegen:docs` collects every top-level
// binding whose name starts with a capital, so a constant spelled `ARROWS`
// lands in `ai-docs.json` next to the real components.
const arrowsBySide = {
  previous: { label: "Previous slide", Icon: ArrowLeft },
  next: { label: "Next slide", Icon: ArrowRight },
} as const satisfies Record<CarouselSide, { label: string; Icon: React.ComponentType }>;

// Everything an arrow is regardless of direction: a `Button` positioned into
// the root grid's first row, disabled at the end of its travel.
//
// Internal — `CarouselPrevious` and `CarouselNext` are the pair consumers see.
function CarouselArrow({
  side,
  className,
  variant = "secondary",
  size = "sm",
  // Said rather than inferred. `button-base` also squares a button whose only child is
  // an svg, and that is what shaped these arrows before `icon` existed — but two
  // mechanisms for one intent means the day the implicit rule is retired as redundant,
  // these silently stop being square and only a baseline diff notices. Defaulted, not
  // hardcoded, so an arrow given a text label can turn it off.
  icon = true,
  children,
  ...props
}: ButtonProps & { side: CarouselSide }) {
  const {
    orientation,
    scrollPrev,
    scrollNext,
    canScrollPrev,
    canScrollNext,
    classNames,
    testIdFor,
  } = useCarousel();
  const { label, Icon } = arrowsBySide[side];
  const isPrevious = side === "previous";

  return (
    <Button
      data-testid={testIdFor(side)}
      variant={variant}
      size={size}
      icon={icon}
      aria-label={label}
      className={cn(
        carouselArrowVariants({ orientation, side }),
        isPrevious ? classNames?.previous : classNames?.next,
        className,
      )}
      disabled={isPrevious ? !canScrollPrev : !canScrollNext}
      onClick={isPrevious ? scrollPrev : scrollNext}
      {...props}
    >
      {children ?? <Icon aria-hidden />}
    </Button>
  );
}

/**
 * Steps back one scroll position, and disables itself at the start unless the
 * carousel loops.
 *
 * It is a `Button`, so every button prop passes through: a different icon goes
 * in as `children`, a different look as `variant`. The 32×32 secondary circle
 * the design asks for is `variant="secondary" size="sm" icon` — the `icon` axis
 * is what squares it and drops the side padding. Pass `icon={false}` if you
 * replace the arrow with a text label, which wants its padding back.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [variant='secondary'] - The button variant
 * @param {string} [size='sm'] - The button size
 * @param {boolean} [icon=true] - The icon-only shape. Turn it off for a text label
 * @param {React.ReactNode} [children] - Replaces the default arrow icon
 * @param {ButtonProps} props - Props for the button
 *
 * @example
 * ```tsx
 * <CarouselPrevious>
 *   <ChevronLeft aria-hidden />
 * </CarouselPrevious>
 * ```
 */
function CarouselPrevious(props: ButtonProps) {
  return <CarouselArrow side="previous" {...props} />;
}

/**
 * Steps forward one scroll position, and disables itself at the end unless the
 * carousel loops.
 *
 * It is a `Button`, so every button prop passes through: a different icon goes
 * in as `children`, a different look as `variant`. The 32×32 secondary circle
 * the design asks for is `variant="secondary" size="sm" icon` — the `icon` axis
 * is what squares it and drops the side padding. Pass `icon={false}` if you
 * replace the arrow with a text label, which wants its padding back.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [variant='secondary'] - The button variant
 * @param {string} [size='sm'] - The button size
 * @param {boolean} [icon=true] - The icon-only shape. Turn it off for a text label
 * @param {React.ReactNode} [children] - Replaces the default arrow icon
 * @param {ButtonProps} props - Props for the button
 *
 * @example
 * ```tsx
 * <CarouselNext>
 *   <ChevronRight aria-hidden />
 * </CarouselNext>
 * ```
 */
function CarouselNext(props: ButtonProps) {
  return <CarouselArrow side="next" {...props} />;
}

/**
 * A dot per scroll position, each one a real button that jumps to it.
 *
 * There is a dot per *position*, not per slide: with several slides in view
 * Embla groups them, and a dot per slide would leave the trailing dots pointing
 * at a position the carousel can never rest on.
 *
 * Renders nothing when the carousel has a single position — one dot tells the
 * reader nothing and still takes a row of height.
 *
 * @param {string} [className] - Additional CSS classes for the dot row
 * @param {React.ComponentProps<'div'>} props - Props for the dot row element
 *
 * @example
 * ```tsx
 * // Only needed to place the dots yourself — `showPagination` is the short way
 * <Carousel>
 *   {slides.map((slide) => (
 *     <CarouselItem key={slide.id}>{slide.content}</CarouselItem>
 *   ))}
 *   <CarouselIndicator />
 * </Carousel>
 * ```
 */
function CarouselIndicator({ className, ...props }: React.ComponentProps<"div">) {
  const { scrollSnaps, selectedIndex, scrollTo, classNames, testIdFor } = useCarousel();

  if (scrollSnaps.length < 2) return null;

  return (
    <div
      data-testid={testIdFor("indicator")}
      role="group"
      aria-label="Choose a slide to show"
      className={cn("flex w-full items-center justify-center", classNames?.indicator, className)}
      {...props}
    >
      {scrollSnaps.map((_, index) => {
        const isActive = index === selectedIndex;

        return (
          <button
            // The dot's identity *is* its position, so the index is the key
            // rather than a stand-in for one.
            key={index}
            type="button"
            data-testid={testIdFor("indicator-dot")}
            data-active={isActive || undefined}
            aria-label={`Slide ${index + 1} of ${scrollSnaps.length}`}
            aria-current={isActive || undefined}
            onClick={() => scrollTo(index)}
            className={cn(
              "flex h-3 shrink-0 cursor-pointer items-center p-1",
              "focus-visible:ring-border-state-focus outline-none focus-visible:ring-2",
              classNames?.dot,
              isActive && classNames?.activeDot,
            )}
          >
            <span aria-hidden className={carouselDotVariants({ active: isActive })} />
          </button>
        );
      })}
    </div>
  );
}

export { CarouselIndicator, CarouselNext, CarouselPrevious };
