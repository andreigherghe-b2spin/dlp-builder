import * as React from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { useTabsScroll, type TabsScrollOptions } from "@/molecules/Tabs/lib/useTabsScroll";
import type { TabsOrientation } from "@/molecules/Tabs/lib/utils";

const TAB_SIZE = 100;
const NARROW = 240;
const WIDE = 900;

type RowProps = TabsScrollOptions & {
  tabCount?: number;
  /** Which tab carries Radix's selected marker, or none. */
  active?: number;
  /** How long the bar is along the axis it scrolls. */
  size?: number;
  /**
   * Written onto the bar rather than passed to the hook, because that is where
   * the hook looks for it — Radix puts `aria-orientation` on the `role="tablist"`
   * element and nothing hands the value to a component around it.
   */
  orientation?: TabsOrientation;
  /** Inherited by the bar, the way a product's own `dir` would be. */
  dir?: "ltr" | "rtl";
  /**
   * Padding on the positioned box, not on the bar — `TabsList` takes it from
   * `classNames.root`. This is what put a tab's `offsetLeft` out of step with
   * the bar's `scrollLeft` back when the two were compared as numbers.
   */
  boxPadding?: number;
};

/**
 * The hook's own subject: a scroll container, the tabs in it, and the two
 * controls it drives. Deliberately not `TabsList` — that composition is what
 * `ui/Tabs.test.tsx` covers, and testing the hook through it would leave the
 * hook's contract pinned by nothing.
 *
 * The buttons report the arrow state through `disabled`, so every assertion in
 * this file is about what a person could actually press.
 *
 * The box around it all is positioned, as `TabsList`'s is: a tab's offset is
 * measured from the nearest positioned ancestor, and the hook compares it with
 * the bar's own scroll offset. Leave the box static and a column's tabs are
 * measured from the page instead, which is the same numbers plus wherever the
 * test container happens to sit.
 *
 * The bar carries `role="tablist"` and `aria-orientation` because that is what
 * Radix renders and what the hook reads. The inline styles stand in for the
 * classes `TabsList` puts on the same element — a real bar restyles itself off
 * that attribute in CSS, which is not loaded here.
 */
function Row({
  tabCount = 6,
  active,
  size = NARROW,
  orientation = "horizontal",
  dir,
  boxPadding,
  ...options
}: RowProps) {
  const { listRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext } = useTabsScroll(options);
  const vertical = orientation === "vertical";

  return (
    <div dir={dir} style={{ position: "relative", padding: boxPadding }}>
      <div
        ref={listRef}
        role="tablist"
        aria-orientation={orientation}
        data-testid="row"
        style={
          vertical
            ? { display: "flex", flexDirection: "column", height: size, overflowY: "auto" }
            : { display: "flex", width: size, overflowX: "auto" }
        }
      >
        {Array.from({ length: tabCount }, (_, index) => (
          <div
            key={index}
            role="tab"
            data-state={index === active ? "active" : "inactive"}
            style={{ flex: "0 0 auto", [vertical ? "height" : "width"]: TAB_SIZE }}
          >
            Tab {index + 1}
          </div>
        ))}
      </div>
      <button type="button" disabled={!canScrollPrev} onClick={scrollPrev}>
        previous
      </button>
      <button type="button" disabled={!canScrollNext} onClick={scrollNext}>
        next
      </button>
    </div>
  );
}

async function mountRow(props: RowProps = {}) {
  const view = await render(<Row {...props} />);
  const within = page.elementLocator(view.container);
  const row = within.getByTestId("row");
  const vertical = props.orientation === "vertical";

  return {
    view,
    previous: within.getByRole("button", { name: "previous" }),
    next: within.getByRole("button", { name: "next" }),
    /**
     * How far along its own axis the bar has travelled from its start. Absolute
     * for the same reason the hook takes it that way: an RTL bar counts down
     * from zero, so the raw number is negative and every comparison below would
     * have to be written twice.
     */
    scrollStart: () => {
      const element = row.element() as HTMLElement;

      return Math.abs(vertical ? element.scrollTop : element.scrollLeft);
    },
    /**
     * Whether the selected tab is actually on screen — the outcome the reveal
     * exists for, asserted as a person would see it rather than as the number
     * the hook happened to scroll to. Half a pixel of slack because a laid-out
     * box lands on fractions.
     */
    activeIsOnScreen: () => {
      const element = row.element() as HTMLElement;
      const tab = element.querySelector<HTMLElement>('[role="tab"][data-state="active"]');

      if (!tab) return false;

      const bar = element.getBoundingClientRect();
      const box = tab.getBoundingClientRect();

      return vertical
        ? box.top >= bar.top - 0.5 && box.bottom <= bar.bottom + 0.5
        : box.left >= bar.left - 0.5 && box.right <= bar.right + 0.5;
    },
  };
}

describe("offering the arrows", () => {
  it("offers only the way forward at the start of an overflowing row", async () => {
    const { previous, next } = await mountRow();

    await expect.element(previous).toBeDisabled();
    await expect.element(next).toBeEnabled();
  });

  it("offers neither when every tab fits", async () => {
    const { previous, next } = await mountRow({ tabCount: 2 });

    await expect.element(previous).toBeDisabled();
    await expect.element(next).toBeDisabled();
  });

  it("offers only the way back once the row is at its end", async () => {
    // 6 tabs of 100 in 240 leaves 360 of travel, which two presses of 192 clear.
    const { previous, next } = await mountRow();

    await userEvent.click(next);
    await userEvent.click(next);

    await expect.element(next).toBeDisabled();
    await expect.element(previous).toBeEnabled();
  });

  it("offers them again once the row is narrowed under its content", async () => {
    const { view, next } = await mountRow({ size: WIDE });

    await expect.element(next).toBeDisabled();

    // No re-render of the row itself: the width changes on the same element, and
    // the arrows have to follow it the way they follow a window resize.
    await view.rerender(<Row size={NARROW} />);

    await expect.element(next).toBeEnabled();
  });
});

describe("moving the row", () => {
  it("travels most of a screenful per press, and back again", async () => {
    const { previous, next, scrollStart } = await mountRow();

    await userEvent.click(next);
    await expect.poll(scrollStart).toBeGreaterThan(0);

    const travelled = scrollStart();

    await userEvent.click(previous);
    await expect.poll(scrollStart).toBeLessThan(travelled);
  });
});

describe("keeping the selected tab on screen", () => {
  it("brings a tab that is out of view into it on mount", async () => {
    const { scrollStart } = await mountRow({ active: 5 });

    await expect.poll(scrollStart).toBeGreaterThan(0);
  });

  it("leaves a tab that is already showing where it is", async () => {
    const { scrollStart } = await mountRow({ active: 0 });

    await expect.poll(scrollStart).toBe(0);
  });

  it("follows the selection when it moves", async () => {
    const { view, scrollStart } = await mountRow({ active: 0 });

    await view.rerender(<Row active={5} />);

    await expect.poll(scrollStart).toBeGreaterThan(0);
  });

  it("stays put when asked not to follow it", async () => {
    const { scrollStart } = await mountRow({ active: 5, scrollActiveIntoView: false });

    await expect.poll(scrollStart).toBe(0);
  });
});

// Same three behaviours, on the axis the horizontal cases cannot reach. A bar
// running vertically reads `scrollTop`, `clientHeight` and `offsetTop`, and
// hands `scrollBy` a `top` rather than a `left` — swap one of those for its
// horizontal twin and every test above still passes while a vertical bar sits
// motionless.
describe("running the tabs down a column instead of along a row", () => {
  const column = { orientation: "vertical" } as const;

  it("offers only the way down at the top of an overflowing column", async () => {
    const { previous, next } = await mountRow(column);

    await expect.element(previous).toBeDisabled();
    await expect.element(next).toBeEnabled();
  });

  it("offers neither when every tab fits the height", async () => {
    const { previous, next } = await mountRow({ ...column, tabCount: 2 });

    await expect.element(previous).toBeDisabled();
    await expect.element(next).toBeDisabled();
  });

  it("travels down the column on a press, and back up again", async () => {
    const { previous, next, scrollStart } = await mountRow(column);

    await userEvent.click(next);
    await expect.poll(scrollStart).toBeGreaterThan(0);

    const travelled = scrollStart();

    await userEvent.click(previous);
    await expect.poll(scrollStart).toBeLessThan(travelled);
  });

  it("brings a tab below the fold into view on mount", async () => {
    const { scrollStart } = await mountRow({ ...column, active: 5 });

    await expect.poll(scrollStart).toBeGreaterThan(0);
  });

  it("leaves a tab already showing at the top where it is", async () => {
    const { scrollStart } = await mountRow({ ...column, active: 0 });

    await expect.poll(scrollStart).toBe(0);
  });
});

// An RTL bar scrolls the same tabs the other way, and the numbers it reports do
// too: `scrollLeft` is zero at the start — the right-hand edge — and goes
// negative towards the later tabs. Read raw, `canScrollPrev` can never be true
// and `canScrollNext` can never be false, so the bar offers one dead arrow and
// hides the live one.
describe("running the tabs right to left", () => {
  const rtl = { dir: "rtl" } as const;

  it("offers only the way forward at the start, as an LTR bar does", async () => {
    const { previous, next } = await mountRow(rtl);

    await expect.element(previous).toBeDisabled();
    await expect.element(next).toBeEnabled();
  });

  it("travels towards the later tabs on a press, and offers the way back", async () => {
    const { previous, next, scrollStart } = await mountRow(rtl);

    await userEvent.click(next);

    await expect.poll(scrollStart).toBeGreaterThan(0);
    await expect.element(previous).toBeEnabled();
  });

  it("runs out of travel at the end rather than scrolling for ever", async () => {
    const { previous, next } = await mountRow(rtl);

    await userEvent.click(next);
    await userEvent.click(next);

    await expect.element(next).toBeDisabled();
    await expect.element(previous).toBeEnabled();
  });
});

describe("bringing a tab into view when the box around the bar has padding", () => {
  it("puts the selected tab on screen, padding and all", async () => {
    const { scrollStart, activeIsOnScreen } = await mountRow({ active: 5, boxPadding: 8 });

    await expect.poll(scrollStart).toBeGreaterThan(0);
    await expect.poll(activeIsOnScreen).toBe(true);
  });

  it("puts a tab below the fold of a padded column on screen too", async () => {
    const { activeIsOnScreen } = await mountRow({
      orientation: "vertical",
      active: 5,
      boxPadding: 8,
    });

    await expect.poll(activeIsOnScreen).toBe(true);
  });
});

describe("turning the reveal on and off while the bar is in use", () => {
  // The flag gates one `if`. Held as a dependency it tore down the observers and
  // re-ran the mount path, which reveals with `instant` — so a bar the user had
  // scrolled snapped back the moment a consumer flipped the prop, with nothing
  // the user had done to cause it.
  it("leaves the bar where the user put it when the flag changes", async () => {
    const { view, next, scrollStart } = await mountRow({ active: 0, scrollActiveIntoView: false });

    await userEvent.click(next);
    await expect.poll(scrollStart).toBeGreaterThan(0);

    const travelled = scrollStart();

    await view.rerender(<Row active={0} scrollActiveIntoView />);

    await expect.poll(scrollStart).toBe(travelled);
  });

  it("still follows the selection once the flag is on", async () => {
    const { view, scrollStart } = await mountRow({ active: 0, scrollActiveIntoView: false });

    await view.rerender(<Row active={5} scrollActiveIntoView />);

    await expect.poll(scrollStart).toBeGreaterThan(0);
  });
});
