"use client";

import * as React from "react";

import { Label } from "@/atoms/Label";
import { Switch } from "@/atoms/Switch";
import { TypographyBody, bodyVariants } from "@/atoms/Typography";
import { cn, createTestIdFor } from "@/lib/utils";

const root = "flex items-start gap-2";

const labelWrapper = "flex min-w-0 flex-1 flex-col gap-0";

/**
 * Figma wraps the label in a 24px-tall row with 2px of top padding, which is
 * what lines its first line up with the middle of the 24px track. The padding
 * is on the row rather than the text so a label that wraps keeps its rhythm
 * with the description below it.
 */
const labelRow = "flex min-h-6 w-full items-start pt-0.5";

/**
 * The label is `Body/Medium/Medium` here, not the `Label` family — Figma draws
 * body type beside a switch, and body's 1.46 line height is what lets a label
 * wrap to a second line next to the track. Taken from `bodyVariants` rather
 * than respelled so it cannot drift from the scale; `block` undoes `Label`'s
 * own flex row, which would otherwise stop the text wrapping.
 */
const labelText = cn(bodyVariants({ size: "m", weight: "medium" }), "block");

type SwitchFieldProps = Omit<React.ComponentProps<typeof Switch>, "children"> & {
  /**
   * Required: the field has to be submittable and addressable by form state,
   * and it is what `FormSwitch` binds react-hook-form to.
   */
  name: string;
  label?: React.ReactNode;
  /**
   * The second line under the label. There is no separate error node — the same
   * line carries both — so `error` replaces this text rather than joining it.
   */
  description?: React.ReactNode;
  /**
   * The message to show instead of `description`. Implies `invalid`. The line is
   * a live region, so a message that appears after a failed submit is announced.
   */
  error?: React.ReactNode;
  /** Marks the field invalid without a message. */
  invalid?: boolean;
  /**
   * Names the whole field, not just the track: the parts derive theirs from it
   * as `-switch`, `-label` and `-description`, so one id per field is enough to
   * reach any of them. Defaults to `name`.
   */
  "data-testid"?: string;
  /**
   * Classes for the parts inside the field. `className` styles the row that
   * holds them.
   */
  classNames?: {
    switch?: string;
    label?: string;
    description?: string;
  };
};

/**
 * The switch as the design draws it: the 44×24 track beside a label, with an
 * optional second line of description or error text under it. The track itself
 * is [Switch](../atoms/Switch.tsx) — every Radix prop travels straight through.
 *
 * Wiring is handled here so the parts stay associated: the label points at the
 * track, the second line is announced through `aria-describedby`, and an error
 * sets `aria-invalid`. An `id` is generated when none is passed.
 *
 * Test ids come for free from `name`: the root carries it and every part derives
 * its own, so a field named `marketing` answers to `marketing` as a whole and to
 * `marketing-switch`, `marketing-label` and `marketing-description` in its
 * parts. `data-testid` overrides the base.
 *
 * **On the error status.** Figma models the switch as Selected × State only —
 * there is no Error cell, unlike Checkbox. The invalid styling here is borrowed
 * from [CheckboxField](./checkboxField.tsx): the label turns negative, the
 * message takes the description's place, and the track is left alone. It is a
 * placeholder for a design decision, not something the board specifies.
 *
 * Everything not listed below lands on the `Switch`, `ref` included — see
 * `FormSwitch` for the react-hook-form version.
 *
 * @example
 * ```tsx
 * <SwitchField
 *   name="marketing"
 *   label="Marketing emails"
 *   description="Occasional offers and product news."
 *   checked={subscribed}
 *   onCheckedChange={setSubscribed}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Disabled: both lines and the track go to the disabled tokens
 * <SwitchField name="beta" label="Beta features" description="Not available on your plan." disabled />
 * ```
 *
 * @cssVariables
 * Typography:
 * - `--typography-font-family`
 * - `--typography-font-size-body-m`
 * - `--typography-font-size-body-s`
 * - `--typography-font-weight-medium`
 * - `--typography-font-weight-regular`
 *
 * Semantic colors:
 * - `--color-foreground-feedback-negative`
 * - `--color-foreground-on-page-default`
 * - `--color-foreground-on-page-muted`
 * - `--color-foreground-state-disabled`
 */
function SwitchField({
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
}: SwitchFieldProps) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;

  const testIdFor = createTestIdFor(testId);

  const message = error ?? description;
  const isInvalid = invalid || error != null;
  const messageId = `${id}-description`;
  const describedBy =
    [ariaDescribedBy, message != null ? messageId : null].filter(Boolean).join(" ") || undefined;

  const labelColor = disabled
    ? "text-foreground-state-disabled"
    : isInvalid
      ? "text-foreground-feedback-negative"
      : "text-foreground-on-page-default";

  const messageColor = disabled
    ? "text-foreground-state-disabled"
    : "text-foreground-on-page-muted";

  return (
    <div
      className={cn(root, "group", className)}
      data-disabled={disabled || undefined}
      data-testid={testId}
    >
      <Switch
        id={id}
        name={name}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        data-testid={testIdFor("switch")}
        className={classNames?.switch}
        {...props}
      />

      {(label || message != null) && (
        <div className={labelWrapper}>
          {label && (
            <div className={labelRow}>
              <Label
                htmlFor={id}
                data-testid={testIdFor("label")}
                className={cn(labelText, labelColor, classNames?.label)}
              >
                {label}
              </Label>
            </div>
          )}
          <TypographyBody
            size="s"
            id={messageId}
            data-testid={testIdFor("description")}
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

export { SwitchField, type SwitchFieldProps };
