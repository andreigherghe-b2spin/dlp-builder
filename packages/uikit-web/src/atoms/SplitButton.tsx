import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { buttonVariants } from "@/atoms/Button";
import { cn, createTestIdFor } from "@/lib/utils";

/** Button's variants minus `link`: it is not a box, so there is no seam to divide. */
type SplitButtonVariant = Exclude<
  NonNullable<VariantProps<typeof buttonVariants>["variant"]>,
  "link"
>;

/** Button's size axis, unchanged — Figma draws both controls at the same five heights. */
type SplitButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

// Nothing below paints, sizes or states anything: both halves are dressed by
// `buttonVariants`, so the variants, state overlays, focus ring, heights, type and glyph
// sizes all arrive from Button. Only the seam and the label's padding are this component's.

// No `overflow-hidden`: each half's focus ring is drawn 5px outside its box.
const shell = "inline-flex w-fit shrink-0 items-center";

// `border-r-0` is the seam — one line between the halves instead of two. `min-w-0` undoes
// Button's `min-w-6`…`min-w-14`, which would pad a short label out to a square.
const label = "min-w-0 rounded-r-none border-r-0";

// Figma pads the label tighter than a whole button: 8 / 12 / 12 / 12 / 16 against Button's
// 12 / 12 / 16 / 20 / 24. The `has-` rules are restated because Button's own beat a bare
// `px-*` on specificity rather than order, so a label with a leading icon lands 4px tight.
const labelPadding: Record<SplitButtonSize, string> = {
  xs: "px-2 has-[>svg:first-child]:pl-2 has-[>svg:last-child]:pr-2",
  sm: "px-3 has-[>svg:first-child]:pl-3 has-[>svg:last-child]:pr-3",
  default: "px-3 has-[>svg:first-child]:pl-3 has-[>svg:last-child]:pr-3",
  lg: "px-3 has-[>svg:first-child]:pl-3 has-[>svg:last-child]:pr-3",
  xl: "px-4 has-[>svg:first-child]:pl-4 has-[>svg:last-child]:pr-4",
};

// Square is Button's `icon` shape: `aspect-square` takes the width from the height, and
// every right half is exactly the control's height.
const action = "rounded-l-none";

/**
 * A `<button>`'s own props for one half, minus `children` — each half already has one way
 * in: the label's is `children`, the action's is `actionIcon`. `data-testid` is declared
 * because `React.ComponentProps<"button">` carries no `data-*` keys.
 */
type SplitButtonSlotProps = Omit<React.ComponentProps<"button">, "children"> & {
  "data-testid"?: string;
};

type SplitButtonProps = React.ComponentProps<"div"> & {
  /**
   * The icon half's accessible name. Required, and translate it: the half is icon-only and
   * the glyph is swappable, so a default of `"Close"` would be wrong for anyone who
   * changed it and wrong in English for most of the rest.
   */
  actionLabel: string;
  /** The icon half's glyph. Defaults to `X`, which is Figma's own default. */
  actionIcon?: React.ReactNode;
  /** Inerts **both** halves — the one state the design draws for the whole control. */
  disabled?: boolean;
  size?: SplitButtonSize;
  variant?: SplitButtonVariant;
  /** Per-half `<button>` props: handlers, `disabled`, a `className`, a `data-testid`. */
  slotProps?: {
    label?: SplitButtonSlotProps & { asChild?: boolean };
    action?: SplitButtonSlotProps;
  };
  /** Names the control; the halves become `<testId>-label` and `<testId>-action`. */
  "data-testid"?: string;
};

/**
 * A labelled action with a second, independent action beside it — Figma's
 * `Split button` (`3188:191`).
 *
 * It is a `Button` split down the middle, and after Figma's redraw that is literally true:
 * the same five sizes by the same names, the same heights, the same `Label` type, the same
 * glyph sizes, the same radius and the same six variants. Exactly two things are its own —
 * the seam, and a left half padded more tightly than a whole button.
 *
 * What makes it a component rather than two buttons in a row is that **it reads as one
 * control and behaves as two**: the label opens the thing, the icon beside it dismisses
 * it, so they hover, press, focus and disable separately. That separation is not
 * implemented here and that is the point — each half is a real `<button>` dressed by
 * `buttonVariants`, so its states are the element's own `:hover`, `:active` and
 * `:focus-visible`. Borrowing the class builder rather than rendering `Button` is also
 * what keeps this an atom.
 *
 * `variant`, `size` and `disabled` describe the control and live on the root; anything
 * belonging to one half goes in `slotProps`. The root is a plain `<div>` — not focusable,
 * no `onClick` — so a handler on it would be a handler on neither action.
 *
 * - @param {string} actionLabel - The icon half's accessible name. Required
 * - @param {React.ReactNode} [actionIcon] - The icon half's glyph. Defaults to `X`
 * - @param {('default' | 'secondary' | 'destructive' | 'outline' | 'overlay' | 'ghost')} [variant='default'] - Shared by both halves. `Button`'s variants; `link` is excluded, having no box for a seam to divide
 * - @param {('xs' | 'sm' | 'default' | 'lg' | 'xl')} [size='default'] - `Button`'s size axis, unchanged: a 24, 32, 40, 48 or 56px tall control
 * - @param {boolean} [disabled=false] - Inerts both halves. A half can still be disabled on its own through its slot
 * - @param {{label?: object, action?: object}} [slotProps] - Per-half `<button>` props, minus `children`. The label's slot also takes `asChild`
 * - @param {string} [className] - Additional CSS classes for the shell
 * - @param {string} [data-testid] - Names the control; the halves become `<testId>-label` and `<testId>-action`
 * - @param {React.ReactNode} children - The label half's content
 *
 * @example
 * ```tsx
 * // The two actions the design is for: open the thing, or dismiss it.
 * <SplitButton
 *   actionLabel="Remove game"
 *   data-testid="game"
 *   slotProps={{ label: { onClick: open }, action: { onClick: remove } }}
 * >
 *   Game name
 * </SplitButton>
 *
 * // The label is often a link — the shape the brand apps' `Pill` had.
 * <SplitButton actionLabel="Remove from recent" slotProps={{ label: { asChild: true } }}>
 *   <a href="/games/starburst">Starburst</a>
 * </SplitButton>
 *
 * // Another glyph.
 * <SplitButton
 *   actionIcon={<ChevronDown aria-hidden />}
 *   actionLabel="Show options"
 *   size="xl"
 *   slotProps={{ action: { onClick: open } }}
 * >
 *   Show options
 * </SplitButton>
 * ```
 *
 * @remarks
 * Requires `@ui/themes/config.css` for the `button-base` utility that carries both halves'
 * state overlays and focus rings. That file is already every brand app's one required
 * import, so there is nothing to add.
 *
 * @cssVariables
 * Component and typography:
 * - `--components-button-radius`
 * - `--components-button-border`
 * - `--typography-font-family`
 * - `--typography-font-weight-bold`
 * - `--typography-font-size-label-s`
 * - `--typography-font-size-label-m`
 * - `--typography-font-size-label-l`
 * - `--typography-font-size-label-xl`
 *
 * Semantic colors: inherited unchanged from [Button](./Button.tsx) — the container,
 * foreground, border and state tokens its variants use.
 */
function SplitButton({
  actionIcon,
  actionLabel,
  children,
  className,
  disabled = false,
  size = "default",
  slotProps,
  variant = "default",
  ...props
}: SplitButtonProps) {
  // Read off `props` rather than destructured, so `...props` stays the one thing putting
  // the attribute on the shell — see "Test ids" in CLAUDE.md.
  const testIdFor = createTestIdFor(props["data-testid"]);

  // `className` and `disabled` come out of each slot rather than being left to the spread,
  // for two different reasons. `className` has to be *composed*: left in, the spread lands
  // the caller's raw string on top of the computed attribute and wipes `buttonVariants`
  // with it. `disabled` has to be *merged* with the root's: left in, a `disabled: undefined`
  // from a caller who never mentioned it lands last and undoes the root's flag.
  const {
    asChild: labelAsChild = false,
    className: labelClassName,
    disabled: labelDisabled,
    ...labelProps
  } = slotProps?.label ?? {};
  const {
    className: actionClassName,
    disabled: actionDisabled,
    ...actionProps
  } = slotProps?.action ?? {};

  const LabelComp = labelAsChild ? Slot : "button";
  const labelIsDisabled = disabled || labelDisabled;

  return (
    // `role="group"` ties the halves together for a screen reader; without it the two are
    // announced as unrelated buttons. Pass an `aria-label` through `...props` to name the
    // group where the label alone is not enough.
    <div className={cn(shell, className)} role="group" {...props}>
      <LabelComp
        aria-disabled={labelIsDisabled || undefined}
        className={cn(buttonVariants({ variant, size }), label, labelPadding[size], labelClassName)}
        // `disabled` reaches only a real `<button>`, and `asChild` most often makes this an
        // `<a>`, where the attribute is inert. `button-base` reads `[data-disabled]` beside
        // `:disabled` for exactly that case. The greying still does not reach a link —
        // Button's `disabled:` colours are keyed on the pseudo-class — a limitation this
        // shares with `<Button asChild disabled>` rather than one it adds.
        data-disabled={labelIsDisabled || undefined}
        data-testid={testIdFor("label")}
        disabled={labelIsDisabled}
        {...labelProps}
      >
        <Slottable>{children}</Slottable>
      </LabelComp>
      <button
        aria-label={actionLabel}
        className={cn(buttonVariants({ variant, size, icon: true }), action, actionClassName)}
        data-testid={testIdFor("action")}
        disabled={disabled || actionDisabled}
        // Always a real `<button>` and always a secondary action, so the default that stops
        // it submitting an enclosing form is safe. The label gets none: `asChild` may make
        // it an `<a>`, where `type` is a MIME hint.
        type="button"
        {...actionProps}
      >
        {actionIcon ?? <X aria-hidden />}
      </button>
    </div>
  );
}

export { SplitButton, type SplitButtonProps, type SplitButtonSlotProps };
