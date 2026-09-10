"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

import { Button, type ButtonProps } from "@/atoms/Button";
import { labelVariants } from "@/atoms/Typography";
import { useTabsScroll } from "@/molecules/Tabs/lib/useTabsScroll";
import {
  tabsArrowVariants,
  tabsListClass,
  tabsListRootClass,
  type TabsOrientation,
} from "@/molecules/Tabs/lib/utils";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

// A tab and the bar it sits in. One file because they are one decision — how a
// tab looks and how the row of them behaves — and neither is big enough to be
// read on its own.
//
// What a tab looks like is `tab-base` in `@ui/themes/config.css`, plus the box
// below. The trigger has no variants and no sizes, so there is nothing for a
// class list on the element to decide and no `cva` to declare — twenty-odd
// utilities per pill was most of a ten-tab bar's rendered weight. The box stays
// out here for the same reason `Button` keeps its sizes out here: it is what a
// consumer overrides through `className`, and `cn()` can only resolve a
// conflict between classes it can see.
//
// `tab-base` applies `button-base` into itself, so the hover, pressed and focus
// chrome a tab shares with a button is defined once and a tab is still one name
// in the DOM. `Label/Small/Bold` comes from `labelVariants` rather than being
// respelled as font utilities, the way `Label` takes `Label/Medium/Medium`.

/**
 * One tab: the pill that selects its panel.
 *
 * Children are the label, and an icon before it if there is one — a 16px
 * lucide icon needs no sizing class, and wants `aria-hidden` since the label
 * beside it already names the tab.
 *
 * `asChild` makes the tab something else while keeping its behaviour, which is
 * how a navigation bar is built: the trigger becomes the `<a>`, the route is
 * the `value`, and the bar is driven by `value={pathname}` from the router
 * rather than by clicks.
 *
 * @param {string} value - Identifies the tab and the panel it opens
 * @param {string} [className] - Additional CSS classes
 * @param {boolean} [asChild=false] - Render the child as the tab instead of a `<button>`
 * @param {boolean} [disabled=false] - Take the tab out of the rotation
 * @param {string} [data-testid] - Overrides the id derived from the tabs' own
 * @param {React.ComponentProps<typeof TabsPrimitive.Trigger>} props - Props for the trigger element
 *
 * @example
 * ```tsx
 * // A tab bar that navigates, selected by the current route
 * <Tabs value={pathname}>
 *   <TabsList>
 *     {routes.map((route) => (
 *       <TabsTrigger key={route.href} value={route.href} asChild>
 *         <Link href={route.href}>{route.title}</Link>
 *       </TabsTrigger>
 *     ))}
 *   </TabsList>
 * </Tabs>
 * ```
 */
function TabsTrigger({
  className,
  value,
  // Destructured, unlike everywhere else, because what this element emits is
  // not what was passed: with no `data-testid` of its own the tab still gets
  // one, derived from the value it stands for.
  "data-testid": testIdProp,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  /** Replaces the derived `<tabs>-trigger-<value>`. */
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId(`trigger-${value}`, testIdProp);

  return (
    <TabsPrimitive.Trigger
      value={value}
      data-testid={testId}
      className={cn(
        labelVariants({ size: "s", weight: "bold" }),
        "tab-base relative inline-flex h-9 shrink-0 items-center justify-center gap-2 px-3",
        className,
      )}
      {...props}
    />
  );
}

type TabsSide = "previous" | "next";

type TabsArrowFace = { label: string; Icon: React.ComponentType };

// Which way an arrow points, and what a screen reader is told it does — both of
// which turn with the bar, so a vertical bar says up and down rather than
// naming a direction it cannot move in.
//
// Lowercase so `codegen:docs`, which files every top-level binding starting
// with a capital next to the real components, leaves it alone.
const arrowsByOrientation = {
  horizontal: {
    previous: { label: "Scroll tabs left", Icon: ArrowLeft },
    next: { label: "Scroll tabs right", Icon: ArrowRight },
  },
  vertical: {
    previous: { label: "Scroll tabs up", Icon: ArrowUp },
    next: { label: "Scroll tabs down", Icon: ArrowDown },
  },
} as const satisfies Record<TabsOrientation, Record<TabsSide, TabsArrowFace>>;

/** Classes for the parts `TabsList` renders itself. */
type TabsListClassNames = {
  /** The box holding the bar and the arrows. `className` styles the bar. */
  root?: string;
  previous?: string;
  next?: string;
};

/**
 * One scroll arrow. Internal: the bar places the pair itself from `showArrows`,
 * and only while there is anywhere to scroll — an arrow that is always there
 * and mostly dead covers a tab for nothing.
 */
function TabsArrow({
  side,
  orientation,
  className,
  testId,
  ...props
}: ButtonProps & {
  side: TabsSide;
  orientation: TabsOrientation;
  testId?: string;
}) {
  const { label, Icon } = arrowsByOrientation[orientation][side];

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      tabIndex={-1}
      onMouseDown={(event) => event.preventDefault()}
      aria-label={label}
      data-testid={testId}
      className={cn(tabsArrowVariants({ side, orientation }), className)}
      {...props}
    >
      <Icon aria-hidden />
    </Button>
  );
}

/**
 * The bar the tabs sit in: a scrolling row — or column, under
 * `orientation="vertical"` — with an arrow at either end once there are more
 * tabs than fit.
 *
 * The orientation comes from the surrounding `Tabs` rather than from a prop
 * here: it is one decision about the whole component, and a bar that could
 * disagree with the root about which way it runs would take its arrow keys from
 * one and its scrollbar from the other.
 *
 * The bar scrolls rather than wraps or squeezes, which is what a tab bar with
 * ten game categories in it has to do on a phone. The browser handles the
 * wheel, the touch drag and the momentum; the arrows are for a mouse, which has
 * none of those. Both are hidden while everything fits, so a two-tab bar looks
 * exactly like a bar that never scrolls.
 *
 * Selecting a tab that is off screen brings it into view. That covers the case
 * the arrows do not: a bar driven by the router, where the selected tab changes
 * without anything in the bar being clicked.
 *
 * The bar has no padding of its own: Figma draws the pills flush to its edges,
 * 36px is the whole height, and the arrows are the only thing that leaves the
 * box — by the 8px Figma hangs them out by.
 *
 * A row fills the width it is given; a column takes the width of its widest tab
 * and the height the layout hands it, so `className="w-40"` and a height on the
 * tabs are what shape a vertical bar.
 *
 * Nothing here reserves room for a focused tab's ring either. A scroll
 * container clips on both axes whatever the other one says, so `tab-base` draws
 * the ring inside the pill rather than outside it; padding the bar to fit an
 * outward ring would make every bar thicker than the design for a state that is
 * not on screen most of the time.
 *
 * @param {string} [className] - Additional CSS classes for the scrolling bar
 * @param {boolean} [showArrows=true] - Offer the arrows when the bar overflows
 * @param {boolean} [scrollActiveIntoView=true] - Bring the selected tab into view when it changes
 * @param {TabsListClassNames} [classNames] - Classes for the parts the bar renders itself
 * @param {string} [data-testid] - Overrides the id derived from the tabs' own
 * @param {React.ComponentProps<typeof TabsPrimitive.List>} props - Props for the bar element
 *
 * @example
 * ```tsx
 * // A bar that fills its column, without arrows on touch
 * <TabsList showArrows={!isMobile} className="w-full">
 *   {categories.map((category) => (
 *     <TabsTrigger key={category.code} value={category.code}>{category.title}</TabsTrigger>
 *   ))}
 * </TabsList>
 * ```
 */
function TabsList({
  className,
  classNames,
  showArrows = true,
  scrollActiveIntoView = true,
  ref,
  // Destructured because the row emits an id it was not passed — `<tabs>-list`
  // derived from the tabs' own — and the arrows derive theirs from that.
  "data-testid": testIdProp,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  showArrows?: boolean;
  scrollActiveIntoView?: boolean;
  classNames?: TabsListClassNames;
  /** Replaces the derived `<tabs>-list`. */
  "data-testid"?: string;
}) {
  const { testId, testIdFor } = usePartTestId("list", testIdProp);
  // The orientation comes back out of the hook rather than in: the bar is the
  // element carrying `aria-orientation`, and the hook is what holds it. Only
  // the arrows need it here — the bar restyles itself off the same attribute in
  // CSS, which is why there is no orientation on the box below either.
  const { listRef, orientation, canScrollPrev, canScrollNext, scrollPrev, scrollNext } =
    useTabsScroll({ scrollActiveIntoView });

  // Both refs, and pulled out of the spread rather than left to it: `ref` is a
  // plain prop in React 19, so a consumer's one arriving through `...props`
  // would replace the bar's own, `listRef` would stay null, and the arrows would
  // simply never appear — with nothing to debug.
  //
  // The consumer's cleanup is returned rather than dropped: a React 19 callback
  // ref may return one, and swallowing it while also calling the ref with
  // `null` mixes the two protocols and runs the teardown twice.
  //
  // Memoised for hygiene only, and it is worth knowing why it buys nothing
  // observable: `TabsPrimitive.List` reaches its element through
  // `RovingFocusGroup asChild`, and `@radix-ui/react-slot` writes
  // `props.ref = composeRefs(...)` unmemoised on every render. So the ref React
  // actually attaches to the bar is new each time regardless, and a consumer
  // doing setup in a callback ref is detached and reattached whenever this row
  // re-renders — which is every scroll that crosses an edge. That is Radix's
  // behaviour for every `asChild` primitive, not something introduced here; a
  // consumer that cannot afford it should pass a ref object rather than a
  // callback.
  const setListRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node;

      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [listRef, ref],
  );

  return (
    <div className={cn(tabsListRootClass, classNames?.root)}>
      <TabsPrimitive.List
        ref={setListRef}
        data-testid={testId}
        className={cn(tabsListClass, className)}
        {...props}
      />
      {showArrows && canScrollPrev ? (
        <TabsArrow
          side="previous"
          orientation={orientation}
          onClick={scrollPrev}
          testId={testIdFor("previous")}
          className={classNames?.previous}
        />
      ) : null}
      {showArrows && canScrollNext ? (
        <TabsArrow
          side="next"
          orientation={orientation}
          onClick={scrollNext}
          testId={testIdFor("next")}
          className={classNames?.next}
        />
      ) : null}
    </div>
  );
}

export { TabsList, TabsTrigger, type TabsListClassNames };
