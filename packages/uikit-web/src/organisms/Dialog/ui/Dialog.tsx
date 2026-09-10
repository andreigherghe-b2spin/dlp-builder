"use client";

import type * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { TestIdProvider, usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * The scrim behind the panel. Figma draws it as a colour *and* a blur — the
 * backdrop token alone is too transparent to separate the dialog from a busy
 * lobby, which is what the blur is there for.
 *
 * 20px is spelled out rather than taken from a utility because neither
 * `backdrop-blur-lg` (16px) nor `-xl` (24px) is it, and the design system has no
 * blur token to name it with.
 */
const overlay = `
  fixed inset-0 z-50
  bg-background-backdrop
  backdrop-blur-[20px]

  data-[state=open]:animate-in data-[state=closed]:animate-out
  data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
`;

// `onOpenChange` is restated rather than inherited: Radix declares it as a method
// shorthand, which `@typescript-eslint/unbound-method` flags the moment it is
// destructured. Same signature, spelled as a property.
type DialogProps = Omit<React.ComponentProps<typeof DialogPrimitive.Root>, "onOpenChange"> & {
  /**
   * Names the whole dialog. Every part derives from it — `<base>-trigger`,
   * `<base>-content`, `<base>-title` — so this is the only one to pass.
   */
  "data-testid"?: string;
  /** Notified on every open and close, with the direction. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Called whenever the dialog asks to be closed — the header's close button, a
   * click on the overlay, or Escape.
   *
   * The closing half of `onOpenChange`, spelled the way a caller who keeps `open`
   * in a store or a route expects; both fire, so use whichever fits.
   */
  onClose?: () => void;
};

/**
 * A window over the page that makes everything under it inert, built on Radix's
 * Dialog primitive.
 *
 * The anatomy is Figma's: a header that can carry a back arrow, an info slot, a
 * brand logo and the close button, separated from the body by a rule; a body
 * that scrolls when there is more of it than screen; and a footer whose buttons
 * run in a row or a column, over an optional link and caption.
 *
 * Works three ways. Left alone it opens itself from a `DialogTrigger`. Given
 * `open` it is driven from outside — from a route, a store, a modal router — and
 * `onClose` is called whenever it asks to be closed, whether that was the header's
 * close button, the overlay, or Escape. `onOpenChange` is the same signal with the
 * direction included, for a caller that wants both edges.
 *
 * **This replaces `AnimatedOverlay`.** A dialog moving onto this component drops
 * its overlay wrapper rather than keeping it: `DialogContent` draws its own scrim,
 * and Radix brings the focus trap, `inert`, Escape and the ARIA wiring the old
 * overlay never had. Do not nest one inside the other — two scrims stack, and two
 * things claim the close. What the old props become:
 *
 * - `onClose` and `overlayHandler` → `onClose` here, or `onOpenChange` when both
 *   edges are wanted.
 * - `disableOverlayClose` and `overlayClass` → `disableOverlayClose` and
 *   `classNames={{ overlay }}`, both on `DialogContent`.
 * - `onBeforeOverlayClose` → `onPointerDownOutside` on `DialogContent`, vetoing the
 *   dismissal with `event.preventDefault()`.
 * - `AnimationOverlayContext`'s `visibilityHandler` → `DialogClose`.
 * - `mobileDirection`, `desktopDirection`, `closeOnSwipe` → nothing: the panel is
 *   centred and there is no bottom-sheet variant yet. A dialog that needs one is
 *   the reason to add it here, not to keep the old overlay.
 * - `bottomSlot` → nothing. It is product chrome rather than part of a dialog, so
 *   it renders where it belongs instead of riding along inside the backdrop.
 *
 * The app's own `closeLatestDialog()` stays in the app: it is the dialog stack, not
 * the dialog, and it belongs in `onClose`.
 *
 * @param {boolean} [open] - Controlled open state
 * @param {boolean} [defaultOpen] - Initial open state when uncontrolled
 * @param {() => void} [onClose] - Called whenever the dialog asks to be closed
 * @param {(open: boolean) => void} [onOpenChange] - Notified on every open and close
 * @param {boolean} [modal=true] - Whether the content below is made inert
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger asChild>
 *     <Button>Open</Button>
 *   </DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Header</DialogTitle>
 *     </DialogHeader>
 *     <DialogBody>…</DialogBody>
 *     <DialogFooter caption="Caption text">
 *       <Button size="lg">Confirm</Button>
 *       <DialogClose asChild>
 *         <Button size="lg" variant="outline">Cancel</Button>
 *       </DialogClose>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 *
 * @example
 * ```tsx
 * // Driven from outside — a store, a router, a parent's state
 * <Dialog open={isOpen} onClose={() => dispatch(closeDialog())}>
 *   <DialogContent>…</DialogContent>
 * </Dialog>
 * ```
 *
 * @see [API Reference](https://www.radix-ui.com/primitives/docs/components/dialog#api-reference)
 */
function Dialog({ onClose, onOpenChange, "data-testid": testId, ...props }: DialogProps) {
  // Radix reports both edges through one callback; `onClose` is the closing half
  // of it, named the way a caller driving the dialog from a store expects.
  const handleOpenChange = (next: boolean) => {
    onOpenChange?.(next);
    if (!next) onClose?.();
  };

  // `Root` renders no element of its own, so the base is published rather than
  // placed: there is nothing here to carry it.
  return (
    <TestIdProvider value={testId}>
      <DialogPrimitive.Root onOpenChange={handleOpenChange} {...props} />
    </TestIdProvider>
  );
}

/**
 * The element that opens the dialog. Pass `asChild` to use your own button
 * rather than the bare one Radix renders.
 *
 * @param {boolean} [asChild] - Render the child element instead of a `<button>`
 *
 * @example
 * ```tsx
 * <DialogTrigger asChild>
 *   <Button variant="outline">Open</Button>
 * </DialogTrigger>
 * ```
 */
function DialogTrigger({
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("trigger", override);

  return <DialogPrimitive.Trigger data-testid={testId} {...props} />;
}

/**
 * Renders the dialog into `document.body`, outside the trigger's DOM position.
 * `DialogContent` already wraps itself in one — reach for this only when you
 * need to control the portal's container yourself.
 *
 * @param {HTMLElement} [container] - Where to portal into. Defaults to `document.body`.
 */
function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal {...props} />;
}

/**
 * Closes the dialog. Unstyled on purpose — the close button drawn in the corner
 * of the header is `DialogHeader`'s, while this is what a footer's "Cancel"
 * wraps.
 *
 * @param {boolean} [asChild] - Render the child element instead of a `<button>`
 *
 * @example
 * ```tsx
 * <DialogClose asChild>
 *   <Button size="lg" variant="outline">Cancel</Button>
 * </DialogClose>
 * ```
 */
function DialogClose({
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("close", override);

  return <DialogPrimitive.Close data-testid={testId} {...props} />;
}

/**
 * The scrim between the page and the panel. `DialogContent` renders one itself,
 * so this is only needed when assembling the parts by hand.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the overlay
 *
 * @cssVariables
 * Semantic colors:
 * - `--color-background-backdrop`
 */
function DialogOverlay({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("overlay", override);

  return (
    <DialogPrimitive.Overlay data-testid={testId} className={cn(overlay, className)} {...props} />
  );
}

export { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTrigger, type DialogProps };
