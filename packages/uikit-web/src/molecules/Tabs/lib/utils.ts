import { cva } from "class-variance-authority";

/**
 * Which way the tabs run: a row with the panels under it, or a column with the
 * panels beside it.
 *
 * Radix's own prop, spelled without the `undefined` its type carries — `Tabs`
 * settles the default before anything here is asked, so nothing downstream has
 * to decide a second time what no orientation means.
 */
type TabsOrientation = "horizontal" | "vertical";

/**
 * The box the whole component is: the bar above the panels, or beside them.
 *
 * The gap is the same either way. It is the space between the bar and what it
 * opens, and that does not change with which side of the panels the bar sits on.
 */
const tabsVariants = cva("flex gap-6", {
  variants: {
    orientation: {
      horizontal: "flex-col",
      vertical: "flex-row",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

/**
 * The box holding the scrolling bar and the two arrows. Positioned, because the
 * arrows hang off its edges — and nothing else, in either orientation.
 *
 * It needs no size of its own. As a flex item of the tabs it already stretches
 * across whichever axis it is not running along — the full width under a row of
 * tabs, the full height beside a column of them — and the bar inside it takes
 * that from `align-items: stretch`. The `w-full` and `items-center` this
 * replaced were the redundant and the actively wrong halves of the same
 * assumption: centring the bar in the box is what stops a column from filling
 * the height it has, and a bar that does not fill its height has nothing to
 * scroll inside.
 */
const tabsListRootClass = "relative flex";

/**
 * The bar itself: a scroll container on the tabs' axis, clipped on the other
 * one. Clipped rather than hidden on both, because a scroll container clips both
 * axes whatever the other says — `tab-base` draws the focus ring inside the pill
 * for that reason, and there is nothing for the cross axis to reveal.
 *
 * Which axis that is comes from `aria-orientation`, which Radix puts on the
 * `role="tablist"` element itself. So the bar restyles from the attribute it
 * already carries, correctly on the very first paint and with no React involved
 * — the alternative was a context republishing a value the DOM was holding
 * anyway, and a context cannot be read by CSS.
 */
const tabsListClass = [
  "scrollbar-hidden flex min-w-0 flex-1 items-center gap-2",
  "overflow-x-auto overflow-y-clip scroll-smooth motion-reduce:scroll-auto",
  "aria-[orientation=vertical]:flex-col aria-[orientation=vertical]:items-stretch",
  "aria-[orientation=vertical]:overflow-x-clip aria-[orientation=vertical]:overflow-y-auto",
].join(" ");

/**
 * A scroll arrow, hung on the bar's edge.
 *
 * Figma puts it 8px outside the bar, overlapping it by the rest of its width,
 * and that is what this reproduces — the bar itself carries no padding for the
 * arrows to sit in, because a bar that always reserved 8px on both sides would
 * be 16px shorter than the design everywhere it is used, arrows or no arrows. A
 * layout that cannot spare the overhang gives the bar its own `px-2` (or `py-2`,
 * running vertically).
 *
 * Which edge is which is the compound: `previous` is left in a row and top in a
 * column, and the centring flips axis with it.
 */
const tabsArrowVariants = cva("absolute z-10", {
  variants: {
    orientation: {
      horizontal: "top-1/2 -translate-y-1/2 rtl:rotate-180",
      vertical: "left-1/2 -translate-x-1/2",
    },
    side: {
      previous: "",
      next: "",
    },
  },
  compoundVariants: [
    // `start`/`end` rather than `left`/`right`: these are the logical insets, so
    // the arrow for the earlier tabs sits on the right in an RTL bar without
    // anything here asking which direction it is in. `rtl:rotate-180` turns the
    // glyph to match — the icon has to point at the tabs it scrolls to, and in
    // RTL those are the other way round.
    { orientation: "horizontal", side: "previous", class: "-start-2" },
    { orientation: "horizontal", side: "next", class: "-end-2" },
    { orientation: "vertical", side: "previous", class: "-top-2" },
    { orientation: "vertical", side: "next", class: "-bottom-2" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    side: "previous",
  },
});

/**
 * Sub-pixel slack. A scroll container's scroll offset is fractional once the
 * page is zoomed or a layout lands on a half pixel, so `> 0` reports a
 * scrollable edge for a bar sitting flat against its start.
 */
const SCROLL_EPSILON = 1;

/** How much of the visible length one arrow press travels. */
const PAGE_RATIO = 0.8;

/** The DOM properties that answer "where is this bar" on one axis. */
type ScrollAxis = {
  scrollStart: "scrollLeft" | "scrollTop";
  clientSize: "clientWidth" | "clientHeight";
  scrollSize: "scrollWidth" | "scrollHeight";
};

/**
 * Everything the scrolling half of the bar has to spell differently per
 * orientation, in one table — so the arithmetic below is written once, against
 * a start and a size, rather than twice against left and top.
 *
 * Lowercase so `codegen:docs`, which files every top-level binding starting with
 * a capital, leaves it alone.
 */
const axisBy = {
  horizontal: {
    scrollStart: "scrollLeft",
    clientSize: "clientWidth",
    scrollSize: "scrollWidth",
  },
  vertical: {
    scrollStart: "scrollTop",
    clientSize: "clientHeight",
    scrollSize: "scrollHeight",
  },
} as const satisfies Record<TabsOrientation, ScrollAxis>;

type ScrollMetrics = {
  scrollStart: number;
  clientSize: number;
  scrollSize: number;
};

/**
 * Which way a bar runs, read from the bar itself.
 *
 * Radix puts `aria-orientation` on the `role="tablist"` element — it is the
 * accessibility contract for exactly this question, so the answer is already in
 * the DOM and there is nothing to publish a second copy of. The bar's own
 * layout reads the same attribute through CSS; this is for the two things CSS
 * cannot do, which are picking an arrow's icon and name and choosing between
 * `scrollLeft` and `scrollTop`.
 *
 * Anything that is not `"vertical"` is a row, the attribute's own default
 * included — a bar with no attribute at all is a bar Radix has not rendered,
 * and horizontal is what it would have said.
 *
 * @param {HTMLElement} list - The `role="tablist"` element
 * @returns {TabsOrientation}
 */
function getListOrientation(list: HTMLElement): TabsOrientation {
  return list.getAttribute("aria-orientation") === "vertical" ? "vertical" : "horizontal";
}

/**
 * Where the bar currently is, read on the axis it scrolls.
 *
 * @param {HTMLElement} element - The scrolling bar
 * @param {TabsOrientation} orientation - Which way the tabs run
 * @returns {ScrollMetrics}
 */
function getScrollMetrics(element: HTMLElement, orientation: TabsOrientation): ScrollMetrics {
  const axis = axisBy[orientation];

  return {
    // Absolute, because `scrollLeft` counts *down* from zero in an RTL bar: zero
    // is the start, which is the right-hand edge, and going left is negative.
    // The distance travelled from the start is what every edge test below wants,
    // and that is the same number in both directions once the sign is dropped.
    // `scrollTop` is never negative, so this is a no-op on the vertical axis.
    scrollStart: Math.abs(element[axis.scrollStart]),
    clientSize: element[axis.clientSize],
    scrollSize: element[axis.scrollSize],
  };
}

/**
 * A distance, addressed to the axis the tabs run on — which is the one thing
 * `scrollTo` and `scrollBy` will not take generically.
 *
 * @param {number} distance - How far along the axis
 * @param {TabsOrientation} orientation - Which way the tabs run
 * @returns {ScrollToOptions}
 */
function getScrollOffset(distance: number, orientation: TabsOrientation): ScrollToOptions {
  return orientation === "vertical" ? { top: distance } : { left: distance };
}

/**
 * Which arrows have anywhere left to go.
 *
 * @param {ScrollMetrics} metrics - The bar's current scroll geometry
 * @returns {{ canScrollPrev: boolean, canScrollNext: boolean }}
 */
function getScrollEdges({ scrollStart, clientSize, scrollSize }: ScrollMetrics) {
  return {
    canScrollPrev: scrollStart > SCROLL_EPSILON,
    canScrollNext: scrollStart + clientSize < scrollSize - SCROLL_EPSILON,
  };
}

/**
 * How far one arrow press moves the bar: most of a screenful, so the tab that
 * was at the edge stays on screen and the jump keeps its context.
 *
 * @param {number} clientSize - The visible length of the bar
 * @returns {number} The distance to travel, at least one pixel
 */
function getPageDelta(clientSize: number) {
  return Math.max(1, Math.round(clientSize * PAGE_RATIO));
}

/**
 * Whether a tab is showing in full, which is the question the auto-scroll asks
 * before moving anything — a tab already on screen should not be re-centred
 * just because it was clicked.
 *
 * Compared as boxes on the screen rather than as offsets into the content. An
 * offset only lines up with the bar's scroll position while the bar has no
 * padding of its own, and `TabsList`'s own docs recommend `px-2` for a layout
 * that cannot spare the arrows' overhang — under which a tab clipped by 8px
 * reported as fully visible. Two rectangles have no such assumption in them,
 * and they are also sign-blind, so RTL costs nothing here.
 *
 * @param {HTMLElement} list - The scrolling bar
 * @param {HTMLElement} item - The tab
 * @param {TabsOrientation} orientation - Which way the tabs run
 * @returns {boolean}
 */
function isItemFullyVisible(list: HTMLElement, item: HTMLElement, orientation: TabsOrientation) {
  const bar = list.getBoundingClientRect();
  const tab = item.getBoundingClientRect();

  return orientation === "vertical"
    ? tab.top >= bar.top && tab.bottom <= bar.bottom
    : tab.left >= bar.left && tab.right <= bar.right;
}

/**
 * How far the bar has to move for a tab to sit in the middle of it: the gap
 * between the two centres.
 *
 * A relative distance rather than a scroll position, and physical rather than
 * logical — which is what makes one expression right in every case. `scrollBy`
 * takes a physical delta on both axes and in both directions, and the browser
 * clamps it to the travel that actually exists, so there is no reading of the
 * direction here and no clamping either. The absolute version had both, and the
 * clamp was the half that silently disagreed with a padded bar.
 *
 * @param {HTMLElement} list - The scrolling bar
 * @param {HTMLElement} item - The tab to bring into view
 * @param {TabsOrientation} orientation - Which way the tabs run
 * @returns {number} The distance to scroll by, signed
 */
function getRevealDelta(list: HTMLElement, item: HTMLElement, orientation: TabsOrientation) {
  const bar = list.getBoundingClientRect();
  const tab = item.getBoundingClientRect();

  return orientation === "vertical"
    ? tab.top + tab.height / 2 - (bar.top + bar.height / 2)
    : tab.left + tab.width / 2 - (bar.left + bar.width / 2);
}

/**
 * Whether a press towards the later tabs moves the bar in the negative
 * direction — true only for a horizontal bar in an RTL subtree, where the later
 * tabs are to the left and `scrollLeft` decreases towards them.
 *
 * Read from the element rather than taken as a prop: `direction` is inherited,
 * so the bar can be inside an RTL subtree without anything in the tabs' own
 * props saying so.
 *
 * @param {HTMLElement} list - The scrolling bar
 * @param {TabsOrientation} orientation - Which way the tabs run
 * @returns {boolean}
 */
function isAxisReversed(list: HTMLElement, orientation: TabsOrientation) {
  return orientation === "horizontal" && getComputedStyle(list).direction === "rtl";
}

export {
  PAGE_RATIO,
  SCROLL_EPSILON,
  getListOrientation,
  getPageDelta,
  getScrollEdges,
  getScrollMetrics,
  getRevealDelta,
  getScrollOffset,
  isAxisReversed,
  isItemFullyVisible,
  tabsArrowVariants,
  tabsListClass,
  tabsListRootClass,
  tabsVariants,
  type ScrollMetrics,
  type TabsOrientation,
};
