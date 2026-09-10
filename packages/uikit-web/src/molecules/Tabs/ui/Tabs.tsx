"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { tabsVariants } from "@/molecules/Tabs/lib/utils";
import { TestIdProvider } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * A set of layered sections of content shown one at a time, built on Radix
 * Tabs.
 *
 * The root holds the selected value and nothing else — `TabsList` is the bar,
 * `TabsTrigger` a tab in it, `TabsContent` the panel one opens. Controlled with
 * `value` + `onValueChange`, uncontrolled with `defaultValue`; the two are
 * Radix's own props and behave the way they do everywhere else.
 *
 * `TabsPanels` goes around the panels when the whole panel area wants one
 * background, border or padding — see its own docs.
 *
 * `orientation` turns the whole thing on its side: `"vertical"` puts the bar
 * beside the panels rather than above them, scrolls it up and down, and moves
 * its arrows to the top and bottom edges. A vertical bar is as tall as the
 * layout makes it, the way a horizontal one is as wide — give the tabs or the
 * bar a height for it to have anything to scroll inside.
 *
 * Naming the tabs names every part: a `data-testid` here is published to the
 * subtree, and each part derives its own from it — `-list`, `-trigger-<value>`,
 * `-panels`, `-content-<value>`, and `-list-previous` / `-list-next` for the
 * arrows. A tab is named by the value it stands for rather than by its
 * position, because position moves with the data. Without the prop no part
 * carries a test id at all, which keeps the attribute out of a consumer's DOM.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [value] - The selected tab, when controlled
 * @param {string} [defaultValue] - The tab selected on mount, when uncontrolled
 * @param {(value: string) => void} [onValueChange] - Called with the newly selected tab
 * @param {('horizontal' | 'vertical')} [orientation='horizontal'] - Which way the tabs run: a row above the panels, or a column beside them
 * @param {string} [data-testid] - Names the tabs; every part derives its own from it
 * @param {React.ComponentProps<typeof TabsPrimitive.Root>} props - Props for the root element
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="account" data-testid="settings">
 *   <TabsList>
 *     <TabsTrigger value="account">
 *       <User aria-hidden />
 *       Account
 *     </TabsTrigger>
 *     <TabsTrigger value="password">Password</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="account">Account settings…</TabsContent>
 *   <TabsContent value="password">Password settings…</TabsContent>
 * </Tabs>
 * ```
 *
 * @example
 * ```tsx
 * // The same tabs as a sidebar: the bar is a column beside the panels, and the
 * // height is what it scrolls inside once there are more tabs than fit.
 * <Tabs orientation="vertical" defaultValue="account" className="h-64">
 *   <TabsList className="w-40">
 *     <TabsTrigger value="account">Account</TabsTrigger>
 *     <TabsTrigger value="password">Password</TabsTrigger>
 *   </TabsList>
 *   <TabsPanels>
 *     <TabsContent value="account">Account settings…</TabsContent>
 *     <TabsContent value="password">Password settings…</TabsContent>
 *   </TabsPanels>
 * </Tabs>
 * ```
 *
 * @remarks
 * Requires `@ui/themes/config.css`. It defines `tab-base`, which is everything
 * a tab looks like — the trigger has no variants, so its whole appearance is one
 * name rather than twenty classes on every pill — and `scrollbar-hidden`, which
 * the bar scrolls under. That file is already every brand app's one required
 * import, so there is nothing to add.
 *
 * @cssVariables
 * Component and typography:
 * - `--border-width-border-2`
 * - `--border-width-border-4`
 * - `--radius-base`
 * - `--typography-font-family`
 * - `--typography-font-size-label-s`
 * - `--typography-font-weight-bold`
 *
 * Semantic colors:
 * - `--color-background-layout-surface-variant1`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-background-state-pressed`
 * - `--color-background-state-selected`
 * - `--color-border-state-active`
 * - `--color-border-state-focus`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-on-surface-muted`
 * - `--color-foreground-state-disabled`
 *
 * Through `Button`, for the two scroll arrows:
 * - `--components-button-border`
 * - `--components-button-radius`
 * - `--color-background-brand-secondary-container`
 * - `--color-border-neutral-default`
 * - `--color-foreground-brand-on-secondary-container`
 *
 * @see [Reference](https://www.radix-ui.com/primitives/docs/components/tabs#api-reference)
 */
function Tabs({
  className,
  // Destructured because this element's own layout turns with it, and Radix's
  // default lives inside Radix where a `cn()` cannot see it. Passed back
  // explicitly below, so the primitive and the class list are reading one value.
  //
  // It goes no further than this element. Radix writes the orientation onto the
  // bar as `aria-orientation` and onto each panel as `data-orientation`, and
  // everything downstream reads it from there rather than from a copy sent
  // after it.
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & {
  /** Names the tabs; every part derives its own id from this one. */
  "data-testid"?: string;
}) {
  return (
    // Read rather than destructured: `...props` still carries the attribute to
    // the root element, so one mechanism puts it there and the context only
    // republishes it for the parts.
    <TestIdProvider value={props["data-testid"]}>
      <TabsPrimitive.Root
        orientation={orientation}
        className={cn(tabsVariants({ orientation }), className)}
        {...props}
      />
    </TestIdProvider>
  );
}

export { Tabs };
