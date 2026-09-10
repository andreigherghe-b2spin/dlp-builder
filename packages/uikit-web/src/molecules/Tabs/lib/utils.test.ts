import { describe, expect, it } from "vitest";

import { getPageDelta, getScrollEdges, getScrollOffset } from "@/molecules/Tabs/lib/utils";

// A bar 300px long holding 900px of tabs: 600px of travel, which is enough for
// a start, a middle and an end to be three different answers.
//
// Along the bar rather than across it, deliberately — everything below is
// written against a start and a size, so one set of numbers covers a row and a
// column alike.
//
// What is *not* here: deciding whether a tab is showing, and how far to move to
// centre it. Both read two `getBoundingClientRect`s now, because an offset into
// the content only agrees with the bar's scroll position while the bar has no
// padding. A rectangle needs a laid-out element, so those two are asserted
// against a real bar in `useTabsScroll.test.tsx` — including the padded case
// that the arithmetic they replaced got wrong.
const bar = { scrollStart: 0, clientSize: 300, scrollSize: 900 };

describe("reading which way a tab bar can still go", () => {
  it("offers only the way forward at the start", () => {
    expect(getScrollEdges(bar)).toEqual({ canScrollPrev: false, canScrollNext: true });
  });

  it("offers both once it has moved", () => {
    expect(getScrollEdges({ ...bar, scrollStart: 300 })).toEqual({
      canScrollPrev: true,
      canScrollNext: true,
    });
  });

  it("offers only the way back at the end", () => {
    expect(getScrollEdges({ ...bar, scrollStart: 600 })).toEqual({
      canScrollPrev: true,
      canScrollNext: false,
    });
  });

  it("offers neither when everything fits", () => {
    expect(getScrollEdges({ scrollStart: 0, clientSize: 300, scrollSize: 300 })).toEqual({
      canScrollPrev: false,
      canScrollNext: false,
    });
  });

  // The reason the epsilon exists: a zoomed page leaves fractional pixels at
  // both ends, and reading them as travel puts an arrow on a bar that is flat
  // against its edge and cannot move.
  it("reads a fraction of a pixel at either end as no travel", () => {
    expect(getScrollEdges({ ...bar, scrollStart: 0.5 }).canScrollPrev).toBe(false);
    expect(getScrollEdges({ ...bar, scrollStart: 599.5 }).canScrollNext).toBe(false);
  });
});

describe("addressing a distance to the axis the tabs run on", () => {
  // The one thing `scrollTo` and `scrollBy` will not take generically, and the
  // whole reason everything else here can be axis-blind.
  it("moves a row along its left and a column along its top", () => {
    expect(getScrollOffset(240, "horizontal")).toEqual({ left: 240 });
    expect(getScrollOffset(240, "vertical")).toEqual({ top: 240 });
  });
});

describe("how far one arrow press travels", () => {
  it("moves most of a screenful, so the tab at the edge stays on screen", () => {
    expect(getPageDelta(300)).toBe(240);
  });

  it("still moves a pixel in a bar too short to have a screenful", () => {
    expect(getPageDelta(0)).toBe(1);
  });
});
