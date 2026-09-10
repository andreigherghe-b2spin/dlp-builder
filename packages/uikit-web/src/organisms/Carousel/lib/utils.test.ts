import { describe, expect, it } from "vitest";

import {
  AUTOPLAY_DEFAULTS,
  IN_VIEW_THRESHOLD,
  isSeen,
  resolveArrowDirection,
  resolveAutoplayOptions,
  resolveEmblaOptions,
  resolveSlideSize,
  wheelDeltaInPixels,
} from "@/organisms/Carousel/lib/utils";

describe("resolving the autoplay options", () => {
  it("uses every default for `autoplay` given as a bare `true`", () => {
    expect(resolveAutoplayOptions(true)).toEqual(AUTOPLAY_DEFAULTS);
  });

  it("uses every default when autoplay was not asked for at all", () => {
    // The caller decides *whether* to run autoplay; this only decides *how*.
    expect(resolveAutoplayOptions(undefined)).toEqual(AUTOPLAY_DEFAULTS);
    expect(resolveAutoplayOptions(false)).toEqual(AUTOPLAY_DEFAULTS);
  });

  it("takes each option the caller named and defaults the rest", () => {
    expect(resolveAutoplayOptions({ delay: 900, stopOnInteraction: true })).toEqual({
      delay: 900,
      stopOnInteraction: true,
      stopOnMouseEnter: AUTOPLAY_DEFAULTS.stopOnMouseEnter,
      playOnlyInView: AUTOPLAY_DEFAULTS.playOnlyInView,
    });
  });

  it("falls back for a key that was present but undefined", () => {
    // `autoplay={{ delay: props.delay }}` with `props.delay` unset: a spread over
    // the defaults would overwrite them with `undefined`, and for `playOnlyInView`
    // that silently turns the whole in-view gate off.
    expect(resolveAutoplayOptions({ delay: undefined, playOnlyInView: undefined })).toEqual(
      AUTOPLAY_DEFAULTS,
    );
  });

  it("keeps a deliberate `false` rather than reading it as absent", () => {
    expect(resolveAutoplayOptions({ playOnlyInView: false }).playOnlyInView).toBe(false);
    expect(resolveAutoplayOptions({ stopOnMouseEnter: false }).stopOnMouseEnter).toBe(false);
  });
});

describe("deciding whether enough of the carousel is on screen", () => {
  function observed({
    isIntersecting,
    intersectionRatio,
    height = 300,
    viewportHeight = 800,
  }: {
    isIntersecting: boolean;
    intersectionRatio: number;
    height?: number;
    viewportHeight?: number | null;
  }) {
    return {
      isIntersecting,
      intersectionRatio,
      boundingClientRect: { height } as DOMRectReadOnly,
      rootBounds: viewportHeight == null ? null : ({ height: viewportHeight } as DOMRectReadOnly),
    } as IntersectionObserverEntry;
  }

  it("is not seen while it is off screen", () => {
    expect(isSeen(observed({ isIntersecting: false, intersectionRatio: 0 }))).toBe(false);
  });

  it("is seen once the visible share reaches the threshold", () => {
    expect(isSeen(observed({ isIntersecting: true, intersectionRatio: IN_VIEW_THRESHOLD }))).toBe(
      true,
    );
  });

  it("is not seen for a sliver, whatever the observer reported", () => {
    // `threshold` decides when the callback fires, never what the entry says, so
    // the ratio has to be re-checked by hand or the threshold does nothing.
    expect(isSeen(observed({ isIntersecting: true, intersectionRatio: 0.1 }))).toBe(false);
  });

  it("counts any of a carousel too tall to ever reach the threshold", () => {
    // Taller than 1/threshold viewports: holding out for the ratio would mean
    // autoplay that never starts however far the page is scrolled.
    expect(
      isSeen(
        observed({
          isIntersecting: true,
          intersectionRatio: 0.4,
          height: 3000,
          viewportHeight: 800,
        }),
      ),
    ).toBe(true);
  });

  it("is not seen when there is no viewport to compare against", () => {
    expect(
      isSeen(observed({ isIntersecting: true, intersectionRatio: 0.1, viewportHeight: null })),
    ).toBe(false);
  });
});

describe("normalising a wheel event's travel", () => {
  it("takes pixel deltas as they are", () => {
    expect(wheelDeltaInPixels(42, 0)).toBe(42);
  });

  it("scales line deltas, which most mouse wheels report", () => {
    // One notch reads as three pixels unnormalised, and the gesture never reaches
    // a step.
    expect(wheelDeltaInPixels(3, 1)).toBe(48);
  });

  it("scales page deltas", () => {
    expect(wheelDeltaInPixels(1, 2)).toBe(400);
  });

  it("keeps the direction of a backwards scroll", () => {
    expect(wheelDeltaInPixels(-2, 1)).toBe(-32);
  });
});

describe("sizing a slide", () => {
  it("gives a slide the whole viewport when nothing peeks past it", () => {
    expect(resolveSlideSize(undefined)).toBe("100%");
  });

  it("leaves room for the peek when one was asked for", () => {
    expect(resolveSlideSize(12)).toBe("calc(100% - 12%)");
  });

  it("still returns a value for a zero peek, so slides never need a fallback", () => {
    expect(resolveSlideSize(0)).toBe("calc(100% - 0%)");
  });
});

describe("building Embla's options", () => {
  it("sets the axis from the orientation, which `opts` cannot override", () => {
    // The component's own layout depends on knowing the axis.
    expect(resolveEmblaOptions({ orientation: "horizontal" }).axis).toBe("x");
    expect(resolveEmblaOptions({ orientation: "vertical" }).axis).toBe("y");
  });

  it("leaves whatever `opts` carried untouched", () => {
    expect(
      resolveEmblaOptions({ opts: { loop: true, align: "center" }, orientation: "horizontal" }),
    ).toEqual({
      loop: true,
      align: "center",
      axis: "x",
    });
  });

  it("layers the named props over `opts`", () => {
    expect(
      resolveEmblaOptions({
        opts: { loop: false },
        orientation: "horizontal",
        infiniteLoop: true,
        initialSlide: 2,
      }),
    ).toEqual({ loop: true, startIndex: 2, axis: "x" });
  });

  it("adds no key for a prop that was not given", () => {
    expect(resolveEmblaOptions({ orientation: "horizontal" })).toEqual({ axis: "x" });
  });

  it("aligns a peeking carousel to one edge, so the peek reads as `more this way`", () => {
    expect(resolveEmblaOptions({ orientation: "horizontal", peek: 12 }).align).toBe("start");
  });

  it("lets an explicit alignment win over the peek's", () => {
    expect(
      resolveEmblaOptions({ opts: { align: "end" }, orientation: "horizontal", peek: 12 }).align,
    ).toBe("end");
  });
});

describe("mapping an arrow key onto a direction", () => {
  it("follows the axis a horizontal carousel travels on", () => {
    expect(resolveArrowDirection("horizontal", "ArrowLeft")).toBe("previous");
    expect(resolveArrowDirection("horizontal", "ArrowRight")).toBe("next");
  });

  it("follows the axis a vertical carousel travels on", () => {
    expect(resolveArrowDirection("vertical", "ArrowUp")).toBe("previous");
    expect(resolveArrowDirection("vertical", "ArrowDown")).toBe("next");
  });

  it("leaves the across-axis keys to the page", () => {
    expect(resolveArrowDirection("horizontal", "ArrowUp")).toBeNull();
    expect(resolveArrowDirection("vertical", "ArrowRight")).toBeNull();
    expect(resolveArrowDirection("horizontal", "Enter")).toBeNull();
  });
});
