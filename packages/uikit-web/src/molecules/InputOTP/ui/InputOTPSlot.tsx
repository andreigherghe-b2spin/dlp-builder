"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { headingVariants } from "@/atoms/Typography";
import { useInputOTPSlot } from "@/molecules/InputOTP/lib/useInputOTPSlot";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * One box — **Figma's size as a ceiling, not as the width.**
 *
 * `Size=Mobile` is 56×64 and `Size=Desktop` is 72×80, and the two are the
 * `Mobile` and `Desktop` modes of the variable collection rather than a variant
 * a caller picks — the same pair the type scale switches between, whose
 * breakpoint is 1024px. So this is one `lg:` step at that width, and not a
 * `size` prop. `--typography-font-size-heading-xl` handles the digit on its own
 * for exactly the same reason, which is why there is no `lg:text-*` here.
 *
 * Taken literally, though, those numbers do not fit a phone: six mobile boxes
 * and five gaps come to 376px, against a 375px viewport before the page's own
 * padding, and a 320px screen is 60px short. So the box keeps the design's size
 * as its **own** size and gives up width only when the row runs out — an
 * ordinary flex row of ordinary flex items, four classes:
 *
 * - `basis-14` / `lg:basis-18` is the width the box *is*, rather than the `0` a
 *   `flex-1` would set. See the known limitation on `InputOTP` for what this does
 *   *not* fix.
 * - `grow` spends what is left after the gaps, so a row at exactly the design's
 *   width comes out at exactly 56 or 72 rather than at 71.6.
 * - `max-w-14` / `lg:max-w-18` stops the growing at the design's number, so a
 *   wide column does not stretch the boxes into letterboxes.
 * - `min-w-0` lets the default `flex-shrink: 1` take them *below* the basis when
 *   the row is narrower than 376px, which a flex item will not do while its
 *   content — a `heading/xl` digit — is wider.
 *
 * **The height is set rather than derived, and `aspect-ratio` is deliberately
 * not used.** Figma's two boxes are 7/8 and 9/10, so a ratio looked like the way
 * to hold the shape while the width moved — but it renders identically and costs
 * a class. A ratio makes the height come from the width, so a squeezed box needs
 * a `min-h` to stay usable, and with that floor in place a 320px row draws
 * 46.7×64 — which is exactly what a plain `h-16` draws. Both were measured. So
 * the proportion is exact at the design's own size, which is the size the design
 * specifies, and below it the box narrows at a constant height.
 *
 * The border width is on the base at 1px and only the two 2px states override
 * it, so the box never changes size when it does: a border grows inwards on a
 * `border-box` element, so 1 → 2 moves the digit by half a pixel and nothing
 * else.
 */
const base = `
  relative flex items-center justify-center overflow-hidden
  h-16 min-w-0 grow basis-14 max-w-14
  lg:h-20 lg:basis-18 lg:max-w-18
  rounded-comfortable border
  bg-background-layout-surface-variant1
  text-foreground-on-surface-default
  transition-colors
`;

/**
 * Figma's five boxes. Which one applies is decided in `useInputOTPSlot`, where
 * the precedence between them is written down; this map only says what each
 * looks like.
 *
 * Only what differs is here — every box shares the surface, the radius and the
 * 1px border from `base`, and `disabled` is the one that repaints the fill.
 */
const state = {
  empty: "border-border-neutral-subtle",
  filled: "border-border-feedback-positive",
  active: "border-2 border-border-state-active",
  invalid: "border-2 border-border-feedback-negative",
  disabled: `
    border-border-neutral-subtle
    bg-background-state-disabled
    text-foreground-state-disabled
  `,
} as const;

/**
 * Figma stacks Hover over whichever box is showing rather than replacing it, so
 * it is a second layer instead of a sixth state: `Background/State/Hover` is a
 * translucent black, and laying it over the surface is what the design draws.
 *
 * A gradient of one colour to itself, because `background-color` is already
 * taken by the surface and `background-image` paints above it — the same trick
 * the `button-base` utility uses for the same reason.
 *
 * A disabled box never gets it, and that is decided in the component rather than
 * by a `bg-none` in the variant above: `cva` emits `state` before `hovered`, and
 * `bg-none` and `bg-linear-*` are the same tailwind-merge group, so a `bg-none`
 * there is stripped by the gradient that follows it. `input-otp` already reports
 * a disabled field as not hovered, so the gate only bites where the two can
 * disagree — a story pinning `state="disabled"` on a box the pointer is over.
 *
 * **Figma's `Pressed` is deliberately not built.** It is the same kind of
 * overlay in `Background/State/Pressed`, and there is no correct way to lay it
 * over this one. `input-otp` publishes `isHovering` and no equivalent for
 * pressed, so it would have to come from the cascade — and the only element that
 * sees `:active` is the container, since it owns the one `<input>` and gives
 * everything else `pointer-events: none`. Tailwind compiles
 * `group-active/otp:` to `:is(:where(.group\/otp):active *)`, and `:where()`
 * contributes nothing, so that rule lands at exactly this class's specificity:
 * which of the two overlays paints would be decided by the order Tailwind
 * happened to emit them in. Neither a unit test nor a baseline can hold a
 * mousedown still long enough to catch it going wrong, and the state it would
 * draw lasts until the click completes — at which point the box is `active`
 * anyway, with a white border that is far louder than the overlay.
 */
const hovered =
  "bg-linear-[0deg,var(--color-background-state-hover),var(--color-background-state-hover)]";

/**
 * The caret Figma draws in the focused box, sized from the type rather than in
 * pixels: `Heading/L` is 24px on mobile and 28px on desktop, so the bar grows
 * with the digit beside it across the same 1024px step and no breakpoint is
 * written twice.
 *
 * Absolutely positioned so it contributes no width — a slot holding only a caret
 * has to be the same box as a slot holding a digit.
 */
const caretBar = `
  absolute h-(--typography-font-size-heading-l) w-0.5
  animate-caret-blink
  bg-foreground-on-surface-default
`;

const slotVariants = cva(base, {
  variants: { state, hovered: { true: hovered, false: "" } },
  defaultVariants: { state: "empty", hovered: false },
});

type InputOTPSlotProps = Omit<React.ComponentProps<"div">, "children"> &
  Omit<VariantProps<typeof slotVariants>, "hovered"> & {
    /** Which character of the code this box shows, `0`-based. */
    index: number;
    /** Overrides the name derived from the field's, for two of the same slot. */
    "data-testid"?: string;
  };

/**
 * One box of the code.
 *
 * Everything it draws comes from the field it sits in — the character, whether
 * the caret is here, whether the field is invalid or disabled — so the only prop
 * it needs is which position it holds. Render one per character, in order:
 *
 * ```tsx
 * {Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} />)}
 * ```
 *
 * `state` pins what the box draws instead of deriving it, for the sheets that
 * have to show a state the browser will not sit still in. The combined visual
 * story is the case it exists for: five of its rows are real fields, and the
 * `active` row cannot be — a box is active only while the field holds focus, and
 * a screenshot cannot hold focus. A pinned box stops following the code, so a
 * live field should let it derive.
 *
 * The box carries `data-state`, so a consumer can style or assert on which of
 * Figma's five it is drawing without reading the class list.
 *
 * @param {number} index - Which character of the code this box shows, `0`-based.
 * @param {('empty'|'filled'|'active'|'invalid'|'disabled')} [state] - Pins the
 * appearance instead of deriving it. For sheets, docs and previews; a live field
 * should let the box follow the code.
 * @param {string} [className] - Additional CSS classes for the box.
 * @param {string} [data-testid] - Overrides the name derived from the field's.
 *
 * @example
 * ```tsx
 * <InputOTP maxLength={4} name="pin">
 *   {Array.from({ length: 4 }, (_, index) => (
 *     <InputOTPSlot key={index} index={index} />
 *   ))}
 * </InputOTP>
 * ```
 */
function InputOTPSlot({
  index,
  state: stateProp,
  className,
  "data-testid": testIdOverride,
  ...props
}: InputOTPSlotProps) {
  const slot = useInputOTPSlot(index);
  const { testId } = usePartTestId(`slot-${index}`, testIdOverride);

  const resolved = stateProp ?? slot.state;
  // Gated here rather than in the variant — see the note on `hovered`.
  const isHovered = slot.hovered && resolved !== "disabled";

  return (
    <div
      data-state={resolved}
      data-testid={testId}
      className={cn(
        headingVariants({ size: "xl", weight: "semibold" }),
        slotVariants({ state: resolved, hovered: isHovered }),
        className,
      )}
      {...props}
    >
      {slot.char}
      {/* Not `aria-hidden`: it renders nothing an assistive technology could
          read in the first place, and the field's own `<input>` is what carries
          the caret position to a screen reader. */}
      {slot.caret && <span className={caretBar} />}
    </div>
  );
}

export { InputOTPSlot, slotVariants, type InputOTPSlotProps };
