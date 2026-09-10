"use client";

import * as React from "react";

import {
  getListOrientation,
  getPageDelta,
  getRevealDelta,
  getScrollEdges,
  getScrollMetrics,
  getScrollOffset,
  isAxisReversed,
  isItemFullyVisible,
  type TabsOrientation,
} from "@/molecules/Tabs/lib/utils";

/**
 * Radix marks the selected trigger, so the bar can find the tab to bring into
 * view without being told which one it is — which is what lets this work for a
 * controlled `value`, an uncontrolled one, and a `TabsTrigger asChild` wrapping
 * a link alike.
 */
const ACTIVE_TAB_SELECTOR = '[role="tab"][data-state="active"]';

type TabsScrollOptions = {
  /** Bring the selected tab into view when it changes. */
  scrollActiveIntoView?: boolean;
};

/**
 * The scrolling half of `TabsList`: which arrows are live, what a press does,
 * and keeping the selected tab on screen.
 *
 * The bar is a plain scroll container — the browser already does the momentum,
 * the wheel and the touch drag — so there is nothing here but the three things
 * a scroll container cannot answer for itself.
 *
 * **Nothing runs on a render.** Every recalculation is a reaction to something
 * that actually happened to the DOM, wired once and torn down together:
 *
 * | Event                                    | What it means                    |
 * | ---------------------------------------- | -------------------------------- |
 * | `scroll` on the bar                      | an edge may have been reached    |
 * | `ResizeObserver` on the bar              | the bar was shortened            |
 * | `MutationObserver`, children and text    | a tab or a translation arrived   |
 * | `MutationObserver`, `data-state`         | Radix selected another tab       |
 * | `MutationObserver`, `aria-orientation`   | the bar was turned on its side   |
 * | `document.fonts.ready`                   | the labels were redrawn wider    |
 *
 * The `data-state` one is why there is no bookkeeping ref here: the mutation
 * *is* the change signal, so nothing has to remember which tab was brought into
 * view last in order to notice that it is a different one now.
 *
 * That last row is the one nothing else covers, and it decides two things. A
 * webfont swap makes every label a different width without adding a node,
 * changing a text node or resizing the bar's own box — no mutation, no resize,
 * no scroll — so a bar that overflows only once the brand face arrives would
 * offer no arrow until someone scrolled it by hand. And the selected tab was
 * centred against the fallback face, so it has to be centred again: otherwise
 * where the bar rests depends on whether the font was in cache, and the same
 * page settles in two places on a warm and a cold load. It is the same reason
 * the visual suite waits for fonts before it photographs anything.
 *
 * Which axis to work on is not a parameter. Radix has already written it onto
 * the bar as `aria-orientation`, and every reader here holds the element — so
 * it is read where it is used rather than threaded down from a second copy that
 * could disagree with the one the roving focus and the CSS are both using.
 *
 * @param {TabsScrollOptions} [options] - Behaviour switches
 * @returns The ref for the scrolling element, its orientation, the arrow state, and the handlers
 */
function useTabsScroll({ scrollActiveIntoView = true }: TabsScrollOptions = {}) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  // State, unlike the two readers below, because the arrows need it while React
  // is rendering them rather than while an event is being handled. Starting
  // horizontal costs nothing and cannot be seen: an arrow only exists once one
  // of the booleans above is true, and all three are set together in the effect
  // below, so there is no first paint in which an arrow is pointing the wrong
  // way. The bar's own layout never waits for this — it is CSS, off the same
  // attribute.
  const [orientation, setOrientation] = React.useState<TabsOrientation>("horizontal");
  // A ref rather than a dependency. As a dependency it tore down both observers
  // and re-ran the mount path whenever a consumer flipped the flag — and the
  // mount path reveals with `instant`, so a bar driven by, say,
  // `scrollActiveIntoView={!isDragging}` snapped to centre with no animation and
  // nothing the user had done to cause it. What the flag gates is one `if`.
  const shouldRevealActive = React.useRef(scrollActiveIntoView);

  // In an effect rather than in the render body: a ref written during render is
  // a render with a side effect in it. The initial value comes from `useRef`
  // above, so the mount reveal below already reads the right answer, and nothing
  // else consults this until an observer or an event fires.
  React.useEffect(() => {
    shouldRevealActive.current = scrollActiveIntoView;
  }, [scrollActiveIntoView]);

  React.useEffect(() => {
    const list = listRef.current;

    if (!list) return;

    // Two booleans rather than one object: React skips the re-render only when
    // the new state is the same *value*, and a fresh `{ prev, next }` never is.
    // Most of what fires below changes nothing, and this is what makes that free.
    const sync = () => {
      const axis = getListOrientation(list);
      const { canScrollPrev: prev, canScrollNext: next } = getScrollEdges(
        getScrollMetrics(list, axis),
      );

      setOrientation(axis);
      setCanScrollPrev(prev);
      setCanScrollNext(next);
    };

    const revealActive = (behavior: ScrollBehavior, recentre = false) => {
      if (!shouldRevealActive.current) return;

      const active = list.querySelector<HTMLElement>(ACTIVE_TAB_SELECTOR);

      if (!active) return;

      const axis = getListOrientation(list);

      // A tab already showing in full is left where it is — clicking its
      // neighbour should not slide the bar under the pointer.
      if (!recentre && isItemFullyVisible(list, active, axis)) return;

      list.scrollBy({ ...getScrollOffset(getRevealDelta(list, active, axis), axis), behavior });
    };

    // Once for what the first render could not know. `instant` only here:
    // animating from the starting edge on mount reads as the page moving by
    // itself rather than as a response to anything the user did.
    sync();
    revealActive("instant");

    const resizeObserver = new ResizeObserver(sync);

    resizeObserver.observe(list);

    const mutationObserver = new MutationObserver((records) => {
      sync();

      // Named rather than typed, because the filter below now allows a second
      // attribute: only `data-state` means the selected tab moved. Radix flips
      // two of them, the old and the new, and they arrive in one callback.
      if (records.some((record) => record.attributeName === "data-state")) {
        // The bar scrolls smoothly through CSS, which is also where the
        // reduced-motion opt-out lives; `auto` means "whatever the element says".
        revealActive("auto");
      }
    });

    mutationObserver.observe(list, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-orientation"],
    });

    // Attached here rather than through an `onScroll` prop so that the listener,
    // the two observers and their teardown are one thing to read — and so the
    // bar can pass the consumer's own `onScroll` straight through, untouched.
    list.addEventListener("scroll", sync, { passive: true });

    // The one thing neither observer can see. `document.fonts` is undefined in
    // no browser this library supports, but the guard costs a character and a
    // test runner is not a browser.
    let cancelled = false;

    void document.fonts?.ready.then(() => {
      if (cancelled) return;

      sync();
      revealActive("auto", true);
    });

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      list.removeEventListener("scroll", sync);
    };
  }, []);

  const scrollByPage = (direction: 1 | -1) => {
    const list = listRef.current;

    if (!list) return;

    const axis = getListOrientation(list);
    const { clientSize } = getScrollMetrics(list, axis);
    // `previous` and `next` are the tabs' own order; `scrollBy` takes a physical
    // delta. The two agree everywhere except a horizontal RTL bar, where the
    // later tabs are the way `scrollLeft` decreases.
    const towards = isAxisReversed(list, axis) ? -direction : direction;

    list.scrollBy(getScrollOffset(towards * getPageDelta(clientSize), axis));
  };

  return {
    listRef,
    orientation,
    canScrollPrev,
    canScrollNext,
    scrollPrev: () => scrollByPage(-1),
    scrollNext: () => scrollByPage(1),
  };
}

export { ACTIVE_TAB_SELECTOR, useTabsScroll, type TabsScrollOptions };
