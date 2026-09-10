"use client";

import type * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { TestIdProvider, usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * The same scrim `Dialog` draws, for the same reason: the backdrop token alone
 * is too transparent to separate a panel from a busy lobby, so Figma pairs it
 * with a blur. 20px is spelled out because neither `backdrop-blur-lg` (16px) nor
 * `-xl` (24px) is it and the design system has no blur token to name it with.
 *
 * Kept identical to the dialog's rather than tuned separately — a drawer and a
 * dialog opened from the same screen must not dim it by different amounts.
 */
const overlay = `
  fixed inset-0 z-50
  bg-background-backdrop
  backdrop-blur-[20px]

  data-[state=open]:animate-in data-[state=closed]:animate-out
  data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
`;

type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /**
   * Names the whole drawer. Every part derives from it — `<base>-trigger`,
   * `<base>-content`, `<base>-title` — so this is the only one to pass.
   */
  "data-testid"?: string;
};

/**
 * A panel that slides in from an edge of the screen and makes everything under
 * it inert, built on Vaul — which is Radix's Dialog with a drag gesture on top,
 * so it brings the focus trap, `inert`, Escape and the ARIA wiring with it.
 *
 * **This is a container, not a screen.** It decides which edge the panel comes
 * from, how much of the screen it takes, that the page behind it is inert, and
 * which part of it scrolls. It decides nothing about what is inside: a navigation
 * menu, a filter list, a cart and a payment step are four different components
 * that all go in the same drawer.
 *
 * So there is no header, no footer and no styled title here: a top bar, a row of
 * actions and the type they are set in are all the inner component's, and the
 * same component can then be shown in a drawer, a dialog or a page without its
 * chrome changing. What the drawer does supply is `DrawerBody`, because *which*
 * part scrolls when the panel runs out of height is mechanics rather than
 * appearance, and `DrawerTitle`, because Radix needs it to name the panel.
 *
 * Works three ways, like `Dialog`. Left alone it opens itself from a
 * `DrawerTrigger`. Given `open` it is driven from outside — a route, a store, a
 * modal router — and `onOpenChange` reports both edges. `onClose` is Vaul's own
 * prop and fires when the drawer closes, whether that was the close button, the
 * scrim, Escape or a swipe.
 *
 * @param {('top' | 'bottom' | 'left' | 'right')} [direction='bottom'] - Which
 * edge it slides in from. Read by `DrawerContent` through the
 * `data-vaul-drawer-direction` attribute Vaul writes, which is why the placement
 * and radius are expressed as data-variants rather than as props
 * @param {boolean} [open] - Controlled open state
 * @param {boolean} [defaultOpen] - Initial open state when uncontrolled
 * @param {(open: boolean) => void} [onOpenChange] - Notified on every open and close
 * @param {() => void} [onClose] - Called when the drawer closes
 * @param {boolean} [modal=true] - Whether the content below is made inert
 * @param {boolean} [dismissible=true] - When `false`, nothing but your own `open`
 * closes it: not the scrim, not Escape, not a swipe. `disableOverlayClose` on
 * `DrawerContent` is the narrower version, which leaves Escape working
 * @param {(number | string)[]} [snapPoints] - Heights the drawer settles at while
 * being dragged. Vaul's own feature, passed straight through
 * @param {string} [data-testid] - Base test id; every part derives theirs from it
 *
 * @example
 * ```tsx
 * <Drawer>
 *   <DrawerTrigger asChild>
 *     <Button variant="outline">Open</Button>
 *   </DrawerTrigger>
 *   <DrawerContent>
 *     <GameFilters />
 *   </DrawerContent>
 * </Drawer>
 *
 * // …and inside `GameFilters`, which owns its own chrome:
 * <>
 *   <DrawerTitle className={headingVariants({ size: "s", weight: "bold" })}>
 *     Filters
 *   </DrawerTitle>
 *   <DrawerBody className="px-4">…</DrawerBody>
 *   <DrawerClose asChild>
 *     <Button size="lg" variant="outline">Cancel</Button>
 *   </DrawerClose>
 * </>
 * ```
 *
 * @example
 * ```tsx
 * // Full screen, from the left. The chrome inside it — the brand mark, the
 * // background, the nav itself — belongs to the component being shown, not here.
 * <Drawer direction="left" open={isOpen} onOpenChange={setOpen}>
 *   <DrawerContent size="full" className="bg-background-layout-page">
 *     <DrawerTitle className="sr-only">Menu</DrawerTitle>
 *     <DrawerBody>
 *       <SiteNav />
 *     </DrawerBody>
 *   </DrawerContent>
 * </Drawer>
 * ```
 *
 * @see [API Reference](https://vaul.emilkowal.ski/api)
 * @see [Documentation](https://ui.shadcn.com/docs/components/drawer)
 */
function Drawer({ "data-testid": testId, ...props }: DrawerProps) {
  // `Root` renders no element of its own, so the base is published rather than
  // placed: there is nothing here to carry it.
  return (
    <TestIdProvider value={testId}>
      <DrawerPrimitive.Root {...props} />
    </TestIdProvider>
  );
}

/**
 * The element that opens the drawer. Pass `asChild` to use your own button
 * rather than the bare one Vaul renders.
 *
 * @param {boolean} [asChild] - Render the child element instead of a `<button>`
 *
 * @example
 * ```tsx
 * <DrawerTrigger asChild>
 *   <Button variant="outline">Open</Button>
 * </DrawerTrigger>
 * ```
 */
function DrawerTrigger({
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("trigger", override);

  return <DrawerPrimitive.Trigger data-testid={testId} {...props} />;
}

/**
 * Renders the drawer into `document.body`, outside the trigger's DOM position.
 * `DrawerContent` already wraps itself in one — reach for this only when you
 * need to control the portal's container yourself.
 *
 * @param {HTMLElement} [container] - Where to portal into. Defaults to `document.body`.
 */
function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal {...props} />;
}

/**
 * Closes the drawer. Unstyled on purpose: wrap whatever the inner component
 * already draws — a corner cross, a "Cancel" button — and it gains the close
 * behaviour without gaining an appearance from here.
 *
 * @param {boolean} [asChild] - Render the child element instead of a `<button>`
 *
 * @example
 * ```tsx
 * <DrawerClose asChild>
 *   <Button size="lg" variant="outline">Cancel</Button>
 * </DrawerClose>
 * ```
 */
function DrawerClose({
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("close", override);

  return <DrawerPrimitive.Close data-testid={testId} {...props} />;
}

/**
 * The scrim between the page and the panel. `DrawerContent` renders one itself,
 * so this is only needed when assembling the parts by hand.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the overlay
 *
 * @cssVariables
 * Semantic colors:
 * - `--color-background-backdrop`
 */
function DrawerOverlay({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("overlay", override);

  return (
    <DrawerPrimitive.Overlay data-testid={testId} className={cn(overlay, className)} {...props} />
  );
}

/**
 * The drawer's accessible name. **Every drawer needs one.**
 *
 * This is Vaul's title — Radix's `Dialog.Title` underneath — so Radix points the
 * panel's `aria-labelledby` at it, which is what a screen reader announces on
 * open. Without one Radix logs a warning and the panel opens unnamed; your own
 * `<h2>` will not do, because Radix has no way to find it.
 *
 * **Unstyled on purpose.** It renders an `<h2>` with no type, colour or spacing:
 * how a title looks belongs to the component being shown in the drawer, not to
 * the drawer. Dress it with `className`, or render `TypographyHeading` inside it.
 * A title that should not be seen is `className="sr-only"` — the panel still
 * needs the name.
 *
 * - @param {string} [className] - Classes for the title. This is where the type goes
 *
 * @example
 * ```tsx
 * <DrawerTitle className={headingVariants({ size: "s", weight: "bold" })}>
 *   Filters
 * </DrawerTitle>
 * ```
 *
 * @example
 * ```tsx
 * // Named for a screen reader, not drawn
 * <DrawerTitle className="sr-only">Menu</DrawerTitle>
 * ```
 */
function DrawerTitle({
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("title", override);

  return <DrawerPrimitive.Title data-testid={testId} {...props} />;
}

/**
 * The drawer's accessible description, wired to the panel through
 * `aria-describedby` so it is read out after the title on open.
 *
 * Optional, and unstyled for the same reason as `DrawerTitle`. Often the right
 * answer is `sr-only`: the drawer's purpose is obvious on screen and needs
 * saying only to a screen reader.
 *
 * - @param {string} [className] - Classes for the description
 *
 * @example
 * ```tsx
 * <DrawerDescription className="sr-only">
 *   Choose which games to show.
 * </DrawerDescription>
 * ```
 */
function DrawerDescription({
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("description", override);

  return <DrawerPrimitive.Description data-testid={testId} {...props} />;
}

export {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  type DrawerProps,
  DrawerTitle,
  DrawerTrigger,
};
