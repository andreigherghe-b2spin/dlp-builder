"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cva, type VariantProps } from "class-variance-authority";

import { PortalContainerProvider } from "@/lib/portalContainer";
import { usePartTestId } from "@/lib/testId";
import { DrawerOverlay, DrawerPortal } from "@/organisms/Drawer/ui/Drawer";
import { cn } from "@/lib/utils";

/**
 * Placement, and nothing that depends on the size.
 *
 * Every rule here is behind a `data-vaul-drawer-direction` variant because the
 * direction is a prop of `Drawer`, not of this component: Vaul writes it onto the
 * panel as an attribute, and CSS is the only channel that reaches from there to
 * here. Threading a `direction` prop down instead would mean passing it twice and
 * having two sources of truth for which edge the panel is on.
 *
 * `group/drawer-content` is what lets the swipe handle below read the same
 * attribute from a child.
 *
 * No padding and no gap: the panel is a box with a position and a size, and how
 * its contents are spaced belongs to whatever was put in it. `flex flex-col` is
 * the exception, and it is mechanics rather than appearance — it is what lets
 * `DrawerBody` claim the leftover height with `flex-1` and scroll inside it.
 */
const base = `
  group/drawer-content
  fixed z-50
  flex h-auto flex-col
  bg-background-layout-surface
  outline-none

  data-[vaul-drawer-direction=top]:inset-x-0
  data-[vaul-drawer-direction=top]:top-0
  data-[vaul-drawer-direction=bottom]:inset-x-0
  data-[vaul-drawer-direction=bottom]:bottom-0
  data-[vaul-drawer-direction=left]:inset-y-0
  data-[vaul-drawer-direction=left]:left-0
  data-[vaul-drawer-direction=right]:inset-y-0
  data-[vaul-drawer-direction=right]:right-0
`;

/**
 * How much of the screen the panel takes, and therefore which corners it rounds.
 *
 * The two are one variant rather than two because they are one decision: a panel
 * that stops short of an edge rounds the corners it exposes, and a panel that
 * reaches every edge has no exposed corner to round. Splitting them would let a
 * caller ask for `full` with a radius, which is a rounded rectangle with the page
 * showing through four notches.
 *
 * `full` changes the geometry and nothing else. It keeps the surface colour every
 * other size uses: what a full-bleed panel should be painted is a decision
 * belonging to whatever is put inside it, and a `className` is how that decision
 * is expressed.
 *
 * Both sizes are written in the same `data-[…]:` keys they override, which is
 * load-bearing: `tailwind-merge` only resolves a conflict between two classes
 * with the *same* variant prefix. A bare `max-h-none` would not beat
 * `data-[vaul-drawer-direction=bottom]:max-h-[80dvh]` — the data-variant has the
 * higher specificity and would keep winning in the browser.
 */
const config = {
  variants: {
    size: {
      default: `
        data-[vaul-drawer-direction=top]:max-h-[80dvh]
        data-[vaul-drawer-direction=top]:rounded-b-offset16
        data-[vaul-drawer-direction=bottom]:max-h-[80dvh]
        data-[vaul-drawer-direction=bottom]:rounded-t-offset16
        data-[vaul-drawer-direction=left]:w-3/4
        data-[vaul-drawer-direction=left]:sm:max-w-sm
        data-[vaul-drawer-direction=left]:rounded-r-offset16
        data-[vaul-drawer-direction=right]:w-3/4
        data-[vaul-drawer-direction=right]:sm:max-w-sm
        data-[vaul-drawer-direction=right]:rounded-l-offset16
      `,
      full: `
        inset-0 h-full w-full
      `,
    },
  },
  defaultVariants: {
    size: "default",
  } as const,
};

const drawerContentVariants = cva(base, config);

/**
 * Vaul's drag affordance, drawn only for a drawer that comes up from the bottom.
 *
 * It is our own element rather than `Drawer.Handle`, which ships a hardcoded
 * `background:#e2e2e4` in the stylesheet Vaul injects at runtime — a colour no
 * brand token can reliably beat, since whether our class or their rule wins comes
 * down to which stylesheet the browser saw last. The cost is `handleOnly` on
 * `Drawer`, which needs their element to have something to restrict dragging to.
 *
 * `hidden` by default and revealed by the group: a side drawer is dragged from
 * its whole edge and has no bar drawn on it, and a top drawer's bar would sit at
 * the wrong end of the panel.
 *
 * Its own margin, unlike everything else here: the bar is the drawer's element
 * rather than the caller's, so the space around it is the drawer's to set.
 */
const handle = `
  mx-auto mt-4 h-2 w-25 shrink-0 rounded-full
  bg-border-neutral-strong
  hidden
  group-data-[vaul-drawer-direction=bottom]/drawer-content:block
`;

/**
 * The three regions of the panel, and the whole of what they are.
 *
 * Not styling — none of them draws padding, spacing, a colour or a rule. They are
 * the flex contract that makes a panel of fixed height behave: exactly one region
 * absorbs the leftover space and scrolls, and the other two hold their size.
 *
 * `shrink-0` is load-bearing on both ends. A flex item shrinks by default, so a
 * tall header or a two-line footer would be squeezed by long body content instead
 * of the body scrolling — which reads as a broken layout rather than as a missing
 * class.
 *
 * `min-h-0` is the load-bearing half of the middle. A flex item's minimum size is
 * its content, so without it the body grows to fit and pushes the footer off the
 * screen. Silently, and only once the content is long enough.
 *
 * `mt-auto` is what pins the footer down when the content does *not* fill the
 * panel: the body has nothing to stretch, so without it the footer floats halfway
 * up a full-height drawer.
 */
const header = "w-full shrink-0";

const body = "w-full min-h-0 flex-1 overflow-y-auto";

const footer = "mt-auto w-full shrink-0";

/**
 * Vaul's own event type for a press outside the panel, read off the prop rather
 * than imported from `@radix-ui/react-dismissable-layer` — which is a transitive
 * dependency here, not one this package declares.
 */
type PointerDownOutsideEvent = Parameters<
  NonNullable<React.ComponentProps<typeof DrawerPrimitive.Content>["onPointerDownOutside"]>
>[0];

type DrawerContentProps = React.ComponentProps<typeof DrawerPrimitive.Content> &
  VariantProps<typeof drawerContentVariants> & {
    /**
     * Stops a press outside the panel from closing the drawer.
     *
     * For a drawer the user has to answer — a payment step, an unsaved form —
     * where a stray press outside would lose their work. Escape, the close button
     * and the swipe are unaffected; `dismissible={false}` on `Drawer` is the
     * blunt version that stops all four.
     *
     * Independent of `overlay`: the veto sits on the panel's own outside-press
     * handler rather than on the scrim, so it governs the press whether or not a
     * scrim is drawn to receive it.
     *
     * Redundant under `modal={false}`, though. Vaul vetoes every outside press
     * itself in that mode — it has to, or a drawer whose whole point is to leave
     * the page usable would close the moment the user touched the page — so a
     * non-modal drawer already never closes that way, with or without this.
     *
     * Named to match `DialogContent`'s prop of the same name, so a screen that is
     * a dialog on desktop and a drawer on mobile configures both the same way.
     */
    disableOverlayClose?: boolean;
    /** Overrides the `<drawerBase>-content` this derives from `Drawer`. */
    "data-testid"?: string;
    /**
     * Render inline instead of into a portal at the document root. For a nested
     * context, or when portalling puts the panel in the wrong stacking context.
     * The scrim comes along either way.
     */
    portal?: boolean;
    /**
     * Whether to draw the scrim behind the panel.
     *
     * `false` leaves the page visible and undimmed while keeping the drawer
     * modal — the page is still inert, Escape and an outside press still close
     * it. For a panel over a layout that already dims itself, or a full-bleed one
     * where the scrim is covered anyway and only costs a paint.
     *
     * This is about *appearance* only. To leave the page **interactive**, pass
     * `modal={false}` to `<Drawer>` instead: that is the one switch that unlocks
     * the body, and Vaul then drops the scrim of its own accord, so `overlay` has
     * nothing left to say. It drops closing on an outside press along with it —
     * a non-modal drawer closes by its buttons, Escape and the swipe only.
     *
     * Not the same as `classNames={{ overlay: "hidden" }}`, which mounts the
     * element and hides it — the page stays locked and the invisible scrim still
     * swallows the press that was meant for the page behind it.
     */
    overlay?: boolean;
    /**
     * Whether to draw the drag bar. Defaults to on, which the CSS then narrows to
     * bottom-edge drawers — the only direction the design draws one for. `false`
     * removes it everywhere, for a drawer that is only ever closed by a button.
     */
    showHandle?: boolean;
    /** Classes for the parts inside. `className` styles the panel. */
    classNames?: {
      /**
       * The scrim behind the panel. `hidden` when the surrounding layout draws
       * its own — the panel still needs the overlay mounted, because it is what
       * makes the page behind it inert.
       */
      overlay?: string;
      /** The drag bar at the top of a bottom-edge drawer. */
      handle?: string;
    };
  };

/**
 * The panel itself, over its own scrim.
 *
 * `size="default"` stops short of the opposite edge — three quarters of the width
 * for a side drawer, 80% of the height for a top or bottom one — and rounds the
 * corners it exposes. `size="full"` covers the screen: edge to edge, no radius,
 * and otherwise identical. Geometry only — what a full-bleed panel is painted is
 * a `className` from whatever is put inside it.
 *
 * It draws no padding and stacks nothing: a column is all it imposes, and that
 * only so its three regions work. Put the long part of your content in
 * `DrawerBody` — it is the one that scrolls, and `DrawerHeader` and `DrawerFooter`
 * are what stay put while it does.
 *
 * @param {('default' | 'full')} [size='default'] - How much of the screen the panel takes
 * @param {boolean} [portal=true] - Render into a portal at the document root
 * @param {boolean} [overlay=true] - Whether to draw the scrim. Appearance only — `modal={false}` on `<Drawer>` is what leaves the page interactive
 * @param {boolean} [disableOverlayClose=false] - Stop a press outside the panel from closing it. Already the case under `modal={false}`
 * @param {boolean} [showHandle=true] - Whether to draw the drag bar on a bottom drawer
 * @param {string} [className] - Additional CSS classes for the panel
 * @param {object} [classNames] - Classes for the parts inside
 * @param {React.ReactNode} children - Header, body and footer
 *
 * @example
 * ```tsx
 * <DrawerContent>
 *   <DrawerTitle className="sr-only">Filters</DrawerTitle>
 *   <DrawerBody>…</DrawerBody>
 * </DrawerContent>
 * ```
 *
 * @example
 * ```tsx
 * // A step the user has to answer: the scrim stops dismissing it, so the only
 * // ways out are the buttons, Escape and the swipe
 * <DrawerContent disableOverlayClose>…</DrawerContent>
 * ```
 *
 * @example
 * ```tsx
 * // Undimmed, still modal: the page shows through, but it is inert
 * <DrawerContent overlay={false}>…</DrawerContent>
 *
 * // Undimmed and still usable: the page keeps working behind the panel, and
 * // Vaul drops the scrim itself, so `overlay` is not needed here
 * <Drawer modal={false}>
 *   <DrawerContent>…</DrawerContent>
 * </Drawer>
 * ```
 *
 * @cssVariables
 * Radius:
 * - `--radius-offset16`
 *
 * Semantic colors:
 * - `--color-background-layout-surface`
 * - `--color-border-neutral-strong`
 */
function DrawerContent({
  className,
  classNames,
  size,
  children,
  portal = true,
  overlay = true,
  disableOverlayClose = false,
  showHandle = true,
  onPointerDownOutside,
  "data-testid": override,
  ref,
  ...props
}: DrawerContentProps) {
  const { testId, testIdFor } = usePartTestId("content", override);

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

  // Vaul dismisses unless the outside-press event is defaultPrevented, so this is
  // the veto rather than a separate close path. The caller's own handler runs
  // first either way — it may want to know about the press it is not acting on.
  //
  // On the panel, not on the scrim, which is why it still works with
  // `overlay={false}`: Radix listens for the press on the document, so the panel
  // hears it whether or not there is a scrim in the way to receive it.
  const handlePointerDownOutside = (event: PointerDownOutsideEvent) => {
    onPointerDownOutside?.(event);
    if (disableOverlayClose) event.preventDefault();
  };

  const framed = (
    <>
      {overlay && <DrawerOverlay className={classNames?.overlay} />}
      <DrawerPrimitive.Content
        ref={attachPanel}
        data-testid={testId}
        className={cn(drawerContentVariants({ size }), className)}
        onPointerDownOutside={handlePointerDownOutside}
        {...props}
      >
        {/* At full bleed there is no edge to drag from — the panel already covers
            the screen — so the bar would be an affordance for a gesture that does
            nothing but close it. */}
        {showHandle && size !== "full" && (
          <div
            aria-hidden
            data-testid={testIdFor("handle")}
            className={cn(handle, classNames?.handle)}
          />
        )}

        {/* A Select or Popover opened in here portals into the panel rather than
            the body, so it stacks inside the drawer instead of against it. */}
        <PortalContainerProvider value={panel}>{children}</PortalContainerProvider>
      </DrawerPrimitive.Content>
    </>
  );

  if (!portal) return framed;

  return <DrawerPortal>{framed}</DrawerPortal>;
}

/**
 * The top region: holds its height, does not scroll.
 *
 * A slot and nothing more. It draws no padding, no rule and no close button —
 * what goes at the top of a panel, and how it is spaced, belongs to the component
 * being shown. All this guarantees is that whatever you put here stays put while
 * `DrawerBody` scrolls under it.
 *
 * - @param {string} [className] - Additional CSS classes. This is where padding goes
 *
 * @example
 * ```tsx
 * <DrawerHeader className="flex items-center justify-between p-4">
 *   <DrawerTitle className={headingVariants({ size: "s", weight: "bold" })}>Filters</DrawerTitle>
 *   <DrawerClose asChild>
 *     <Button variant="ghost" size="sm" aria-label="Close"><XIcon /></Button>
 *   </DrawerClose>
 * </DrawerHeader>
 * ```
 */
function DrawerHeader({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<"div"> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("header", override);

  return <div data-testid={testId} className={cn(header, className)} {...props} />;
}

/**
 * The middle region: takes the leftover height and scrolls inside it.
 *
 * This is the one that matters. Put the long part of your content here rather
 * than in a bare `<div>` — without it the panel grows to fit and the footer goes
 * off the bottom of the screen, which only shows up once someone has enough data
 * to overflow it.
 *
 * It lays nothing out inside itself: stacking, spacing and padding are yours.
 *
 * - @param {string} [className] - Additional CSS classes. This is where padding goes
 *
 * @example
 * ```tsx
 * <DrawerBody className="flex flex-col gap-4 p-4">…</DrawerBody>
 * ```
 */
function DrawerBody({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<"div"> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("body", override);

  return <div data-testid={testId} className={cn(body, className)} {...props} />;
}

/**
 * The bottom region: pinned to the bottom of the panel, holds its height, does
 * not scroll.
 *
 * A slot like `DrawerHeader`. It imposes no direction and no gap, so buttons in a
 * column are `className="flex flex-col gap-2 p-4"` and buttons in a row are
 * `className="flex gap-2 p-4 [&>*]:flex-1"` — the screen's decision either way.
 *
 * - @param {string} [className] - Additional CSS classes. This is where padding goes
 *
 * @example
 * ```tsx
 * <DrawerFooter className="flex flex-col gap-2 p-4">
 *   <Button size="lg">Apply</Button>
 *   <DrawerClose asChild>
 *     <Button size="lg" variant="outline">Cancel</Button>
 *   </DrawerClose>
 * </DrawerFooter>
 * ```
 */
function DrawerFooter({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<"div"> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("footer", override);

  return <div data-testid={testId} className={cn(footer, className)} {...props} />;
}

export {
  DrawerBody,
  DrawerContent,
  drawerContentVariants,
  type DrawerContentProps,
  DrawerFooter,
  DrawerHeader,
};
