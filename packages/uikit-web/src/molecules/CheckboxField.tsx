"use client";

import * as React from "react";

import { Checkbox } from "@/atoms/Checkbox";
import { Label } from "@/atoms/Label";
import { TypographyBody } from "@/atoms/Typography";
import { cn, createTestIdFor } from "@/lib/utils";

const root = "flex items-start gap-3";

const labelWrapper = "flex min-w-0 flex-1 flex-col gap-0";

// `Label` is `lineHeight: 1`, which is right for a label centred in a control
// and wrong for one that wraps to a second line next to a box. `Body/S`'s 1.46
// is what Figma draws here, and it is also what the description below uses, so
// the two lines share a rhythm.
const labelText = "block leading-[1.46]";

type CheckboxFieldProps = Omit<React.ComponentProps<typeof Checkbox>, "children"> & {
  /**
   * Required: the field has to be submittable and addressable by form state,
   * and it is what `FormCheckbox` binds react-hook-form to.
   */
  name: string;
  label?: React.ReactNode;
  /**
   * The second line under the label. There is no separate error node — the same
   * line carries both — so `error` replaces this text rather than joining it.
   */
  description?: React.ReactNode;
  /**
   * The message to show instead of `description`. Implies `invalid`, and is
   * drawn exactly like the description it replaces — the design puts the error
   * on the label and the border, not on this line. The line is a live region,
   * so a message that appears after a failed submit is announced.
   */
  error?: React.ReactNode;
  /** Figma's Error status without a message: the negative border and label. */
  invalid?: boolean;
  /**
   * Names the whole field, not just the box: the parts derive theirs from it as
   * `-checkbox`, `-label` and `-description`, so one id per field is enough to
   * reach any of them. Defaults to `name`.
   */
  "data-testid"?: string;
  /**
   * Classes for the parts inside the field. `className` styles the row that
   * holds them.
   */
  classNames?: {
    checkbox?: string;
    label?: string;
    description?: string;
  };
};

/**
 * The checkbox as the design draws it: the box beside a label, with an optional
 * second line of description or error text under it. The box itself is
 * [Checkbox](./checkbox.tsx) — every Radix prop, `checked="indeterminate"`
 * included, travels straight through.
 *
 * Wiring is handled here so the parts stay associated: the label points at the
 * box, the second line is announced through `aria-describedby`, and an error
 * sets `aria-invalid`. An `id` is generated when none is passed.
 *
 * Figma's Error status lands across both parts — a negative border on the box
 * and a negative label — so it belongs here rather than on `Checkbox`. The
 * second line stays muted throughout: an `error` message is drawn as the helper
 * text it replaces, which is the opposite of how `TextField` marks an error.
 *
 * Test ids come for free from `name`: the root carries it and every part
 * derives its own, so a field named `terms` answers to `terms` as a whole and
 * to `terms-checkbox`, `terms-label` and `terms-description` in its parts.
 * `data-testid` overrides the base.
 *
 * Everything not listed below lands on the `Checkbox`, `ref` included — see
 * [FormCheckbox](./form.tsx) for the react-hook-form version.
 *
 * @example
 * ```tsx
 * <CheckboxField
 *   name="terms"
 *   label="Accept terms and conditions"
 *   description="You can withdraw consent at any time."
 *   checked={accepted}
 *   onCheckedChange={setAccepted}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Partially selected, as a parent of a checkbox list
 * <CheckboxField
 *   name="all"
 *   label="Select all"
 *   checked={someSelected ? "indeterminate" : allSelected}
 *   onCheckedChange={toggleAll}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // The registration case: the label and border go negative, the message takes
 * // the description's place and its styling
 * <CheckboxField name="terms" label="Accept terms" error="Please accept to continue." />
 * ```
 *
 * @cssVariables
 * Typography:
 * - `--typography-font-family`
 * - `--typography-font-size-body-s`
 * - `--typography-font-weight-regular`
 *
 * Semantic colors:
 * - `--color-foreground-feedback-negative`
 * - `--color-foreground-on-page-default`
 * - `--color-foreground-on-page-muted`
 * - `--color-foreground-state-disabled`
 */
function CheckboxField({
  id: idProp,
  name,
  className,
  classNames,
  label,
  description,
  error,
  invalid,
  disabled,
  "aria-describedby": ariaDescribedBy,
  "data-testid": testId = name,
  ...props
}: CheckboxFieldProps) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;

  const testIdFor = createTestIdFor(testId);

  const message = error ?? description;
  const isInvalid = invalid || error != null;
  const messageId = `${id}-description`;
  const describedBy =
    [ariaDescribedBy, message != null ? messageId : null].filter(Boolean).join(" ") || undefined;

  const labelColor = disabled
    ? // `Label` reads this off the `group` already; naming it here keeps the
      // three-way choice in one place.
      "text-foreground-state-disabled"
    : isInvalid
      ? "text-foreground-feedback-negative"
      : "text-foreground-on-page-default";

  // The second line never recolours: Figma's Error frame leaves it on
  // `OnPage/Muted`, so an error message reads as the helper text it replaces.
  // The status is carried by the label and the border. This is where the field
  // parts ways with `TextField`, where the message line is the one that turns.
  const messageColor = disabled
    ? "text-foreground-state-disabled"
    : "text-foreground-on-page-muted";

  return (
    <div
      // `group` + `data-disabled` is how `Label` learns that its control is
      // disabled; the label is a nephew of the box rather than its sibling, so
      // the `peer-disabled` rules would never match.
      className={cn(root, "group", className)}
      data-disabled={disabled || undefined}
      data-testid={testId}
    >
      <Checkbox
        id={id}
        name={name}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        data-testid={testIdFor("checkbox")}
        className={classNames?.checkbox}
        {...props}
      />

      {(label || message != null) && (
        <div className={labelWrapper}>
          {label && (
            <Label
              htmlFor={id}
              data-testid={testIdFor("label")}
              className={cn(labelText, labelColor, classNames?.label)}
            >
              {label}
            </Label>
          )}

          {/* Mounted whether or not there is anything to say. A live region has
              to exist before its text changes to be announced, so a `<p>` that
              appears in the same commit as the error would be read by nobody.
              Empty it collapses to nothing, and the wrapper's `gap-0` means it
              costs no space either. */}
          <TypographyBody
            size="s"
            id={messageId}
            data-testid={testIdFor("description")}
            // Polite, not `alert`: the same node carries the static hint most
            // of the time, and a hint has no business interrupting anyone.
            role="status"
            className={cn(messageColor, classNames?.description)}
          >
            {message}
          </TypographyBody>
        </div>
      )}
    </div>
  );
}

export { CheckboxField, type CheckboxFieldProps };
