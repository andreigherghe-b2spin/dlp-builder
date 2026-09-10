"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Check, X } from "lucide-react";

import { buttonVariants } from "@/atoms/Button";
import { Input } from "@/atoms/Input";
import { Label } from "@/atoms/Label";
import { TypographyBody } from "@/atoms/Typography";
import { cn, createTestIdFor, fieldActionLink, fieldLabelRow } from "@/lib/utils";

const root = "w-full";

/**
 * `vertical` stacks label row, box and description with Figma's
 * `spacing/space-4`.
 *
 * `horizontal` puts the label beside the box instead, as the Dialog form draws
 * it (node 476:3896). It is a grid rather than a flex row so the description can
 * start under the box instead of under the label, and so the label column has a
 * width of its own: a flex row would size each label to its own text and no two
 * fields in a form would line up. That width is a variable, so a form sets it
 * once on any ancestor — `[--textfield-label-width:7rem]` — rather than every
 * field agreeing on the same number.
 */
const layout = {
  vertical: "flex flex-col gap-1",
  horizontal: `
    grid items-center gap-x-4 gap-y-1
    grid-cols-[var(--textfield-label-width,5rem)_1fr]
  `,
} as const;

// The row itself is shared with `TextareaField` — the two fields draw the
// identical one, so it lives in `lib/utils.ts` and only the horizontal variant's
// alignment is added here.
const labelRow = {
  vertical: fieldLabelRow,
  // Right-aligned against the box, which is what puts the two of them on one
  // reading line.
  horizontal: `${fieldLabelRow} justify-end text-right`,
} as const;

const labelText = {
  // Takes the row so the action is pushed to the far edge, above the box.
  vertical: "flex-1",
  // Sized to its own text, so the action sits next to the label rather than
  // across a column it has to share.
  horizontal: "min-w-0",
} as const;

type TextFieldProps = Omit<React.ComponentProps<typeof Input>, "children"> & {
  /**
   * Required: the field has to be submittable and addressable by form state,
   * and it is what `FormTextField` binds react-hook-form to.
   */
  name: string;
  label?: React.ReactNode;
  /**
   * Where the label sits. `vertical` puts it above the box; `horizontal` puts it
   * beside it, right-aligned in a column of its own, with the helper or error
   * line under the box rather than under the label.
   *
   * The column is `--textfield-label-width` (`5rem` by default), read off the
   * field, so a form with longer labels widens all of them at once by setting it
   * on a shared ancestor.
   */
  orientation?: "vertical" | "horizontal";
  /**
   * Helper text under the field. Figma has no separate error node — the same
   * line recolours — so `error` replaces this text rather than joining it.
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
   * The designed validation glyph, drawn against the field's trailing edge
   * after any `endAdornment`. Figma models this as its own toggle, so an
   * invalid field does not grow one implicitly.
   */
  validation?: "positive" | "negative";
  /**
   * Names the whole field, not just the box: the parts derive theirs from it as
   * `-label`, `-action`, `-input` and `-description`, so one id per field is
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
    /** The field as a whole — its width lives here. */
    field?: string;
    /** The `<input>` box inside it. */
    input?: string;
    /** The helper or error line — the same node either way. */
    description?: string;
  };
};

/**
 * A text field with everything the design puts around the box: a label, an
 * optional action link and one line of helper or error text below it. The box
 * itself, adornments included, is [Input](./input.tsx) — `startAdornment` and
 * `endAdornment` travel straight through, and `validation` joins whatever the
 * trailing side already carries.
 *
 * `orientation` picks between the label above the box and the label beside it,
 * the latter being the row the Dialog form is built from.
 *
 * Wiring is handled here so the parts stay associated: the label points at the
 * field, the helper line is announced through `aria-describedby`, and an error
 * sets `aria-invalid`. An `id` is generated when none is passed.
 *
 * Test ids come for free from `name`: the root carries it and every part
 * derives its own, so a field named `email` answers to `email` as a whole and
 * to `email-input`, `email-label`, `email-action` and `email-description` in
 * its parts. `data-testid` overrides the base.
 *
 * Everything not listed below lands on the `<input>`, `ref` included, so it
 * takes `register` or a `Controller` field directly — see
 * [FormTextField](./form.tsx) for the bound version. It also survives
 * `FormControl`, which clones `id`, `aria-invalid` and `aria-describedby` onto
 * its child: an incoming `aria-describedby` is merged with this component's own
 * helper id rather than replacing it.
 *
 * @example
 * ```tsx
 * <TextField
 *   label="Email"
 *   action={<a href="/support">Need help?</a>}
 *   startAdornment={<Mail />}
 *   endAdornment={
 *     <Button variant="ghost" icon onClick={toggle} aria-label="Show password">
 *       <Eye />
 *     </Button>
 *   }
 *   validation="positive"
 *   description="We'll only use this to sign you in."
 *   placeholder="name@example.com"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // A dialog form: labels beside the boxes, one column width for all of them.
 * <div className="flex flex-col gap-4 [--textfield-label-width:7rem]">
 *   <TextField orientation="horizontal" name="name" label="Name" placeholder="Placeholder" />
 *   <TextField orientation="horizontal" name="username" label="Username" placeholder="Placeholder" />
 * </div>
 * ```
 *
 * @cssVariables
 * Layout:
 * - `--textfield-label-width` — the label column in `horizontal`, `5rem` by default
 *
 * Typography:
 * - `--typography-font-family`
 * - `--typography-font-size-body-s`
 * - `--typography-font-size-label-m`
 * - `--typography-font-weight-medium`
 * - `--typography-font-weight-regular`
 *
 * Semantic colors:
 * - `--color-foreground-feedback-negative`
 * - `--color-foreground-feedback-positive`
 * - `--color-foreground-on-page-default`
 * - `--color-foreground-on-page-muted`
 * - `--color-foreground-state-disabled`
 */
function TextField({
  id: idProp,
  name,
  className,
  classNames,
  label,
  orientation = "vertical",
  description,
  error,
  invalid,
  action,
  startAdornment,
  endAdornment,
  validation,
  disabled,
  "aria-describedby": ariaDescribedBy,
  "data-testid": testId = name,
  ...props
}: TextFieldProps) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;

  const testIdFor = createTestIdFor(testId);

  const message = error ?? description;
  const isInvalid = invalid || error != null;
  const messageId = `${id}-description`;
  const describedBy =
    [ariaDescribedBy, message != null ? messageId : null].filter(Boolean).join(" ") || undefined;

  const ValidationIcon = validation === "positive" ? Check : validation === "negative" ? X : null;

  const messageColor = disabled
    ? "text-foreground-state-disabled"
    : isInvalid
      ? "text-foreground-feedback-negative"
      : "text-foreground-on-page-muted";

  // Horizontal renders the cell even when it is empty, so the box stays in the
  // second column and a form of fields keeps its left edge. Truthiness, not a
  // null check, to match the `{label && …}` guards on the parts inside it: a
  // `label={isEditing && "Email"}` that resolves to `false` should not open a
  // row that then renders nothing.
  const showsLabelRow = !!label || !!action || orientation === "horizontal";

  return (
    <div
      // `group` + `data-disabled` is how `Label` already learns that its
      // control is disabled; the label is not a DOM sibling of the input here,
      // so its `peer-disabled` rules would never match.
      className={cn(root, layout[orientation], "group", className)}
      data-orientation={orientation}
      data-disabled={disabled || undefined}
      data-testid={testId}
    >
      {showsLabelRow && (
        <div className={labelRow[orientation]}>
          {label && (
            <Label
              htmlFor={id}
              data-testid={testIdFor("label")}
              className={cn(labelText[orientation], classNames?.label)}
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

      <Input
        id={id}
        name={name}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        data-testid={testIdFor("input")}
        className={classNames?.field}
        inputClassName={classNames?.input}
        startAdornment={startAdornment}
        endAdornment={
          // The row reads left to right, so appending puts validation against
          // the edge, which is the order Figma draws.
          <>
            {endAdornment}
            {ValidationIcon && (
              <span
                // Figma keeps this glyph on its feedback colour even in
                // Disabled, so it carries its own rather than inheriting.
                className={
                  validation === "negative"
                    ? "text-foreground-feedback-negative"
                    : "text-foreground-feedback-positive"
                }
              >
                <ValidationIcon aria-hidden />
              </span>
            )}
          </>
        }
        {...props}
      />

      {message != null && (
        <TypographyBody
          size="s"
          id={messageId}
          data-testid={testIdFor("description")}
          // An error appearing mid-edit is news; a static hint is not.
          role={error != null ? "alert" : undefined}
          className={cn(
            messageColor,
            // Under the box, not under the label: the message belongs to what
            // the user typed.
            orientation === "horizontal" && "col-start-2",
            classNames?.description,
          )}
        >
          {message}
        </TypographyBody>
      )}
    </div>
  );
}

export { TextField, type TextFieldProps };
