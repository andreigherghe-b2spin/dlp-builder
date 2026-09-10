import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Carousel,
  type CarouselApi,
  type CarouselProps,
} from "@/organisms/Carousel";

const WIDTH = 384;
const HEIGHT = 200;

// A slide hangs 8px past the viewport, because the gutter is padding in its own
// box, so "on screen" is a share and not containment. 0.85 also clears the 0.94 a
// slide measures when three share the track, and stays clear of a `peek` sliver.
const ON_SCREEN = 0.85;

type Position = { dot: number; onScreen: (string | null)[] };

function slides(count: number, className?: string) {
  return Array.from({ length: count }, (_, slide) => (
    <CarouselItem key={slide + 1} className={className}>
      <div style={{ height: 120 }}>Slide {slide + 1}</div>
    </CarouselItem>
  ));
}

async function mountCarousel({
  slideCount = 4,
  slideClassName,
  children,
  ...props
}: Partial<CarouselProps> & { slideCount?: number; slideClassName?: string } = {}) {
  const vertical = props.orientation === "vertical";
  const view = await render(
    <Carousel
      aria-label="Offers"
      // The base every part derives its id from, so the names below — `carousel`,
      // `carousel-content`, `carousel-indicator-dot` — are what the DOM carries.
      // Nothing is addressable without it: `createTestIdFor` returns `undefined`
      // for every part when the root was not named.
      data-testid="carousel"
      style={vertical ? { width: WIDTH, height: HEIGHT } : { width: WIDTH }}
      {...props}
      // Embla's own scroll animation, ~350ms at its default of 25 — and there are
      // some two dozen scrolls in this file, each of them waited out. Nothing here
      // asserts how long a slide takes to travel, only where it comes to rest, so the
      // file runs the travel at a quarter of that. Last, and merging `props.opts`
      // rather than replacing it, so a case can still pass its own `align` — or its
      // own `duration`, if one ever needs the speed a user sees.
      opts={{ duration: 10, ...props.opts }}
    >
      {children ?? slides(slideCount, slideClassName)}
    </Carousel>,
  );
  // Scoped to this render, since `getByTestId` otherwise searches the whole page.
  const within = page.elementLocator(view.container);
  const one = (testId: string) => within.getByTestId(testId).element() as HTMLElement;
  const all = (testId: string) => within.getByTestId(testId).elements() as HTMLElement[];

  const content = () => one("carousel-content");
  const track = () => one("carousel-track");
  const slideNodes = () => all("carousel-item");
  const dots = () => all("carousel-indicator-dot");
  const arrow = (side: "previous" | "next") => one(`carousel-${side}`) as HTMLButtonElement;
  const count = (testId: string) => all(testId).length;

  const shareOf = (slide: HTMLElement) => {
    const viewport = content().getBoundingClientRect();
    const box = slide.getBoundingClientRect();
    const [start, end, size] = vertical
      ? (["top", "bottom", "height"] as const)
      : (["left", "right", "width"] as const);
    const overlap = Math.min(box[end], viewport[end]) - Math.max(box[start], viewport[start]);

    return Math.max(0, overlap) / box[size];
  };

  const position = (): Position => ({
    dot: dots().findIndex((dot) => dot.hasAttribute("data-active")),
    onScreen: slideNodes()
      .filter((slide) => shareOf(slide) >= ON_SCREEN)
      .map((slide) => slide.textContent),
  });

  const translate = () => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(track()).transform);

    return vertical ? matrix.f : matrix.e;
  };

  // Half a pixel over 100ms, not an unchanged transform: Embla approaches its snap
  // asymptotically and was still creeping 0.25px a frame a second after a step.
  // Milliseconds rather than frames, because the headless frame rate is not 60.
  const settled = async () => {
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const startedAt = performance.now();
    let previous = translate();
    let restingSince = startedAt;

    while (performance.now() - startedAt < 4000) {
      await nextFrame();

      const current = translate();

      if (Math.abs(current - previous) > 0.5) restingSince = performance.now();
      previous = current;

      if (performance.now() - restingSince >= 100) return;
    }

    throw new Error("the carousel never stopped moving");
  };

  // A slide passes through 86% visible on its way, so the position has to be both
  // reached and held — measuring during the animation reads the wrong place.
  const expectPosition = async (expected: Position) => {
    await vi.waitFor(() => expect(position()).toEqual(expected), { timeout: 4000, interval: 30 });
    await settled();

    expect(position()).toEqual(expected);
  };

  const expectStill = async (expected: Position, ms = 400) => {
    await new Promise((resolve) => setTimeout(resolve, ms));

    expect(position()).toEqual(expected);
  };

  /**
   * A wheel gesture, dispatched on a slide so it reaches the listener the way a
   * real one does: `useWheelGestures` registers on Embla's root node with
   * `{ passive: false }`, and a bubbling event finds it wherever that node is.
   *
   * `userEvent` has no wheel, and what these tests are about is the handler's own
   * arithmetic — how much travel becomes how many slides — rather than whether
   * Chromium delivers trackpad events, which is not ours to break.
   *
   * Returns the event, so a test can ask whether the carousel claimed the gesture
   * or left it to the page.
   */
  const wheel = (deltas: { deltaX?: number; deltaY?: number; deltaMode?: number }) => {
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaX: 0,
      deltaY: 0,
      deltaMode: 0,
      ...deltas,
    });

    slideNodes()[0].dispatchEvent(event);

    return event;
  };

  return {
    root: one("carousel"),
    view,
    arrow,
    content,
    count,
    dots,
    expectPosition,
    expectStill,
    position,
    settled,
    shareOf,
    slides: slideNodes,
    track,
    wheel,
  };
}

type Carousel = Awaited<ReturnType<typeof mountCarousel>>;

/**
 * Waits until a slide the carousel moved to on its own is both marked and mostly on
 * screen — the same two readings every other case here takes, but waited for rather
 * than settled.
 *
 * Nothing is settled because nothing comes to rest: autoplay's next tick is already
 * on its way, so "the transform stopped moving" is not a claim these two cases can
 * make. Embla marks the new snap when the travel *starts*, so the share is what says
 * the slide actually arrived.
 */
const arrivedAt = (carousel: Carousel, slide: number) =>
  vi.waitFor(
    () => {
      expect(carousel.position().dot).toBe(slide);
      expect(carousel.shareOf(carousel.slides()[slide])).toBeGreaterThan(ON_SCREEN);
    },
    { timeout: 4000, interval: 30 },
  );

// The slider doing its job: a control is used, and a particular slide ends up in
// front of the viewport. Every position is checked twice over — where the slides
// physically are, and which dot the indicator marks — because either on its own
// passes a carousel that is half broken.

describe("the layout everything else here measures", () => {
  it("gives each slide the whole viewport, as the CSS says", async () => {
    // Without compiled Tailwind every slide would be auto-width, the whole track
    // would fit on screen, and a carousel that never scrolls would pass by doing
    // nothing — which would quietly invalidate every other test here.
    const carousel = await mountCarousel({ slideCount: 4 });

    expect(carousel.content().getBoundingClientRect().width).toBe(360);
    expect(carousel.slides()[0].getBoundingClientRect().width).toBe(368);
    expect(carousel.shareOf(carousel.slides()[1])).toBe(0);
  });
});

describe("what a screen reader is told", () => {
  it("announces itself as a carousel, and its slides as slides", async () => {
    // Two carousels on a page are two regions, and the name is the only thing that
    // separates them — so a carousel whose label never reaches the root is one a
    // screen reader cannot tell apart from the next one.
    const carousel = await mountCarousel({ slideCount: 4 });

    expect(carousel.root).toHaveAttribute("role", "region");
    expect(carousel.root).toHaveAttribute("aria-roledescription", "carousel");
    expect(carousel.root).toHaveAccessibleName("Offers");

    const [first] = carousel.slides();

    expect(first).toHaveAttribute("role", "group");
    expect(first).toHaveAttribute("aria-roledescription", "slide");
  });
});

describe("which controls it renders", () => {
  it("renders neither arrows nor dots until it is asked to", async () => {
    const carousel = await mountCarousel({ slideCount: 4 });

    expect(carousel.count("carousel-previous")).toBe(0);
    expect(carousel.count("carousel-next")).toBe(0);
    expect(carousel.count("carousel-indicator")).toBe(0);
    expect(carousel.slides()).toHaveLength(4);
  });

  it("renders the two arrows for `showArrows`, named for a screen reader", async () => {
    const carousel = await mountCarousel({ showArrows: true, slideCount: 4 });

    expect(carousel.arrow("previous")).toHaveAccessibleName("Previous slide");
    expect(carousel.arrow("next")).toHaveAccessibleName("Next slide");
    expect(carousel.count("carousel-indicator")).toBe(0);
  });

  it("renders the dots for `showPagination`, one per position", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 5 });

    expect(carousel.count("carousel-indicator")).toBe(1);
    expect(carousel.dots()).toHaveLength(5);
    expect(carousel.dots()[0]).toHaveAccessibleName("Slide 1 of 5");
    expect(carousel.count("carousel-next")).toBe(0);
  });

  it("renders no dot row for a carousel that cannot scroll", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 1 });

    expect(carousel.count("carousel-indicator")).toBe(0);
  });

  it("uses the arrows a consumer composed instead of rendering its own", async () => {
    const carousel = await mountCarousel({
      showArrows: true,
      showPagination: true,
      children: (
        <>
          {slides(4)}
          <CarouselPrevious aria-label="Back" />
          <CarouselNext aria-label="Forward" />
        </>
      ),
    });

    // One of each, not two stacked in the same grid cell — and outside the clipped
    // track, which is the only reason a control is visible at all.
    expect(carousel.count("carousel-next")).toBe(1);
    expect(carousel.arrow("next")).toHaveAccessibleName("Forward");
    expect(carousel.track().contains(carousel.arrow("next"))).toBe(false);

    await userEvent.click(carousel.arrow("next"));
    await carousel.expectPosition({ dot: 1, onScreen: ["Slide 2"] });
  });
});

describe("moving it with the arrows", () => {
  it("opens on the first slide, with nowhere to go back to", async () => {
    const carousel = await mountCarousel({
      showArrows: true,
      showPagination: true,
      slideCount: 5,
    });

    await carousel.expectPosition({ dot: 0, onScreen: ["Slide 1"] });
    expect(carousel.arrow("previous")).toBeDisabled();
    expect(carousel.arrow("next")).toBeEnabled();
  });

  it("steps to the next slide and back again", async () => {
    const carousel = await mountCarousel({
      showArrows: true,
      showPagination: true,
      slideCount: 5,
    });

    await userEvent.click(carousel.arrow("next"));
    await carousel.expectPosition({ dot: 1, onScreen: ["Slide 2"] });
    expect(carousel.arrow("previous")).toBeEnabled();

    await userEvent.click(carousel.arrow("previous"));
    await carousel.expectPosition({ dot: 0, onScreen: ["Slide 1"] });
    expect(carousel.arrow("previous")).toBeDisabled();
  });

  it("runs out of travel at the last slide", async () => {
    const carousel = await mountCarousel({
      showArrows: true,
      showPagination: true,
      slideCount: 3,
    });

    await userEvent.click(carousel.arrow("next"));
    await userEvent.click(carousel.arrow("next"));

    await carousel.expectPosition({ dot: 2, onScreen: ["Slide 3"] });
    expect(carousel.arrow("next")).toBeDisabled();
    await carousel.expectStill({ dot: 2, onScreen: ["Slide 3"] });
  });

  it("wraps at either end when it loops, and keeps both arrows live", async () => {
    const carousel = await mountCarousel({
      showArrows: true,
      showPagination: true,
      infiniteLoop: true,
      slideCount: 4,
    });

    expect(carousel.arrow("previous")).toBeEnabled();

    await userEvent.click(carousel.arrow("previous"));
    await carousel.expectPosition({ dot: 3, onScreen: ["Slide 4"] });

    await userEvent.click(carousel.arrow("next"));
    await carousel.expectPosition({ dot: 0, onScreen: ["Slide 1"] });
  });
});

describe("moving it with the dots", () => {
  it("jumps straight to the position a dot stands for", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 5 });

    await userEvent.click(carousel.dots()[3]);

    await carousel.expectPosition({ dot: 3, onScreen: ["Slide 4"] });
    expect(carousel.dots()[3]).toHaveAttribute("aria-current", "true");
    expect(carousel.dots()[0]).not.toHaveAttribute("aria-current");
  });
});

describe("moving it with the keyboard", () => {
  it("follows the axis a horizontal carousel travels on", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 4 });

    // Clicking the first dot changes nothing and leaves it focused, which is where
    // the keys go next: the handler is on the root and the keypress bubbles to it.
    await userEvent.click(carousel.dots()[0]);
    await userEvent.keyboard("{ArrowRight}");
    await carousel.expectPosition({ dot: 1, onScreen: ["Slide 2"] });

    await userEvent.keyboard("{ArrowLeft}");
    await carousel.expectPosition({ dot: 0, onScreen: ["Slide 1"] });
  });

  it("leaves the arrow keys to a text field inside a slide", async () => {
    const carousel = await mountCarousel({
      showPagination: true,
      children: (
        <>
          <CarouselItem>
            Slide 1
            <input aria-label="Promo code" defaultValue="SPIN" />
          </CarouselItem>
          {slides(3)}
        </>
      ),
    });

    await carousel.view.getByLabelText("Promo code").click();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");

    await carousel.expectStill({ dot: 0, onScreen: ["Slide 1"] });
  });
});

// The travel that counts as one slide, from `useWheelGestures`. The deltas below
// are chosen to sit either side of it rather than to look like a real trackpad.
const WHEEL_STEP = 60;

/**
 * Waits out the hook's own rest window — comfortably past the 120ms it forgets
 * leftover travel after.
 *
 * A duration rather than a condition, and named so it reads as one: what has to
 * elapse here is a timer inside the code under test, and there is nothing
 * observable to wait for. Two flicks minutes apart must not add up into one step,
 * and this is that rule at a scale a test can sit through.
 */
const gestureRests = () => new Promise((resolve) => setTimeout(resolve, 250));

// Embla has no wheel handling of its own and the viewport is `overflow: hidden`, so
// every one of these behaviours is the hook's rather than the platform's — and the
// two it declines are as much the point as the two it claims.

describe("moving it with the wheel", () => {
  it("steps along its own axis, and claims the gesture while it does", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 5 });

    const event = carousel.wheel({ deltaX: WHEEL_STEP + 20 });

    // Claimed, so the page does not scroll as well as the carousel — which is the
    // reason the listener is a DOM one and not React's passive `onWheel`.
    expect(event.defaultPrevented).toBe(true);
    await carousel.expectPosition({ dot: 1, onScreen: ["Slide 2"] });
  });

  it("comes back on a gesture the other way", async () => {
    const carousel = await mountCarousel({
      showPagination: true,
      slideCount: 5,
      initialSlide: 2,
    });

    carousel.wheel({ deltaX: -(WHEEL_STEP + 20) });

    await carousel.expectPosition({ dot: 1, onScreen: ["Slide 2"] });
  });

  it("moves as far as the flick was thrown, not one slide per event", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 5 });

    carousel.wheel({ deltaX: WHEEL_STEP * 3 + 20 });

    await carousel.expectPosition({ dot: 3, onScreen: ["Slide 4"] });
  });

  it("adds up the burst of small deltas one gesture arrives as", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 5 });

    // Neither reaches a step on its own; together they do.
    carousel.wheel({ deltaX: 40 });
    carousel.wheel({ deltaX: 40 });

    await carousel.expectPosition({ dot: 1, onScreen: ["Slide 2"] });
  });

  it("forgets what is left over once the gesture has rested", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 5 });

    carousel.wheel({ deltaX: 40 });
    await gestureRests();
    carousel.wheel({ deltaX: 40 });

    await carousel.expectStill({ dot: 0, onScreen: ["Slide 1"] });
  });

  it("reads a line-mode wheel in pixels", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 5 });

    // Four lines is 64px — a step. Unnormalised it would read as 4 and the gesture
    // would never reach one.
    carousel.wheel({ deltaX: 4, deltaMode: 1 });

    await carousel.expectPosition({ dot: 1, onScreen: ["Slide 2"] });
  });

  it("leaves a gesture across its axis to the page", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 5 });

    const event = carousel.wheel({ deltaY: WHEEL_STEP * 4 });

    expect(event.defaultPrevented).toBe(false);
    await carousel.expectStill({ dot: 0, onScreen: ["Slide 1"] });
  });

  it("stops swallowing flicks once it has run out of travel that way", async () => {
    const carousel = await mountCarousel({ showPagination: true, slideCount: 3 });

    // At the first slide there is nowhere back to, so the gesture is the page's.
    expect(carousel.wheel({ deltaX: -(WHEEL_STEP + 20) }).defaultPrevented).toBe(false);

    await userEvent.click(carousel.dots()[2]);
    await carousel.expectPosition({ dot: 2, onScreen: ["Slide 3"] });

    expect(carousel.wheel({ deltaX: WHEEL_STEP + 20 }).defaultPrevented).toBe(false);
    await carousel.expectStill({ dot: 2, onScreen: ["Slide 3"] });
  });

  it("follows the down-the-page axis when the carousel is vertical", async () => {
    const carousel = await mountCarousel({
      orientation: "vertical",
      showPagination: true,
      slideCount: 4,
    });

    carousel.wheel({ deltaY: WHEEL_STEP + 20 });
    await carousel.expectPosition({ dot: 1, onScreen: ["Slide 2"] });

    // Across the axis still belongs to the page, the same way the arrow keys do.
    expect(carousel.wheel({ deltaX: WHEEL_STEP * 4 }).defaultPrevented).toBe(false);
    await carousel.expectStill({ dot: 1, onScreen: ["Slide 2"] });
  });

  it("registers no listener at all when the gesture is turned off", async () => {
    const carousel = await mountCarousel({
      showPagination: true,
      slideCount: 5,
      wheelGestures: false,
    });

    const event = carousel.wheel({ deltaX: WHEEL_STEP * 4 });

    expect(event.defaultPrevented).toBe(false);
    await carousel.expectStill({ dot: 0, onScreen: ["Slide 1"] });
  });
});

describe("how much it shows and where it opens", () => {
  it("shows several slides at once, and counts positions rather than slides", async () => {
    // Three at a time out of eight is six places it can rest, worked out by Embla
    // from the widths. A dot per slide would leave the last two pointing at a
    // position the carousel can never stop on.
    const carousel = await mountCarousel({
      showArrows: true,
      showPagination: true,
      slideCount: 8,
      slideClassName: "basis-1/3",
      opts: { align: "start" },
    });

    await carousel.expectPosition({ dot: 0, onScreen: ["Slide 1", "Slide 2", "Slide 3"] });
    expect(carousel.slides()).toHaveLength(8);
    expect(carousel.dots()).toHaveLength(6);

    await userEvent.click(carousel.dots()[5]);

    await carousel.expectPosition({ dot: 5, onScreen: ["Slide 6", "Slide 7", "Slide 8"] });
    expect(carousel.arrow("next")).toBeDisabled();
  });

  it("opens on the slide `initialSlide` names, counting from zero", async () => {
    const carousel = await mountCarousel({
      showArrows: true,
      showPagination: true,
      slideCount: 5,
      initialSlide: 2,
    });

    await carousel.expectPosition({ dot: 2, onScreen: ["Slide 3"] });
    // It opened there rather than scrolling to it, so going back is already live.
    expect(carousel.arrow("previous")).toBeEnabled();
  });

  it("leaves a sliver of the next slide showing with `peek`", async () => {
    const carousel = await mountCarousel({
      showArrows: true,
      showPagination: true,
      slideCount: 5,
      peek: 12,
    });

    await carousel.expectPosition({ dot: 0, onScreen: ["Slide 1"] });
    expect(carousel.shareOf(carousel.slides()[1])).toBeGreaterThan(0.05);
    expect(carousel.shareOf(carousel.slides()[1])).toBeLessThan(0.5);

    await userEvent.click(carousel.arrow("next"));
    await carousel.expectPosition({ dot: 1, onScreen: ["Slide 2"] });
    expect(carousel.shareOf(carousel.slides()[2])).toBeGreaterThan(0.05);
    expect(carousel.shareOf(carousel.slides()[0])).toBe(0);
  });

  it("runs the slides down the page when it is vertical", async () => {
    const carousel = await mountCarousel({
      orientation: "vertical",
      showPagination: true,
      slideCount: 4,
    });

    await carousel.expectPosition({ dot: 0, onScreen: ["Slide 1"] });

    await userEvent.click(carousel.dots()[0]);
    await userEvent.keyboard("{ArrowDown}");
    await carousel.expectPosition({ dot: 1, onScreen: ["Slide 2"] });

    // Across the axis belongs to the page.
    await userEvent.keyboard("{ArrowRight}");
    await carousel.expectStill({ dot: 1, onScreen: ["Slide 2"] });
  });
});

describe("driving it from outside", () => {
  it("hands out an api that scrolls to a slide and reports where it is", async () => {
    let api: CarouselApi;
    const carousel = await mountCarousel({
      showPagination: true,
      slideCount: 5,
      setApi: (given) => {
        api = given;
      },
    });

    await vi.waitFor(() => expect(api).toBeDefined());

    api?.scrollTo(3);

    await carousel.expectPosition({ dot: 3, onScreen: ["Slide 4"] });
    expect(api?.selectedScrollSnap()).toBe(3);
    expect(api?.scrollSnapList()).toHaveLength(5);

    api?.scrollPrev();
    await carousel.expectPosition({ dot: 2, onScreen: ["Slide 3"] });
  });
});

describe("autoplay", () => {
  /**
   * Every wait in this case is a multiple of this, so it is the whole of what the
   * slowest case in the file costs. 400ms is comfortably longer than the ~350ms a
   * slide takes to travel, which is what is asked of it: a tick lands on a carousel
   * that has arrived, and a tick that should not have fired is visible inside the
   * window below rather than being waited out.
   */
  const DELAY = 400;

  // One case rather than two, because each half is what makes the other mean
  // anything: a carousel whose autoplay never started would hold still under the
  // pointer for the wrong reason, and one that ticked once and then stalled would
  // never reach the resume at the end. Two mounts of a carousel that has to be
  // waited on were the two slowest things in this file.
  it("moves on its own, holds under the pointer, and picks up when it leaves", async () => {
    const carousel = await mountCarousel({
      showPagination: true,
      slideCount: 4,
      autoplay: { delay: DELAY },
    });

    expect(carousel.position()).toEqual({ dot: 0, onScreen: ["Slide 1"] });

    // The pointer is parked away first: the carousel mounts under wherever the last
    // test left the mouse, and hovering coordinates the pointer already sits at
    // crosses no boundary, so no `mouseenter` would reach the plugin at all.
    await userEvent.unhover(carousel.root);
    await arrivedAt(carousel, 1);
    expect(carousel.dots()[1]).toHaveAttribute("aria-current", "true");

    // The pointer rests on the carousel rather than on a slide: the dots and arrows
    // sit outside the box Embla measures, which is where a naive implementation
    // advances the carousel out from under the click.
    await userEvent.hover(carousel.root);
    await carousel.settled();

    const held = carousel.position();

    // Long enough for a tick due at `DELAY` to have fired and moved the carousel, so
    // a pause that did not take hold fails here.
    await carousel.expectStill(held, DELAY + 200);

    // The second advance, which is also what says the pause lifted rather than
    // stopping the carousel for good.
    await userEvent.unhover(carousel.root);
    await arrivedAt(carousel, (held.dot + 1) % 4);
  });
});
