"use client";

import type * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Slot } from "@radix-ui/react-slot";
import { ArrowLeft, XIcon } from "lucide-react";

import { buttonVariants } from "@/atoms/Button";
import { Separator } from "@/atoms/Separator";
import { bodyVariants, headingVariants } from "@/atoms/Typography";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

const root = "group/dialog-header flex w-full shrink-0 items-center gap-2";

/**
 * The leading box is Figma's "Spaceholder". In `Align center` it is there whether
 * or not it holds anything, because it is what balances the close button on the
 * other side and so makes a centred title optically centred.
 *
 * `min-w-8` rather than `w-8`: the reserve is 32px when empty or holding one icon
 * button, and grows rather than overflowing when a caller puts both `info` and
 * `onBack` in it — a combination the design does not draw, and one that would
 * otherwise spill across the title.
 */
const leading = {
  start: "flex shrink-0 items-center gap-2",
  center: "flex min-w-8 shrink-0 items-center gap-2",
} as const;

/**
 * Figma nests the title in a `Container` frame that fills the row. The alignment
 * lives on it rather than on the title, because in `Align center` the title is
 * told to fill the container and centre inside it, while in `Align start` it
 * ellipsises instead of wrapping.
 *
 * `flex-wrap` is a safety net rather than part of the design. Figma puts nothing
 * but a title on this line, but the shadcn shape this component grew out of —
 * `<DialogHeader><DialogTitle /><DialogDescription /></DialogHeader>` — is still
 * what a caller coming from `Sheet` or `AlertDialog` will write. Wrapping drops
 * that second line under the title instead of squeezing it against an ellipsised
 * one. The description belongs in `DialogBody`; this just keeps the wrong place
 * from looking broken.
 */
const container = {
  start: "flex min-w-0 flex-1 flex-wrap items-center gap-2 overflow-hidden",
  center: "flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2 overflow-hidden",
} as const;

/** Figma's brand-logo frame: 24px tall with 2px of breathing room. */
const logoSlot = "flex h-6 shrink-0 items-center py-0.5";

/**
 * `truncate` and `flex-1` are properties of the title's own box — the first needs
 * the block container the text overflows, the second is a flex-item property — so
 * neither can be set on the row around it. They read the alignment off the
 * header's `data-align` instead, which is the same decision made where it applies
 * rather than aimed at the title from a parent's selector.
 *
 * Outside a `DialogHeader` no group matches and the title is left plain.
 */
const titleText = `
  min-w-0
  text-foreground-on-surface-default
  group-data-[align=start]/dialog-header:truncate
  group-data-[align=center]/dialog-header:flex-1
  group-data-[align=center]/dialog-header:text-center
`;

const descriptionText = "text-foreground-on-surface-muted";

type DialogHeaderProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The title, and anything else that belongs on the title's line. */
  children?: React.ReactNode;
  /**
   * Where the title sits. `center` also reserves 32px on the leading edge, so the
   * title is centred against the close button rather than against the row.
   *
   * Figma draws `center` with a title and an optional info slot only — no back
   * arrow, no logo.
   */
  align?: "start" | "center";
  /**
   * Draws the back arrow before the title and calls this when it is pressed. For
   * a dialog that is a flow rather than a single screen.
   */
  onBack?: () => void;
  /**
   * Figma's info button — the leading 32px slot. Pass the single element that
   * should carry the behaviour (a `<button>`, or a tooltip's trigger); the header
   * dresses it as a ghost icon button and it keeps its own handlers.
   *
   * An element rather than a `ReactNode`, because it is dressed rather than
   * wrapped: a bare string has no `className` to receive and would disappear, and
   * a fragment has nothing single to dress.
   */
  info?: React.ReactElement;
  /** The brand logo, drawn after the title. */
  logo?: React.ReactNode;
  /**
   * Whether to draw the close button. Closing is reported by `<Dialog>` — through
   * `onClose` or `onOpenChange` — because the overlay and Escape close the dialog
   * too, and a button cannot hear those.
   */
  showClose?: boolean;
  /**
   * Whether to draw the rule under the header — a `Separator`, rendered after the
   * row. Defaults to whether the header has anything on its title line, which is
   * how Figma's `No text` variant behaves.
   */
  divider?: boolean;
  /**
   * Names the header; the parts derive theirs from it as `-info`, `-back`,
   * `-logo` and `-close`.
   */
  "data-testid"?: string;
  /** Classes for the parts inside. `className` styles the header row. */
  classNames?: {
    /** The box the title sits in. */
    container?: string;
    info?: string;
    back?: string;
    logo?: string;
    close?: string;
    /** The rule under the row. */
    divider?: string;
  };
};

/**
 * The top of the dialog: the title, the close button, and the optional things
 * Figma puts around them — an info button on the leading edge, a back arrow for
 * a dialog that is a flow, and the brand logo beside the title.
 *
 * A `Separator` divides it from the body, and the body is what scrolls, so the
 * header stays put however long the content is. A header with nothing on its
 * title line — Figma's `No text` — drops the rule and its spacing with it.
 *
 * The rule is rendered after the row rather than as a border on it, so this
 * component returns the row and the separator as siblings — which is what puts
 * the panel column's 16px gap on both sides of the line.
 *
 * `align="center"` reserves 32px on the leading edge whether or not `info` is
 * passed, which is what centres the title against the close button instead of
 * against the row. With `showClose={false}` there is nothing to balance, so the
 * reserve goes and the title centres against the row itself.
 *
 * **This is one row, not a column.** The shadcn shape it grew out of —
 * `<DialogHeader><DialogTitle /><DialogDescription /></DialogHeader>`, still what
 * `Sheet`, `Drawer` and `AlertDialog` take — puts the description on the title's
 * line, where the design has no room for it. It wraps under the title rather than
 * breaking, but the description belongs in `DialogBody`.
 *
 * @param {React.ReactNode} [children] - The title, normally a `DialogTitle`
 * @param {('start' | 'center')} [align='start'] - Where the title sits
 * @param {() => void} [onBack] - Draws the back arrow and reports the press
 * @param {React.ReactElement} [info] - The leading info slot; dressed as a ghost icon button
 * @param {React.ReactNode} [logo] - The brand logo, after the title
 * @param {boolean} [showClose=true] - Whether to draw the close button
 * @param {boolean} [divider] - Whether to draw the rule; defaults to whether there is a title
 * @param {string} [className] - Additional CSS classes for the header row
 * @param {object} [classNames] - Classes for the parts inside
 * @param {string} [data-testid] - Base test id; the parts derive theirs from it
 *
 * @example
 * ```tsx
 * <DialogHeader>
 *   <DialogTitle>Header</DialogTitle>
 * </DialogHeader>
 * ```
 *
 * @example
 * ```tsx
 * // A step in a flow, with the brand mark and a help affordance
 * <DialogHeader
 *   onBack={goBack}
 *   info={<button type="button" aria-label="About this offer"><Info /></button>}
 *   logo={<BrandLogo />}
 * >
 *   <DialogTitle>Claim your bonus</DialogTitle>
 * </DialogHeader>
 * ```
 *
 * @example
 * ```tsx
 * // Figma's `No text`: controls only, and no rule under them
 * <DialogHeader />
 * ```
 *
 * @cssVariables
 * Semantic colors:
 * - `--color-border-neutral-subtle`
 */
function DialogHeader({
  children,
  align = "start",
  onBack,
  info,
  logo,
  showClose = true,
  divider: showDivider,
  className,
  classNames,
  "data-testid": override,
  ...props
}: DialogHeaderProps) {
  const { testId, testIdFor } = usePartTestId("header", override);
  const hasDivider = showDivider ?? children != null;

  // Empty in `center`, the leading box is the reserve that balances the close
  // button — so it is only worth reserving when there is a close button to
  // balance. Without one, `center` should centre against the row itself, and an
  // empty 32px box would push the title 16px off it: the exact miscentring the
  // reserve exists to prevent.
  const hasLeading = info != null || onBack != null || (align === "center" && showClose);

  return (
    <>
      <div data-align={align} data-testid={testId} className={cn(root, className)} {...props}>
        {hasLeading && (
          <div className={leading[align]}>
            {info && (
              // `Slot` dresses what was passed rather than wrapping it, so a bare
              // `<button>` and a tooltip trigger both land as the designed icon
              // button and keep their own handlers.
              <Slot
                data-testid={testIdFor("info")}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-8",
                  classNames?.info,
                )}
              >
                {info}
              </Slot>
            )}

            {onBack && (
              <button
                type="button"
                aria-label="Back"
                data-testid={testIdFor("back")}
                onClick={onBack}
                className={cn(buttonVariants({ variant: "link", size: "xl" }), classNames?.back)}
              >
                <ArrowLeft aria-hidden />
              </button>
            )}
          </div>
        )}

        <div className={cn(container[align], classNames?.container)}>
          {children}

          {logo && (
            <div data-testid={testIdFor("logo")} className={cn(logoSlot, classNames?.logo)}>
              {logo}
            </div>
          )}
        </div>

        {showClose && (
          <DialogPrimitive.Close
            aria-label="Close"
            data-testid={testIdFor("close")}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), classNames?.close)}
          >
            {/* The accessible name is an `aria-label` rather than an `sr-only` span
              because `buttonVariants` narrows a side's padding with
              `has-[>svg:last-child]`, and a second child — hidden or not — is what
              `:last-child` matches, leaving the button 8px one side and 12px the
              other. */}
            <XIcon aria-hidden />
          </DialogPrimitive.Close>
        )}
      </div>

      {/* A sibling of the row rather than a border on it, so the rule is the
          kit's `Separator` and the 16px above and below it are the panel
          column's own gap — the same spacing Figma reaches with `pb-16` plus a
          bottom border. */}
      {hasDivider && <Separator className={classNames?.divider} />}
    </>
  );
}

/**
 * The dialog's title, drawn as Figma's `Heading/Small/Bold`.
 *
 * It is Radix's title, not a bare heading, so the dialog is labelled by it —
 * which is what a screen reader announces on open. Every dialog needs one.
 *
 * For a dialog whose title is not drawn, put an `sr-only` one in `DialogBody`
 * rather than in the header: the header takes the rule from whether it has
 * anything on its title line, and a title that is present but invisible would
 * draw a rule under an apparently empty row. `<DialogHeader divider={false}>`
 * is the other way round to the same place.
 *
 * Truncation and centring belong to `DialogHeader`, which knows its own
 * alignment: the title ellipsises on one line when the header is left-aligned
 * and wraps, centred, when it is not.
 *
 * - @param {string} [className] - Additional CSS classes for the title
 *
 * @example
 * ```tsx
 * <DialogTitle>Delete account</DialogTitle>
 * ```
 *
 * @cssVariables
 * Typography:
 * - `--typography-font-family`
 * - `--typography-font-size-heading-s`
 * - `--typography-font-weight-bold`
 *
 * Semantic colors:
 * - `--color-foreground-on-surface-default`
 */
function DialogTitle({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("title", override);

  return (
    <DialogPrimitive.Title
      data-testid={testId}
      className={cn(headingVariants({ size: "s", weight: "bold" }), titleText, className)}
      {...props}
    />
  );
}

/**
 * The dialog's accessible description, drawn as Figma's `Body/Small/Regular`.
 *
 * Radix wires it to the panel through `aria-describedby`, so it is read out
 * after the title on open. The design does not draw a second line in the header,
 * so this usually belongs in `DialogBody` — or `sr-only`, when the dialog's
 * purpose is already obvious on screen but not to a screen reader.
 *
 * - @param {string} [className] - Additional CSS classes for the description
 *
 * @example
 * ```tsx
 * <DialogDescription className="sr-only">
 *   Confirm or cancel deleting your account.
 * </DialogDescription>
 * ```
 *
 * @cssVariables
 * Typography:
 * - `--typography-font-family`
 * - `--typography-font-size-body-s`
 * - `--typography-font-weight-regular`
 *
 * Semantic colors:
 * - `--color-foreground-on-surface-muted`
 */
function DialogDescription({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("description", override);

  return (
    <DialogPrimitive.Description
      data-testid={testId}
      className={cn(bodyVariants({ size: "s", weight: "regular" }), descriptionText, className)}
      {...props}
    />
  );
}

export { DialogDescription, DialogHeader, DialogTitle, type DialogHeaderProps };
