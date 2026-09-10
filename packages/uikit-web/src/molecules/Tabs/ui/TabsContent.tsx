"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

// The panel and the box the panels go in. One file because they are one
// decision — what a tab opens, and what the set of them sits on — and because
// the box is four lines that would otherwise be a file of their own.

/**
 * The panel a tab opens. Unmounted while its tab is not the selected one, so
 * anything expensive inside it costs nothing until it is asked for.
 *
 * Unstyled beyond filling the space it is given: a panel holds whatever the
 * product puts in it, and a border or a padding here would be one more thing to
 * undo at every call site.
 *
 * @param {string} value - The tab this panel belongs to
 * @param {string} [className] - Additional CSS classes
 * @param {string} [data-testid] - Overrides the id derived from the tabs' own
 * @param {React.ComponentProps<typeof TabsPrimitive.Content>} props - Props for the panel element
 */
function TabsContent({
  className,
  value,
  // Destructured because the panel emits an id it was not passed — derived from
  // the value it belongs to, so it is addressable without being named twice.
  "data-testid": testIdProp,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content> & {
  /** Replaces the derived `<tabs>-content-<value>`. */
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId(`content-${value}`, testIdProp);

  return (
    <TabsPrimitive.Content
      value={value}
      data-testid={testId}
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

/**
 * The box the panels sit in.
 *
 * Wrap every `TabsContent` in one of these when the panel area is a surface of
 * its own — a background, a border, a padding that belongs to the area rather
 * than to whichever tab happens to be open. Without it the same classes end up
 * on every panel, and the next panel added is the one that forgets them.
 *
 * Optional, and it holds no state: a bar that only navigates has no panels to
 * put in a box, and a panel that is already the shape it needs does not need
 * one either.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [data-testid] - Overrides the id derived from the tabs' own
 * @param {React.ComponentProps<'div'>} props - Props for the box element
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="account">
 *   <TabsList>…</TabsList>
 *   <TabsPanels className="rounded-base bg-background-layout-surface-variant1 p-4">
 *     <TabsContent value="account">Account settings…</TabsContent>
 *     <TabsContent value="password">Password settings…</TabsContent>
 *   </TabsPanels>
 * </Tabs>
 * ```
 */
function TabsPanels({
  className,
  // Destructured because the box emits an id it was not passed — `<tabs>-panels`
  // derived from the tabs' own.
  "data-testid": testIdProp,
  ...props
}: React.ComponentProps<"div"> & {
  /** Replaces the derived `<tabs>-panels`. */
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId("panels", testIdProp);

  return (
    <div
      data-testid={testId}
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      {...props}
    />
  );
}

export { TabsContent, TabsPanels };
