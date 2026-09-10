"use client";

import * as React from "react";
import { OTPInput } from "input-otp";

import { InputOTPFieldProvider } from "@/molecules/InputOTP/lib/useInputOTPSlot";
import { TestIdProvider } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * Figma's row: boxes side by side with `spacing/2` between them, and nothing
 * else. There is no wrapper, no grouping and no separator in the design — six
 * slots and five gaps, 472px at desktop and 376px at mobile.
 *
 * Those are the *maximum*, though, not the width: 376px does not fit a 375px
 * phone, let alone a 320px one. The row takes the width it is given — a `flex`
 * container is block-level, so it already fills its parent — and each slot takes
 * an equal share of it up to the design's cap. `justify-center` is what happens
 * to the slack once they are all capped: the group stays together at exactly
 * `gap-2` and sits in the middle, rather than the boxes staying left with a hole
 * at the end.
 *
 * Which means the field's own width is the layout's, not this component's. Put
 * it in the column it belongs in, or cap it — `containerClassName="max-w-118"` —
 * and the boxes size themselves from there.
 */
const container = "flex items-center justify-center gap-2";

/**
 * The real `<input>`, which `input-otp` stretches transparently across the whole
 * row so a click anywhere lands in it and the platform's own paste, autofill and
 * SMS-autocomplete keep working. It is never seen — every glyph on screen is
 * drawn by a slot — so the only thing to style is the cursor.
 */
const input = "disabled:cursor-not-allowed";

type InputOTPProps = Omit<React.ComponentProps<typeof OTPInput>, "render"> & {
  /**
   * Draws every slot in the negative border Figma's `Error=True` column shows.
   * Also sets `aria-invalid` on the input, so the field announces itself.
   */
  invalid?: boolean;
  /**
   * Names the field, and every slot under it: a field with `name="code"`
   * answers to `code`, and its slots to `code-slot-0` … `code-slot-5`.
   * Defaults to `name` — the string the form, the validator and the label are
   * already keyed on — so a named field is addressable without passing this.
   */
  "data-testid"?: string;
};

/**
 * A one-time passcode field: one box per character, filled left to right.
 *
 * The design draws six boxes and nothing between them, so that is what
 * `InputOTP` lays out — a row of [InputOTPSlot](./InputOTPSlot.tsx)s with
 * `spacing/2` between. [InputOTPGroup](./InputOTPGroup.tsx) and
 * [InputOTPSeparator](./InputOTPSeparator.tsx) are still exported for a code
 * that reads in parts (`123-456`), but the design does not use them and neither
 * should a new field without a reason.
 *
 * Every box is drawn by us; the `<input>` behind them is transparent and spans
 * the whole row. That is what keeps paste, autofill and the iOS/Android
 * one-time-code suggestion working — pass
 * `autoComplete="one-time-code"` and the platform fills the field.
 *
 * **A slot with a character in it goes green.** That is the design, not a
 * validity check: `Border/Feedback/Positive` from the first keystroke, which is
 * why the Figma sheet's `Success` state is nothing more than every slot filled.
 * A code that turns out to be wrong is `invalid`, which repaints all six.
 *
 * The boxes grow at 1024px — up to 56×64 below it, up to 72×80 at and above —
 * because Figma models `Size` as its `Mobile` and `Desktop` variable modes, the
 * same pair the type scale switches on. The digit needs no breakpoint of its own
 * for that reason: `--typography-font-size-heading-xl` is already 28px on one
 * side of 1024px and 32px on the other.
 *
 * Those are ceilings rather than widths, because taken literally they overflow a
 * phone. See the remarks below for what the field does instead, and for the two
 * cases where a caller has to say something about width.
 *
 * @param {number} maxLength - How many characters the code has. Required, and it
 * must match the number of slots rendered.
 * @param {string} [value] - The code, for a controlled field.
 * @param {(value: string) => void} [onChange] - Called with the whole code on
 * every keystroke — not with an event.
 * @param {(value: string) => void} [onComplete] - Called once the last slot is
 * filled. This is the submit hook; there is no button in the design.
 * @param {string} [pattern] - What may be typed, as a regular expression source.
 * `REGEXP_ONLY_DIGITS` is re-exported for the usual case.
 * @param {boolean} [invalid] - Draw every slot in the negative border.
 * @param {boolean} [disabled] - Disable the field. Beats `invalid` visually, the
 * way Figma's `Error=True, Disabled` nodes do.
 * @param {string} [aria-label] - The field's accessible name. The design draws no
 * label, so this is how the input gets one — or point `aria-labelledby` at the
 * heading that already names it.
 * @param {string} [aria-describedby] - Ids of the text that explains the field or
 * reports the error, so `invalid` is announced with a reason rather than as a
 * bare state.
 * @param {string} [containerClassName] - Classes for the row that holds the slots.
 * @param {string} [className] - Classes for the transparent `<input>` itself.
 * @param {string} [data-testid] - Base for the field and its slots. Defaults to `name`.
 *
 * @example
 * ```tsx
 * <InputOTP
 *   maxLength={6}
 *   name="code"
 *   aria-label="One-time code"
 *   autoComplete="one-time-code"
 *   onComplete={verify}
 * >
 *   {Array.from({ length: 6 }, (_, index) => (
 *     <InputOTPSlot key={index} index={index} />
 *   ))}
 * </InputOTP>
 * ```
 *
 * @example
 * ```tsx
 * // Controlled, digits only, and repainted when the server rejects the code.
 * const [code, setCode] = useState("");
 *
 * <InputOTP
 *   maxLength={6}
 *   name="code"
 *   aria-label="One-time code"
 *   value={code}
 *   onChange={setCode}
 *   pattern={REGEXP_ONLY_DIGITS}
 *   invalid={rejected}
 * >
 *   {Array.from({ length: 6 }, (_, index) => (
 *     <InputOTPSlot key={index} index={index} />
 *   ))}
 * </InputOTP>
 * ```
 *
 * @example
 * ```tsx
 * // Split into two groups of three, for a code that is read aloud as "123-456".
 * <InputOTP maxLength={6} name="code" aria-label="One-time code">
 *   <InputOTPGroup>
 *     <InputOTPSlot index={0} />
 *     <InputOTPSlot index={1} />
 *     <InputOTPSlot index={2} />
 *   </InputOTPGroup>
 *   <InputOTPSeparator />
 *   <InputOTPGroup>
 *     <InputOTPSlot index={3} />
 *     <InputOTPSlot index={4} />
 *     <InputOTPSlot index={5} />
 *   </InputOTPGroup>
 * </InputOTP>
 * ```
 *
 * @remarks
 * **The field draws no label, so one has to be passed in.** Figma's node is six
 * boxes and nothing else — there is no visible label for a `<Label htmlFor>` to
 * point at, and `name` is not an accessible name: without `aria-label` (or
 * `aria-labelledby`, when a heading above the field already says what the code
 * is) a screen reader announces an unnamed textbox. The error message is linked
 * the same way, which is what turns `invalid` from a colour into something spoken:
 *
 * ```tsx
 * <InputOTP name="code" aria-label="One-time code" invalid aria-describedby="code-error">
 *   …
 * </InputOTP>
 * <TypographyBody id="code-error" size="s">That code is not right.</TypographyBody>
 * ```
 *
 * **The field takes the width it is given, and the boxes size themselves from
 * it.** Figma's 56×64 and 72×80 are the *maximum* a box is drawn at, not its
 * width — six mobile boxes and five gaps come to 376px, which does not fit a
 * 375px phone and is 60px too wide for a 320px one. So each box is an equal
 * share of the row, capped at the design's number and holding the design's
 * proportion (7/8 mobile, 9/10 desktop), which reproduces Figma exactly at full
 * width and shrinks evenly below it.
 *
 * A `flex` container is block-level, so the row already fills its parent and
 * there is nothing to pass. Two things follow:
 *
 * - **Cap it where the layout wants** — `containerClassName="max-w-118"` holds
 *   the field at its desktop size in a column wider than that, rather than
 *   leaving the boxes capped with slack around them.
 * - **Give it a real width in a parent that sizes itself to its content.** This
 *   is a known limitation rather than a preference: in an `inline-block`, an
 *   `inline-flex`, a `w-fit` ancestor or Storybook's `layout: "centered"`, the
 *   row measures at roughly 52px — the boxes contribute their borders and
 *   nothing else — and the field renders as a row of slivers. `flex-basis` does
 *   not prevent it and neither does dropping `aspect-ratio`; both were tried and
 *   measured. Any definite width on an ancestor avoids it, which is why the
 *   stories set `layout: "padded"`. Not yet diagnosed.
 *
 * A code longer than six still needs thought: ten boxes in 320px is 20px each,
 * and no ratio saves that. Wrap the row (`containerClassName="flex-wrap"`) or
 * give it its own scroll.
 *
 * @cssVariables
 * Typography:
 * - `--typography-font-family`
 * - `--typography-font-size-heading-l`
 * - `--typography-font-size-heading-xl`
 * - `--typography-font-weight-semibold`
 *
 * Radius and motion:
 * - `--radius-comfortable`
 * - `--animate-caret-blink`
 *
 * Semantic colors:
 * - `--color-background-layout-surface-variant1`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-border-feedback-negative`
 * - `--color-border-feedback-positive`
 * - `--color-border-neutral-subtle`
 * - `--color-border-state-active`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-on-surface-muted`
 * - `--color-foreground-state-disabled`
 *
 * @see [Reference](https://input-otp.rodz.dev)
 * @see [Documentation](https://ui.shadcn.com/docs/components/input-otp)
 */
function InputOTP({
  className,
  containerClassName,
  invalid,
  disabled,
  "aria-invalid": ariaInvalid,
  "data-testid": testIdProp,
  children,
  ...props
}: InputOTPProps) {
  // Either spelling turns the field red, so a form that already sets
  // `aria-invalid` from its validation state gets the styling without a second
  // prop, and `invalid` on its own is announced without one either.
  const isInvalid =
    invalid || (ariaInvalid !== undefined && ariaInvalid !== "false" && !!ariaInvalid);

  // The base is `name` unless overridden — the rule every control that submits a
  // value follows here. Destructured rather than left in `...props` because what
  // is emitted is not what was passed.
  const testId = testIdProp ?? props.name;

  // What is emitted is not what decides the colour. `aria-invalid` carries error
  // *types* as well as a truth value — `"grammar"`, `"spelling"` — and an explicit
  // `"false"` is a form saying the field is fine, so whatever the caller passed
  // goes through untouched. `invalid` only fills the attribute in when they left
  // it alone.
  const ariaInvalidAttr = ariaInvalid ?? (invalid || undefined);

  const field = { invalid: !!isInvalid, disabled: !!disabled };

  return (
    <OTPInput
      containerClassName={cn(container, containerClassName)}
      className={cn(input, className)}
      disabled={disabled}
      aria-invalid={ariaInvalidAttr}
      data-testid={testId}
      {...props}
    >
      <InputOTPFieldProvider value={field}>
        <TestIdProvider value={testId}>{children}</TestIdProvider>
      </InputOTPFieldProvider>
    </OTPInput>
  );
}

export { InputOTP, type InputOTPProps };
