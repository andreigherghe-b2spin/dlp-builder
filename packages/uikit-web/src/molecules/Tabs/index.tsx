"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the ones on the files behind
// this barrel are dropped on the way into dist/. So the boundary is declared
// here, where the built consumer actually sees it. Every export below is
// client-only anyway: they render Radix primitives and read React context.

/**
 * The tabs' single entry point: `@ui/web/Tabs` resolves here, and nothing
 * outside this directory imports any deeper.
 *
 * Four parts, composed by the caller: `Tabs` holds the selected value,
 * `TabsList` is the bar, `TabsTrigger` a tab in it, `TabsContent` the panel one
 * opens. A bar that only navigates leaves the panels out — see `TabsTrigger`'s
 * `asChild` example.
 *
 * `TabsPanels` is the optional fifth: a box around the panels, for when the
 * panel area carries a background or a padding of its own rather than each
 * panel carrying its own copy.
 *
 * `lib/` is internal: the scroll hook behind the bar and the variants behind
 * the arrows.
 *
 * ## Coming from the brand apps
 *
 * Two things in `ui-b2spin-monorepo` are tabs, and both map onto these four
 * parts rather than onto a `tabs` object of their own.
 *
 * `Categories` — the games bar — is `HorizontalScroll` + `Pill`, and it is the
 * one this component was drawn from:
 *
 * | `Categories` / `HorizontalScroll`  | here                                      |
 * | ---------------------------------- | ----------------------------------------- |
 * | `HorizontalScroll`                 | `TabsList`, which is already the scroller |
 * | `showArrows`                       | `showArrows`, and only while it overflows |
 * | `Pill`                             | `TabsTrigger`                             |
 * | `Pill selected`                    | `value` on `Tabs` matching the trigger's  |
 * | `Pill href` + `onClick`            | `TabsTrigger asChild` around the link     |
 * | `Pill icon` (an `<img src>`)       | an icon element among the children        |
 * | `useAutoScroll` / `scrollToPill`   | `scrollActiveIntoView`, on by default     |
 * | `classNameContainer`               | `className`; the box is `classNames.root` |
 * | `scrolledItemDataAttr='data-pill'` | nothing — the row finds the selected tab  |
 *
 * `TileTabs` (`@patrianna/core-components`) takes the whole thing as data —
 * `tabs={{ slots: { type, title, component } }}` plus `defaultActiveTab` and
 * `onTabChange`. The same call becomes one `TabsTrigger` and one `TabsContent`
 * per entry:
 *
 * | `TileTabs`         | here                                 |
 * | ------------------ | ------------------------------------ |
 * | `tabs[].type`      | `value`, on the trigger and the panel |
 * | `tabs[].title`     | the trigger's children               |
 * | `tabs[].component` | the panel's children                 |
 * | `defaultActiveTab` | `defaultValue`                       |
 * | `onTabChange`      | `onValueChange`                      |
 *
 * Written out rather than passed as a record because the record bought
 * nothing: the panel of every tab was built on every render, whether or not it
 * was the open one, and `title` and `component` could not be given a class, a
 * test id or an icon between them. A `.map()` over the same array produces both
 * halves and keeps them typed.
 */
export { Tabs } from "@/molecules/Tabs/ui/Tabs";
export { TabsContent, TabsPanels } from "@/molecules/Tabs/ui/TabsContent";
export { TabsList, TabsTrigger, type TabsListClassNames } from "@/molecules/Tabs/ui/TabsTrigger";
