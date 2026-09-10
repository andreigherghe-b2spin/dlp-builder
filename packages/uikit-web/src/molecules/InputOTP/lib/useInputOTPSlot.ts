"use client";

import * as React from "react";
import { OTPInputContext } from "input-otp";

/**
 * What the field as a whole knows and a single slot cannot work out for itself.
 *
 * `input-otp` publishes the per-slot facts — the character, whether this is the
 * one the caret is in — but nothing about the field's validity or its disabled
 * state, because those are ours rather than the library's. A slot is written by
 * the consumer as a sibling of the others, so there is no prop chain from the
 * root to thread them down; the root publishes them here and each slot reads
 * them, the same shape `Dialog` and `Select` use for their test ids.
 *
 * The defaults are what a slot rendered outside an `InputOTP` gets. It will
 * still draw — `OTPInputContext` has its own default too — which is what keeps a
 * misplaced slot a visual bug rather than a crash.
 */
type InputOTPFieldState = {
  invalid: boolean;
  disabled: boolean;
};

const InputOTPFieldContext = React.createContext<InputOTPFieldState>({
  invalid: false,
  disabled: false,
});

/** Publishes the field's own state to the slots the consumer composed. */
const InputOTPFieldProvider = InputOTPFieldContext.Provider;

/**
 * The five boxes Figma draws for a slot, in the order they win.
 *
 * The design has them as four independent axes — `Variant` (Empty / Filled),
 * `State` (Default / Hover / Pressed / Focus / Disabled) and `Error` — which
 * multiplies out to a matrix of 40 nodes with one appearance each. Read down the
 * matrix and the precedence is unambiguous, so it is expressed here as an
 * ordered choice rather than as four props that can contradict each other:
 *
 * - **Disabled** beats everything, error included. The `Error=True, Disabled`
 *   nodes drop the red border entirely — a field nobody can edit is not asking
 *   to be corrected.
 * - **Invalid** beats focus. `Error=True, Focus` keeps the negative border and
 *   still draws the caret, so the box says "wrong" while the caret says "here".
 * - **Active** beats filled. `Filled, Focus` is the white border, not the
 *   positive one.
 * - **Filled** is the positive border. That is the design's, not an
 *   interpretation: a slot with a digit in it is drawn `Border/Feedback/Positive`
 *   from the first keystroke, which is why the sheet's `Success` example is
 *   nothing more than every slot filled.
 *
 * Hover is deliberately *not* in this list — see `hovered` below.
 */
type InputOTPSlotState = "disabled" | "invalid" | "active" | "filled" | "empty";

type InputOTPSlot = {
  /** The character in this slot, or the placeholder when the field is empty. */
  char: string | null;
  /** Which of Figma's five boxes to draw. */
  state: InputOTPSlotState;
  /**
   * Whether to lay the hover overlay over that box.
   *
   * Separate from `state` because Figma stacks it rather than replacing:
   * `Filled, Hover` is the positive border *and* the overlay. And it is the
   * whole field's, not this slot's — there is one `<input>` spanning every box,
   * so a pointer is over the field or it is not, and every slot answers the
   * same. `input-otp` already suppresses it while disabled.
   */
  hovered: boolean;
  /** Whether this slot draws the blinking caret. */
  caret: boolean;
};

/**
 * Everything one slot needs to draw itself, from the library's context and the
 * field's.
 *
 * @param {number} index - The slot's position in the code, `0`-based.
 * @returns {InputOTPSlot}
 */
function useInputOTPSlot(index: number): InputOTPSlot {
  const { slots, isHovering } = React.useContext(OTPInputContext);
  const { invalid, disabled } = React.useContext(InputOTPFieldContext);

  // `?? {}` rather than an assertion: a slot with an `index` past `maxLength`
  // is a real mistake a consumer can make — six `<InputOTPSlot>`s under a
  // `maxLength={4}` — and it should render an empty box, not throw.
  const { char, placeholderChar, isActive, hasFakeCaret } = slots?.[index] ?? {};

  const state: InputOTPSlotState = disabled
    ? "disabled"
    : invalid
      ? "invalid"
      : isActive
        ? "active"
        : char != null
          ? "filled"
          : "empty";

  return {
    // The placeholder only ever arrives for a field that is entirely empty —
    // `input-otp` drops it the moment anything is typed — so the two can share
    // the slot without either needing to know about the other.
    char: char ?? placeholderChar ?? null,
    state,
    hovered: !!isHovering,
    caret: !!hasFakeCaret,
  };
}

export {
  InputOTPFieldProvider,
  useInputOTPSlot,
  type InputOTPFieldState,
  type InputOTPSlot,
  type InputOTPSlotState,
};
