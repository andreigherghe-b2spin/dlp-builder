"use client";

import { isValidElement } from "react";
import type * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { bodyVariants, captionVariants } from "@/atoms/Typography";
import { usePortalContainer } from "@/lib/portalContainer";
import { TestIdProvider, usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * Figma's `Tooltip / Subcomponent / Container`: 16px of padding and a 16px gap,
 * which is the space between the text block and the buttons row and nothing else
 * — a tooltip with no `actions` has one child and the gap never applies.
 *
 * `max-w-xs` (20rem) stands in for the 310px the Figma frame is drawn at: the
 * frame is a canvas measurement rather than a token, and 20rem is the nearest
 * step on the container scale. A tooltip that needs a different width sets one
 * through `className`.
 */
const content = `
  z-50 flex w-fit max-w-xs flex-col gap-4 p-4
  rounded-comfortable
  bg-background-layout-inverted

  origin-(--radix-tooltip-content-transform-origin)
  animate-in fade-in-0 zoom-in-95
  data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
  data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2
  data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
`;

/**
 * The inner `Container` frame. Its 4px gap is what separates caption, title and
 * description from each other, as against the 16px that separates the whole
 * block from the buttons — two different frames in Figma, and the only reason
 * this one exists as an element.
 *
 * `break-words` is Figma's `word-break: break-word`: a tooltip is narrow and the
 * strings in one are frequently unbroken — an email address, a game name — so a
 * word longer than the panel wraps rather than overflowing it.
 */
const textStack = "flex flex-col justify-center gap-1 break-words";

const captionText = cn(captionVariants({ weight: "bold" }), "text-foreground-on-inverted-muted");
const titleText = cn(
  bodyVariants({ size: "l", weight: "semibold" }),
  "text-foreground-on-inverted-default",
);
const descriptionText = cn(
  bodyVariants({ size: "m", weight: "regular" }),
  "text-foreground-on-inverted-default",
);

/** Figma's `Buttons` frame — the row runs at the buttons' own widths, not stretched. */
const actionsRow = "flex items-center gap-2";

/**
 * Figma's arrow is 24×12 with a 2.5px rounded tip, which Radix's own arrow — a
 * hard-pointed `polygon` — cannot express, so the path is passed in through
 * `asChild` instead.
 *
 * The `viewBox` is 12.35 tall against a 12px box because the curve overshoots the
 * flat edge by that much in the export. Radix sets `preserveAspectRatio="none"`,
 * so the extra third of a pixel is squashed back in rather than clipped off the
 * point.
 */
const arrowPath =
  "M14.4961 10.9718C13.3087 12.3427 10.6913 12.3427 9.50385 10.9718L0 0H24L14.4961 10.9718Z";

/**
 * How far the arrow protrudes, which is also the gap the panel keeps from its
 * trigger. Radix offsets a panel by `sideOffset + arrowHeight` and measures
 * `arrowHeight` off the rendered arrow, so with no arrow it is 0 and the panel sits
 * flush against the trigger. `sideOffset` defaults to this when `showArrow` is off,
 * which puts the panel in the same place either way.
 */
const ARROW_HEIGHT = 12;

/**
 * Whether a node draws anything, as against merely being passed.
 *
 * `!= null` is not enough: `{isFirstStep && "Steps 1 of 5"}` passes `false` when the
 * condition fails, and `false` is not `null` — so a part guarded that way rendered an
 * empty box and still spent the panel's 16px gap on it.
 */
function isDrawn(node: React.ReactNode): boolean {
  return node != null && node !== false && node !== true && node !== "";
}

/**
 * The panel's text as a string, or `""` when it cannot be read off the nodes.
 *
 * Radix renders `TooltipContent`'s children **twice** — the visible panel, and a
 * `VisuallyHidden` copy that is what the trigger's `aria-describedby` names:
 *
 * ```jsx
 * <Slottable>{children}</Slottable>
 * <VisuallyHidden id={contentId} role="tooltip">{ariaLabel || children}</VisuallyHidden>
 * ```
 *
 * For shadcn's one-line tooltip that copy is harmless. For Figma's it is not:
 * every `data-testid` in the panel exists twice, and so does every button in
 * `actions` — and `VisuallyHidden` hides with `clip` rather than `display: none`,
 * so those invisible buttons stay in the tab order.
 *
 * `ariaLabel || children` is the way out: give Radix a string and the children
 * render once. Hence this, which is only here to build that string.
 *
 * It reads strings, numbers and arrays — so `Hi {name}`, which JSX passes as an
 * array — and down through an element's `children`. What it cannot read is text a
 * component computes: `<Trans id="x" />` resolves its string at a depth no caller
 * can reach, and an icon has no text at all. Those give `""`, and `""` means the
 * caller should pass `aria-label` itself.
 */
function panelText(node: React.ReactNode): string {
  if (typeof node === "string") return node.trim();
  if (typeof node === "number") return String(node);

  // `null`, `undefined` and both booleans render nothing — `false` in particular,
  // which is what a `cond && <p/>` leaves behind.
  if (node == null || typeof node === "boolean") return "";

  if (Array.isArray(node)) return node.map(panelText).filter(Boolean).join(" ");

  if (isValidElement(node)) {
    const { children } = node.props as { children?: React.ReactNode };
    return panelText(children);
  }

  return "";
}

// `title` is omitted before being redeclared. The native `title` on a `div` is
// `string`, and intersecting that with `ReactNode` collapses to `string & ReactNode`
// — so `title={<b/>}` did not compile despite the contract below, and a caller's
// native `title` would have been drawn as the heading. Dropping the attribute is no
// loss: a browser tooltip on a tooltip is not a thing anyone wants.
type TooltipContentProps = Omit<React.ComponentProps<typeof TooltipPrimitive.Content>, "title"> & {
  /** The uppercase line above the title — Figma's `Steps 1 of 5`. */
  caption?: React.ReactNode;
  /** The bold line the panel leads with. */
  title?: React.ReactNode;
  /**
   * The buttons under the text. Pass them as they should look — the row only
   * decides the spacing — and at `size="sm"`, which is the 32px box Figma draws.
   *
   * Reachable by pointer only; see the note on `Tooltip`.
   */
  actions?: React.ReactNode;
  /** Whether to draw the arrow pointing back at the trigger — Figma's `position: None` turns it off. */
  showArrow?: boolean;
  /**
   * What a screen reader hears in place of the panel's markup — the trigger's
   * `aria-describedby` points at it.
   *
   * Defaults to the text of `caption`, `title` and `children` joined together,
   * which is both the right description and what keeps Radix from rendering the
   * whole panel a second time; see `panelText` above. Pass one when the panel's
   * text is not plain text — a `<Trans>`, an icon, anything that computes its own
   * string.
   */
  "aria-label"?: string;
  /** Overrides the id derived from the root's; the parts derive theirs from this. */
  "data-testid"?: string;
  /** Classes for the parts inside. `className` styles the panel itself. */
  classNames?: {
    /** The column holding caption, title and description. */
    text?: string;
    caption?: string;
    title?: string;
    /** The box around `children`. */
    description?: string;
    /** The row the buttons sit in. */
    actions?: string;
    arrow?: string;
  };
};

/**
 * The panel itself: the inverted card, its text, its buttons and its arrow.
 *
 * `children` is the description — the regular-weight body line — so the
 * one-line case stays `<TooltipContent>Add to library</TooltipContent>` while
 * `caption`, `title` and `actions` add Figma's other three frames above and
 * below it. Everything the panel holds is read out as the trigger's accessible
 * description, in the order it is drawn.
 *
 * It portals, into the nearest container published by a `DialogContent` or into
 * `document.body`, so a tooltip opened from inside a dialog lands above the
 * dialog's panel without either of them naming a `z-index`.
 *
 * @param {React.ReactNode} [children] - The description line
 * @param {React.ReactNode} [caption] - The uppercase line above the title
 * @param {React.ReactNode} [title] - The bold line the panel leads with
 * @param {React.ReactNode} [actions] - The buttons under the text
 * @param {boolean} [showArrow=true] - Whether to draw the arrow
 * @param {string} [aria-label] - What a screen reader hears; defaults to the panel's own text
 * @param {('top' | 'right' | 'bottom' | 'left')} [side='top'] - Which side of the trigger it opens on
 * @param {('start' | 'center' | 'end')} [align='center'] - Where it sits along that side
 * @param {number} [sideOffset=0] - Distance in pixels from the trigger
 * @param {number} [arrowPadding=16] - How close to a corner the arrow may sit
 * @param {string} [className] - Additional CSS classes for the panel
 * @param {object} [classNames] - Classes for the parts inside
 * @param {string} [data-testid] - Overrides the id derived from the root's
 *
 * @example
 * ```tsx
 * <TooltipContent>Add to library</TooltipContent>
 * ```
 *
 * @example
 * ```tsx
 * <TooltipContent side="bottom" align="start" caption="Steps 1 of 5" title="Lovely tooltip title">
 *   There are a lot of things you can do in space.
 * </TooltipContent>
 * ```
 *
 * @cssVariables
 * Semantic colors:
 * - `--color-background-layout-inverted`
 * - `--color-foreground-on-inverted-default`
 * - `--color-foreground-on-inverted-muted`
 *
 * Radius:
 * - `--radius-comfortable`
 *
 * Typography:
 * - `--typography-font-family`
 * - `--typography-font-size-caption-m`
 * - `--typography-font-size-body-l`
 * - `--typography-font-size-body-m`
 * - `--typography-font-weight-bold`
 * - `--typography-font-weight-semibold`
 * - `--typography-font-weight-regular`
 */
function TooltipContent({
  children,
  caption,
  title,
  actions,
  showArrow = true,
  sideOffset = showArrow ? 0 : ARROW_HEIGHT,
  arrowPadding = 16,
  className,
  classNames,
  "aria-label": ariaLabel,
  "data-testid": override,
  ...props
}: TooltipContentProps) {
  const container = usePortalContainer();
  const { testId, testIdFor } = usePartTestId("content", override);
  const hasText = isDrawn(caption) || isDrawn(title) || isDrawn(children);

  // Not only the description: an `aria-label` is what stops Radix rendering the
  // whole panel a second time, so it is also what keeps every `data-testid` and
  // every button in `actions` from existing in the DOM twice. See `panelText`.
  //
  // `undefined` rather than `""` when there is no readable text, so Radix falls
  // back to its own behaviour instead of describing the trigger as blank.
  const label = ariaLabel ?? (panelText([caption, title, children]) || undefined);

  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        aria-label={label}
        data-testid={testId}
        sideOffset={sideOffset}
        arrowPadding={arrowPadding}
        className={cn(content, className)}
        {...props}
      >
        {hasText && (
          <div className={cn(textStack, classNames?.text)}>
            {isDrawn(caption) && (
              <div
                data-testid={testIdFor("caption")}
                className={cn(captionText, classNames?.caption)}
              >
                {caption}
              </div>
            )}

            {isDrawn(title) && (
              <div data-testid={testIdFor("title")} className={cn(titleText, classNames?.title)}>
                {title}
              </div>
            )}

            {isDrawn(children) && (
              <div
                data-testid={testIdFor("description")}
                className={cn(descriptionText, classNames?.description)}
              >
                {children}
              </div>
            )}
          </div>
        )}

        {isDrawn(actions) && (
          <div data-testid={testIdFor("actions")} className={cn(actionsRow, classNames?.actions)}>
            {actions}
          </div>
        )}

        {showArrow && (
          <TooltipPrimitive.Arrow asChild width={ARROW_HEIGHT * 2} height={ARROW_HEIGHT}>
            {/* Radix's popper wraps this in the span that rotates it per side, so
                the path is only ever drawn pointing down — every other side is
                that same shape turned. */}
            <svg
              aria-hidden
              data-testid={testIdFor("arrow")}
              viewBox="0 0 24 12.35"
              className={cn("fill-background-layout-inverted", classNames?.arrow)}
            >
              <path d={arrowPath} />
            </svg>
          </TooltipPrimitive.Arrow>
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

/**
 * Radix's provider: shares one open/close timer across the tooltips beneath it, so
 * moving between two adjacent triggers reopens instantly instead of re-serving the
 * delay.
 *
 * **Wrapping `Tooltip` in one changes nothing**, and that is worth knowing before
 * reaching for it. `Tooltip` renders its own provider around its `Root` — shadcn's
 * shape, kept so that a bare `<Tooltip>` works — and Radix reads the timings off the
 * *nearest* provider. So an outer `delayDuration` is overridden by the inner `0`, and
 * the skip-delay window never spans two triggers, because each tooltip is alone
 * inside its own provider.
 *
 * To delay one tooltip, pass `delayDuration` to `Tooltip` itself, which forwards it
 * to `Root` where it does take effect. This export exists for the case Radix's own
 * API needs it — assembling `TooltipPrimitive` parts by hand — not for configuring
 * the tooltips in this file.
 *
 * @param {number} [delayDuration=0] - Milliseconds a trigger must be hovered before opening
 * @param {number} [skipDelayDuration=300] - Window in which moving to another trigger opens it instantly
 */
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root> & {
  /**
   * Names the whole tooltip. Every part derives from it — `<base>-trigger`,
   * `<base>-content`, `<base>-content-title` — so this is the only one to pass.
   */
  "data-testid"?: string;
};

/**
 * A panel that explains the element it is anchored to, shown on hover or focus
 * and built on Radix's Tooltip primitive.
 *
 * The anatomy is Figma's: an inverted container holding an uppercase caption, a
 * title, a description and an optional row of buttons, with a 24×12 arrow
 * pointing back at the trigger. All four are optional, so the one-line case is
 * still `<TooltipContent>Copied</TooltipContent>` and nothing else.
 *
 * Figma's nine `position` variants are Radix's `side` and `align` on
 * `TooltipContent`, which is also what lets the panel flip itself when it would
 * otherwise leave the viewport:
 *
 * | Figma           | `TooltipContent`                  |
 * | --------------- | --------------------------------- |
 * | `Top Left`      | `side="top" align="start"`        |
 * | `Top Center`    | `side="top"` (the default)        |
 * | `Top Right`     | `side="top" align="end"`          |
 * | `Bottom Left`   | `side="bottom" align="start"`     |
 * | `Bottom Center` | `side="bottom"`                   |
 * | `Bottom Right`  | `side="bottom" align="end"`       |
 * | `Center Left`   | `side="left"`                     |
 * | `Center Right`  | `side="right"`                    |
 * | `None`          | `showArrow={false}`               |
 *
 * **A tooltip with `actions` is not reachable by keyboard**, and that is Radix's
 * design rather than an oversight: the panel takes no focus and closes on blur
 * and Escape, so a pointer is the only way to press a button inside it. Figma
 * draws the row, so it exists — but a tooltip whose buttons are the point is a
 * `Popover`, which traps focus and stays open. Use this one for buttons that
 * merely shortcut something reachable elsewhere.
 *
 * @param {boolean} [open] - Controlled open state
 * @param {boolean} [defaultOpen] - Initial open state when uncontrolled
 * @param {(open: boolean) => void} [onOpenChange] - Notified on every open and close
 * @param {number} [delayDuration=0] - Milliseconds the trigger must be hovered before opening
 * @param {boolean} [disableHoverableContent] - Close as soon as the pointer leaves the trigger, rather than letting it move onto the panel
 * @param {string} [data-testid] - Base test id; every part derives theirs from it
 *
 * @example
 * ```tsx
 * <Tooltip>
 *   <TooltipTrigger asChild>
 *     <Button variant="ghost">Add</Button>
 *   </TooltipTrigger>
 *   <TooltipContent>Add to library</TooltipContent>
 * </Tooltip>
 * ```
 *
 * @example
 * ```tsx
 * // Figma's full anatomy
 * <Tooltip data-testid="quest-hint">
 *   <TooltipTrigger asChild>
 *     <Button variant="ghost" aria-label="About this quest">
 *       <Info aria-hidden />
 *     </Button>
 *   </TooltipTrigger>
 *   <TooltipContent
 *     side="bottom"
 *     align="start"
 *     caption="Steps 1 of 5"
 *     title="Lovely tooltip title"
 *     actions={
 *       <>
 *         <Button size="sm" variant="secondary">Skip</Button>
 *         <Button size="sm">Next</Button>
 *       </>
 *     }
 *   >
 *     There are a lot of things you can do in space.
 *   </TooltipContent>
 * </Tooltip>
 * ```
 *
 * @see [API Reference](https://www.radix-ui.com/primitives/docs/components/tooltip#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/tooltip)
 */
function Tooltip({ "data-testid": testId, ...props }: TooltipProps) {
  // `Root` renders no element of its own, so the base is published rather than
  // placed: there is nothing here to carry it.
  return (
    <TestIdProvider value={testId}>
      <TooltipProvider>
        <TooltipPrimitive.Root {...props} />
      </TooltipProvider>
    </TestIdProvider>
  );
}

/**
 * The element the tooltip explains and is anchored to. Pass `asChild` to use
 * your own control rather than the bare `<button>` Radix renders — which is
 * almost always what you want, since the trigger is normally an icon button that
 * already exists.
 *
 * @param {boolean} [asChild] - Render the child element instead of a `<button>`
 * @param {string} [data-testid] - Overrides the id derived from the root's
 *
 * @example
 * ```tsx
 * <TooltipTrigger asChild>
 *   <Button variant="ghost" aria-label="Help"><Info aria-hidden /></Button>
 * </TooltipTrigger>
 * ```
 */
function TooltipTrigger({
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("trigger", override);

  return <TooltipPrimitive.Trigger data-testid={testId} {...props} />;
}

export {
  Tooltip,
  TooltipContent,
  type TooltipContentProps,
  type TooltipProps,
  TooltipProvider,
  TooltipTrigger,
};
