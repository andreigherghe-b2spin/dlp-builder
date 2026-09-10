"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";

import { PortalContainerProvider } from "@/lib/portalContainer";
import { usePartTestId } from "@/lib/testId";
import { DialogOverlay, DialogPortal } from "@/organisms/Dialog/ui/Dialog";
import { cn } from "@/lib/utils";

/**
 * Figma sets `items-start` on the panel and then tells every frame inside it to
 * fill the width, which is `stretch` by another route. Leaving the default here
 * renders the design identically and is kinder to a consumer who passes children
 * of their own without remembering `w-full`.
 *
 * `w-[calc(100%-2rem)]` and `max-h-[calc(100dvh-2rem)]` are the 16px gutter the
 * panel keeps from the edges of the screen. Figma has no opinion — its frames are
 * fixed-size — but without it the dialog butts against the viewport on a phone.
 */
const base = `
  fixed top-1/2 left-1/2 z-50
  -translate-x-1/2 -translate-y-1/2

  flex flex-col gap-4
  w-[calc(100%-2rem)] min-w-74 p-4
  max-h-[calc(100dvh-2rem)]

  rounded-offset16
  bg-background-layout-surface

  outline-none

  duration-200
  data-[state=open]:animate-in data-[state=closed]:animate-out
  data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
  data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
`;

/**
 * Figma's `Size`. The `Device` axis beside it is not a variant: Desktop and
 * Mobile differ in `min-width` alone (480 against 296) and in nothing else, so
 * it is one `min-w` on the base rather than a prop nobody should have to pass.
 */
const config = {
  variants: {
    size: {
      default: "max-w-120",
      sm: "max-w-92",
    },
  },
  defaultVariants: {
    size: "default",
  } as const,
};

const dialogContentVariants = cva(base, config);

/**
 * The scrolling middle of the dialog — Figma's "Slot".
 *
 * It exists because the header is separated from the content by a rule and has
 * to stay put: once the panel reaches its height limit, this is the part that
 * gives way. `flex-1` with `min-h-0` is what lets it shrink below its content
 * and scroll instead of pushing the footer off the screen.
 */
const body = `
  flex w-full min-h-0 flex-1 flex-col gap-4
  overflow-y-auto
`;

/**
 * Radix's own event type for a press outside the panel, read off the prop rather
 * than imported from `@radix-ui/react-dismissable-layer` — which is a transitive
 * dependency here, not one this package declares.
 */
type PointerDownOutsideEvent = Parameters<
  NonNullable<React.ComponentProps<typeof DialogPrimitive.Content>["onPointerDownOutside"]>
>[0];

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    /**
     * Stops a press on the overlay from closing the dialog.
     *
     * For a dialog the user has to answer — a purchase step, an unsaved form —
     * where a stray press outside would lose their work. Escape and the close
     * button are unaffected; `onEscapeKeyDown` and `showClose={false}` are how
     * those are governed.
     *
     * Named after the prop the products already pass, so a dialog moving onto
     * this component keeps the call site it had.
     */
    disableOverlayClose?: boolean;
    /** Overrides the `<dialogBase>-content` this derives from `Dialog`. */
    "data-testid"?: string;
    /**
     * Render inline instead of into a portal at the document root. For a nested
     * context, or when portalling puts the panel in the wrong stacking context.
     * The overlay comes along either way.
     */
    portal?: boolean;
    /** Classes for the parts inside. `className` styles the panel. */
    classNames?: {
      /**
       * The scrim behind the panel. `hidden` when the surrounding layout draws its
       * own — the panel still needs the overlay mounted, because it is what makes
       * the page behind it inert.
       */
      overlay?: string;
    };
  };

/**
 * The panel itself, over its own overlay.
 *
 * `size` is Figma's: `default` caps the panel at 480px, `sm` at 368px. Both keep
 * a 16px gutter from the edges of the screen and a 296px floor, which is how the
 * design's Mobile column behaves — so there is no `device` prop.
 *
 * Lays its children out in a column with Figma's 16px rhythm, which is what
 * `DialogHeader`, `DialogBody` and `DialogFooter` expect. Give the body to
 * `DialogBody` rather than a bare `<div>`: it is the part that scrolls when the
 * panel runs out of height.
 *
 * @param {('default' | 'sm')} [size='default'] - Figma's size. Caps the panel at 480px or 368px.
 * @param {boolean} [portal=true] - Render into a portal at the document root
 * @param {boolean} [disableOverlayClose=false] - Stop a press on the overlay from closing the dialog
 * @param {string} [className] - Additional CSS classes for the panel
 * @param {object} [classNames] - Classes for the parts inside
 * @param {React.ReactNode} children - Header, body and footer
 *
 * @example
 * ```tsx
 * <DialogContent size="sm">
 *   <DialogHeader>
 *     <DialogTitle>Delete account</DialogTitle>
 *   </DialogHeader>
 *   <DialogBody>This cannot be undone.</DialogBody>
 *   <DialogFooter>
 *     <Button size="lg" variant="destructive">Delete</Button>
 *   </DialogFooter>
 * </DialogContent>
 * ```
 *
 * @example
 * ```tsx
 * // A step the user has to answer: the overlay stops dismissing it, so the only
 * // ways out are the buttons and the close control
 * <DialogContent disableOverlayClose>…</DialogContent>
 * ```
 *
 * @cssVariables
 * Radius:
 * - `--radius-offset16`
 *
 * Semantic colors:
 * - `--color-background-layout-surface`
 */
function DialogContent({
  className,
  classNames,
  size,
  children,
  portal = true,
  disableOverlayClose = false,
  onPointerDownOutside,
  "data-testid": override,
  ref,
  ...props
}: DialogContentProps) {
  const { testId } = usePartTestId("content", override);

  // State rather than a ref, because the panel is what the floating panels inside
  // it portal into: a ref would leave the first render publishing nothing and
  // never re-render to correct it, so every menu opened before the next render
  // would go to the body.
  const [panel, setPanel] = React.useState<HTMLDivElement | null>(null);

  // `useCallback` is load-bearing here rather than precautionary: a callback ref
  // with a new identity each render is detached and reattached every time, which
  // is `setPanel(null)` followed by `setPanel(node)` — two state updates per
  // render, which is a render loop.
  const attachPanel = React.useCallback(
    (node: HTMLDivElement | null) => {
      setPanel(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Radix dismisses unless the outside-press event is defaultPrevented, so this
  // is the veto rather than a separate close path. The caller's own handler runs
  // first either way — it may want to know about the press it is not acting on.
  const handlePointerDownOutside = (event: PointerDownOutsideEvent) => {
    onPointerDownOutside?.(event);
    if (disableOverlayClose) event.preventDefault();
  };

  const framed = (
    <>
      <DialogOverlay className={classNames?.overlay} />
      <DialogPrimitive.Content
        ref={attachPanel}
        data-testid={testId}
        className={cn(dialogContentVariants({ size }), className)}
        onPointerDownOutside={handlePointerDownOutside}
        {...props}
      >
        {/* A Select or Popover opened in here portals into the panel rather than
            the body, so it stacks inside the dialog instead of against it. */}
        <PortalContainerProvider value={panel}>{children}</PortalContainerProvider>
      </DialogPrimitive.Content>
    </>
  );

  if (!portal) return framed;

  return <DialogPortal>{framed}</DialogPortal>;
}

/**
 * The dialog's scrolling content, between the header and the footer.
 *
 * Stacks what it is given with Figma's 16px gap and takes over scrolling once
 * the panel hits its height limit, so the header rule and the footer buttons
 * stay where they are.
 *
 * - @param {string} [className] - Additional CSS classes for the body
 *
 * @example
 * ```tsx
 * <DialogBody>
 *   <TypographyBody>Anything at all — a form, a list, a game grid.</TypographyBody>
 * </DialogBody>
 * ```
 */
function DialogBody({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<"div"> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("body", override);

  return <div data-testid={testId} className={cn(body, className)} {...props} />;
}

export { DialogBody, DialogContent, dialogContentVariants, type DialogContentProps };
