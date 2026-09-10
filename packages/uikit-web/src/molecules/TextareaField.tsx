"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { buttonVariants } from "@/atoms/Button";
import { Label } from "@/atoms/Label";
import { Textarea } from "@/atoms/Textarea";
import { TypographyBody } from "@/atoms/Typography";
import { cn, createTestIdFor, fieldActionLink, fieldLabelRow } from "@/lib/utils";

/**
 * Label row, box and description stacked with Figma's `spacing/1` (node
 * 3176:5930). There is no horizontal orientation here, unlike
 * [TextField](./TextField.tsx): the design draws none for a multi-line box, and
 * a label beside a box whose height the consumer sets has no one right vertical
 * alignment to guess at.
 *
 * The label row and its action link are the ones `TextField` draws, shared from
 * `lib/utils.ts` rather than restated — the two fields sit in the same form and
 * have to move together when the design does.
 */
const root = "w-full flex flex-col gap-1";

type TextareaFieldProps = Omit<React.ComponentProps<typeof Textarea>, "children"> & {
  /**
   * Required: the field has to be submittable and addressable by form state,
   * and it is what `FormTextareaField` binds react-hook-form to.
   */
  name: string;
  label?: React.ReactNode;
  /**
   * Helper text under the box. Figma has no separate error node — the same line
   * recolours — so `error` replaces this text rather than joining it.
   */
  description?: React.ReactNode;
  /** The message to show instead of `description`. Implies `invalid`. */
  error?: React.ReactNode;
  /** Force the error styling without supplying a message. */
  invalid?: boolean;
  /**
   * The Figma "Link" in the label row. Pass the element that should carry the
   * destination — an `<a>`, or a router's `Link` — and the field styles it;
   * anything that takes a `className` works.
   */
  action?: React.ReactNode;
  /**
   * Names the whole field, not just the box: the parts derive theirs from it as
   * `-label`, `-action`, `-textarea` and `-description`, so one id per field is
   * enough to reach any of them. Defaults to `name`, which is already unique
   * within a form — pass this only to override it.
   */
  "data-testid"?: string;
  /**
   * Classes for the parts inside the field. `className` styles the column that
   * holds them.
   */
  classNames?: {
    label?: string;
    action?: string;
    /** The `<textarea>` box — its height and width live here. */
    textarea?: string;
    /** The helper or error line — the same node either way. */
    description?: string;
  };
};

/**
 * A multi-line field with everything the design puts around the box: a label, an
 * optional action link and one line of helper or error text below it. The box
 * itself is [Textarea](../atoms/Textarea.tsx).
 *
 * Wiring is handled here so the parts stay associated: the label points at the
 * box, the helper line is announced through `aria-describedby`, and an error
 * sets `aria-invalid`. An `id` is generated when none is passed.
 *
 * Test ids come for free from `name`: the root carries it and every part derives
 * its own, so a field named `message` answers to `message` as a whole and to
 * `message-textarea`, `message-label`, `message-action` and
 * `message-description` in its parts. `data-testid` overrides the base.
 *
 * Everything not listed below lands on the `<textarea>`, `ref` included, so it
 * takes `register` or a `Controller` field directly — see
 * [FormTextareaField](../organisms/Form/ui/FormTextareaField.tsx) for the bound
 * version. It also survives `FormControl`, which clones `id`, `aria-invalid` and
 * `aria-describedby` onto its child: an incoming `aria-describedby` is merged
 * with this component's own helper id rather than replacing it.
 *
 * @param {string} [className] - Additional CSS classes for the column
 * @param {object} [classNames] - Classes for the label, action, box and message
 *
 * @example
 * ```tsx
 * <TextareaField
 *   name="message"
 *   label="Your message"
 *   action={<a href="/support">Need help?</a>}
 *   placeholder="Type your message here."
 *   description="We usually reply within a day."
 *   rows={5}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Invalid: the same line carries the message and recolours.
 * <TextareaField
 *   name="bio"
 *   label="Bio"
 *   defaultValue="…"
 *   error="Keep it under 200 characters."
 * />
 * ```
 *
 * @cssVariables
 * Typography:
 * - `--typography-font-family`
 * - `--typography-font-size-body-s`
 * - `--typography-font-size-label-m`
 * - `--typography-font-weight-medium`
 * - `--typography-font-weight-regular`
 *
 * Semantic colors:
 * - `--color-foreground-feedback-negative`
 * - `--color-foreground-on-page-default`
 * - `--color-foreground-on-page-muted`
 * - `--color-foreground-state-disabled`
 */
function TextareaField({
  id: idProp,
  name,
  className,
  classNames,
  label,
  description,
  error,
  invalid,
  action,
  disabled,
  "aria-describedby": ariaDescribedBy,
  "data-testid": testId = name,
  ...props
}: TextareaFieldProps) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;

  const testIdFor = createTestIdFor(testId);

  const message = error ?? description;
  const isInvalid = invalid || error != null;
  const messageId = `${id}-description`;
  const describedBy =
    [ariaDescribedBy, message != null ? messageId : null].filter(Boolean).join(" ") || undefined;

  const messageColor = disabled
    ? "text-foreground-state-disabled"
    : isInvalid
      ? "text-foreground-feedback-negative"
      : "text-foreground-on-page-muted";

  // Truthiness, not a null check, to match the `{label && …}` guards on the
  // parts inside it: a `label={isEditing && "Bio"}` that resolves to `false`
  // should not open a row that then renders nothing.
  const showsLabelRow = !!label || !!action;

  return (
    <div
      // `group` + `data-disabled` is how `Label` already learns that its control
      // is disabled; the label is not a DOM sibling of the box here, so its
      // `peer-disabled` rules would never match.
      className={cn(root, "group", className)}
      data-disabled={disabled || undefined}
      data-testid={testId}
    >
      {showsLabelRow && (
        <div className={fieldLabelRow}>
          {label && (
            <Label
              htmlFor={id}
              data-testid={testIdFor("label")}
              className={cn("flex-1", classNames?.label)}
            >
              {label}
            </Label>
          )}

          {action && (
            // `Slot` dresses whatever was passed rather than wrapping it, so a
            // bare `<a>` and a router's `Link` both land as the designed link
            // and keep their own `href`, `onClick` and `target`.
            <Slot
              data-testid={testIdFor("action")}
              aria-disabled={disabled || undefined}
              tabIndex={disabled ? -1 : undefined}
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                fieldActionLink,
                classNames?.action,
              )}
            >
              {action}
            </Slot>
          )}
        </div>
      )}

      <Textarea
        id={id}
        name={name}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        data-testid={testIdFor("textarea")}
        className={classNames?.textarea}
        {...props}
      />

      {message != null && (
        <TypographyBody
          size="s"
          id={messageId}
          data-testid={testIdFor("description")}
          // An error appearing mid-edit is news; a static hint is not.
          role={error != null ? "alert" : undefined}
          className={cn(messageColor, classNames?.description)}
        >
          {message}
        </TypographyBody>
      )}
    </div>
  );
}

export { TextareaField, type TextareaFieldProps };
