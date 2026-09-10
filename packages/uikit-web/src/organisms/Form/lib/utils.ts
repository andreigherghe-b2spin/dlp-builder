import type { ControllerFieldState } from "react-hook-form";

/**
 * `||` rather than `??`, deliberately: a rule written as `required: true`
 * instead of `required: 'message'` fails with an *empty* message, which is not a
 * message. Passing it on would replace the field's helper text with an empty
 * `role="alert"`. The invalid state travels through `invalid` instead, so a rule
 * without a message still recolours the field.
 */
function errorMessage(fieldState: ControllerFieldState) {
  return fieldState.error?.message || undefined;
}

/**
 * `test` on a sticky or global expression advances `lastIndex`, so the same rule
 * would accept and reject the same value on alternate keystrokes. Rebuilt
 * without those two flags, and `null` when there is no rule to apply.
 */
function acceptMatcher(allow: RegExp | undefined) {
  return allow ? new RegExp(allow.source, allow.flags.replace(/[gy]/g, "")) : null;
}

/**
 * Which validation glyph the field should draw. An explicit `validation` always
 * wins, so a field can be forced either way; otherwise the glyph follows the
 * field state, but only once the field has been touched — a form should not
 * open covered in crosses.
 */
function validationFor({
  validation,
  showValidation,
  fieldState,
}: {
  validation?: "positive" | "negative";
  showValidation?: boolean;
  fieldState: ControllerFieldState;
}) {
  if (validation != null) {
    return validation;
  }

  if (!showValidation || !fieldState.isTouched) {
    return undefined;
  }

  return fieldState.invalid ? "negative" : "positive";
}

export { acceptMatcher, errorMessage, validationFor };
