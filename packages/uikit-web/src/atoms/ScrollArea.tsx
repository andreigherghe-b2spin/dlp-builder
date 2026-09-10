"use client";

import type * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { TestIdProvider, usePartTestId } from "@/lib/testId";
import { cn, createTestIdFor } from "@/lib/utils";

const root = "relative";

/**
 * `rounded-[inherit]` rather than a token: the viewport fills a box whose radius
 * the consumer set on the root, and the only way to clip the content to that
 * radius without knowing it is to take the parent's.
 *
 * The focus ring is the kit's — `--color-border-state-focus`, two pixels, on
 * `focus-visible` only. The viewport is focusable because a scroll container has
 * to be reachable from the keyboard; the previous `ring-ring/50` named a token no
 * brand file declares, so the ring was drawn in whatever `ring` defaults to.
 */
const viewport = `
  size-full rounded-[inherit]
  outline-none
  transition-[color,box-shadow]
  focus-visible:ring-2
  focus-visible:ring-border-state-focus
`;

/**
 * The gutter the thumb runs in. Transparent on purpose — Figma draws no track,
 * so a background here would invent one — and the transparent border plus `p-px`
 * are what inset the thumb from the content rather than a margin, which would
 * shorten the runnable length.
 */
const scrollbar = {
  vertical: "h-full w-2.5 border-l border-l-transparent",
  horizontal: "h-2.5 flex-col border-t border-t-transparent",
} as const;

const scrollbarBase = "flex touch-none select-none p-px transition-colors";

const thumb = "relative flex-1 rounded-full bg-border-neutral-strong";

type ScrollBarProps = React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
  /**
   * Overrides the `<base>-scrollbar-<orientation>` this derives from the
   * surrounding `ScrollArea`.
   */
  "data-testid"?: string;
  /** Classes for the parts inside. `className` styles the gutter. */
  classNames?: {
    /** The bar that moves. */
    thumb?: string;
  };
};

/**
 * One scrollbar, for one axis.
 *
 * `ScrollArea` renders the vertical one itself, so this is what you add for a
 * horizontal axis — as a child of `ScrollArea`, after the content. It takes its
 * `data-testid` from the surrounding `ScrollArea`'s, named by the axis it runs
 * on rather than by the order it was written in: `<base>-scrollbar-horizontal`.
 *
 * @param {('vertical' | 'horizontal')} [orientation='vertical'] - The axis this bar scrolls
 * @param {string} [className] - Additional CSS classes for the gutter
 * @param {object} [classNames] - Classes for the parts inside
 *
 * @example
 * ```tsx
 * <ScrollArea className="w-96">
 *   <div className="flex w-max gap-4">…</div>
 *   <ScrollBar orientation="horizontal" />
 * </ScrollArea>
 * ```
 *
 * @cssVariables
 * Semantic colors:
 * - `--color-border-neutral-strong`
 */
function ScrollBar({
  className,
  classNames,
  orientation = "vertical",
  "data-testid": override,
  ...props
}: ScrollBarProps) {
  const { testId, testIdFor } = usePartTestId(`scrollbar-${orientation}`, override);

  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-testid={testId}
      orientation={orientation}
      className={cn(scrollbarBase, scrollbar[orientation], className)}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-testid={testIdFor("thumb")}
        className={cn(thumb, classNames?.thumb)}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

/**
 * A scroll container with the kit's own scrollbar instead of the platform's,
 * built on Radix's Scroll Area primitive.
 *
 * Native scrollbars are drawn by the operating system: a different width, a
 * different colour and a different behaviour on macOS, Windows and Linux, none
 * of them themeable. This replaces them with an element the brand tokens reach,
 * while leaving the scrolling itself to the browser — so the wheel, the
 * trackpad, `scrollIntoView`, keyboard paging and touch momentum all still work.
 *
 * **It needs a bounded box to be worth anything.** Give the root a height (or a
 * width, for a horizontal axis) — `className="h-72"` — or it grows to its
 * content and never scrolls. The radius goes on the root too; the viewport
 * inherits it, so the content is clipped to the same corners.
 *
 * The vertical scrollbar is rendered for you. A horizontal one is a `ScrollBar`
 * you add as the last child, because most scroll areas have one axis and a
 * second gutter drawn for an axis that never overflows is a second corner to
 * account for.
 *
 * Radix reveals the bars on hover by default. `type="always"` keeps them drawn,
 * which is what a test or a screenshot wants, and `type="auto"` shows them only
 * while an axis actually overflows.
 *
 * @param {string} [className] - Additional CSS classes for the root. This is
 * where the height, the width and the radius go
 * @param {object} [classNames] - Classes for the parts inside
 * @param {('auto' | 'always' | 'scroll' | 'hover')} [type='hover'] - When the bars are drawn
 * @param {React.ReactNode} children - The content to scroll
 * @param {string} [data-testid] - Base test id; the parts derive theirs from it
 *
 * @example
 * ```tsx
 * <ScrollArea className="h-72 w-48 rounded-offset8">
 *   <div className="p-4">…</div>
 * </ScrollArea>
 * ```
 *
 * @example
 * ```tsx
 * // Horizontal: the bar is composed in, and the content sets its own width
 * <ScrollArea className="w-96 rounded-offset8">
 *   <div className="flex w-max gap-4 p-4">…</div>
 *   <ScrollBar orientation="horizontal" />
 * </ScrollArea>
 * ```
 *
 * @see [API Reference](https://www.radix-ui.com/primitives/docs/components/scroll-area#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/scroll-area)
 *
 * @cssVariables
 * Semantic colors:
 * - `--color-border-neutral-strong`
 * - `--color-border-state-focus`
 */
function ScrollArea({
  className,
  classNames,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  /**
   * Names the scroll area. The parts derive from it — `<base>-viewport`,
   * `<base>-scrollbar-vertical`, `<base>-scrollbar-vertical-thumb` — including a
   * `ScrollBar` the consumer composes in.
   */
  "data-testid"?: string;
  /** Classes for the parts inside. `className` styles the root. */
  classNames?: {
    /** The clipping box the content scrolls in. */
    viewport?: string;
    /** The gutter of the vertical scrollbar this renders itself. */
    scrollbar?: string;
    /** The bar that moves, in the vertical scrollbar this renders itself. */
    thumb?: string;
  };
}) {
  // Read off `props` rather than destructured: `...props` is what carries the
  // attribute onto the root, so taking it would mean placing it again by hand
  // and having two mechanisms that can disagree.
  const base = props["data-testid"];
  // Derived here rather than through `usePartTestId`, which reads the context
  // this component is about to publish — from up here it would still see the
  // *surrounding* base, so a nested scroll area's viewport would take the outer
  // one's name. The parts below the provider have no such problem.
  const testIdFor = createTestIdFor(base);

  return (
    <ScrollAreaPrimitive.Root className={cn(root, className)} {...props}>
      {/* Published rather than threaded down, because a horizontal `ScrollBar` is
          written by the consumer as a sibling of the content — there is no prop
          chain from here to it. Scoped by the tree like any context, so a
          `ScrollArea` nested in another publishes its own base for its own bars. */}
      <TestIdProvider value={base}>
        <ScrollAreaPrimitive.Viewport
          data-testid={testIdFor("viewport")}
          className={cn(viewport, classNames?.viewport)}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar className={classNames?.scrollbar} classNames={{ thumb: classNames?.thumb }} />
        <ScrollAreaPrimitive.Corner />
      </TestIdProvider>
    </ScrollAreaPrimitive.Root>
  );
}

export { ScrollArea, ScrollBar };
