"use client";

import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { buttonVariants } from "@/atoms/Button";
import { bodyVariants } from "@/atoms/Typography";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

const root = "flex w-full shrink-0 flex-col gap-4";

/**
 * Figma's `Button Orientation`. `horizontal` splits the row evenly rather than
 * sizing each button to its label, which is what keeps a Confirm/Cancel pair
 * symmetrical however long the words are.
 */
const buttons = {
  vertical: "flex w-full flex-col gap-2",
  horizontal: "flex w-full gap-2 [&>*]:flex-1",
} as const;

const linkContainer = "flex w-full items-center justify-center";

const captionText = "w-full text-center text-foreground-on-surface-muted";

type DialogFooterProps = React.ComponentProps<"div"> & {
  /**
   * How the buttons run. `horizontal` puts them side by side in equal halves,
   * `vertical` stacks them full width.
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Figma's centred link under the buttons — terms, help, "maybe later". Pass the
   * single element that carries the destination (an `<a>`, or a router's `Link`);
   * the footer dresses it as the designed link button and it keeps its own `href`.
   *
   * An element rather than a `ReactNode`, because it is dressed rather than
   * wrapped: `link="Terms apply"` has no `className` to receive and would render
   * an empty row.
   */
  link?: React.ReactElement;
  /** The muted line of small print under everything else. */
  caption?: React.ReactNode;
  /**
   * Names the footer; the parts derive theirs from it as `-buttons`, `-link` and
   * `-caption`.
   */
  "data-testid"?: string;
  /** Classes for the parts inside. `className` styles the footer column. */
  classNames?: {
    /** The row or column the buttons sit in. */
    buttons?: string;
    link?: string;
    caption?: string;
  };
};

/**
 * The bottom of the dialog: the actions, and the two optional lines Figma draws
 * under them — a centred link and a line of small print.
 *
 * Buttons are whatever you pass, so their variants stay yours; the footer only
 * decides how they are laid out. The design draws them at `size="lg"`, which is
 * the 48px box, so pass that.
 *
 * @param {('horizontal' | 'vertical')} [orientation='horizontal'] - How the buttons run
 * @param {React.ReactElement} [link] - The centred link under the buttons
 * @param {React.ReactNode} [caption] - The muted small print under everything
 * @param {string} [className] - Additional CSS classes for the footer column
 * @param {object} [classNames] - Classes for the parts inside
 * @param {string} [data-testid] - Base test id; the parts derive theirs from it
 *
 * @example
 * ```tsx
 * <DialogFooter>
 *   <Button size="lg">Confirm</Button>
 *   <DialogClose asChild>
 *     <Button size="lg" variant="outline">Cancel</Button>
 *   </DialogClose>
 * </DialogFooter>
 * ```
 *
 * @example
 * ```tsx
 * // Stacked, with both optional lines
 * <DialogFooter
 *   orientation="vertical"
 *   link={<a href="/terms">Terms apply</a>}
 *   caption="You can change this at any time."
 * >
 *   <Button size="lg">Claim bonus</Button>
 *   <DialogClose asChild>
 *     <Button size="lg" variant="outline">Not now</Button>
 *   </DialogClose>
 * </DialogFooter>
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
function DialogFooter({
  orientation = "horizontal",
  link,
  caption,
  children,
  className,
  classNames,
  "data-testid": override,
  ...props
}: DialogFooterProps) {
  const { testId, testIdFor } = usePartTestId("footer", override);

  return (
    <div
      data-orientation={orientation}
      data-testid={testId}
      className={cn(root, className)}
      {...props}
    >
      {children && (
        <div
          data-testid={testIdFor("buttons")}
          className={cn(buttons[orientation], classNames?.buttons)}
        >
          {children}
        </div>
      )}

      {link && (
        <div className={linkContainer}>
          {/* `Slot` dresses what was passed rather than wrapping it, so the `<a>`
              keeps its own `href` and the footer only supplies the styling. */}
          <Slot
            data-testid={testIdFor("link")}
            className={cn(buttonVariants({ variant: "link", size: "xs" }), classNames?.link)}
          >
            {link}
          </Slot>
        </div>
      )}

      {caption && (
        <p
          data-testid={testIdFor("caption")}
          className={cn(
            bodyVariants({ size: "s", weight: "regular" }),
            captionText,
            classNames?.caption,
          )}
        >
          {caption}
        </p>
      )}
    </div>
  );
}

export { DialogFooter, type DialogFooterProps };
