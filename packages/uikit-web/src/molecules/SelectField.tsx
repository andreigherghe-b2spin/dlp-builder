"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Check, X } from "lucide-react";

import { buttonVariants } from "@/atoms/Button";
import { Label } from "@/atoms/Label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/atoms/Select";
import { TypographyBody } from "@/atoms/Typography";
import { cn, createTestIdFor } from "@/lib/utils";

const root = "w-full";

/**
 * The same two arrangements [TextField](./textField.tsx) offers, for the same
 * reason: `horizontal` is a grid rather than a flex row so the helper line can
 * start under the box instead of under the label, and so the label column has a
 * width of its own that a form sets once on an ancestor —
 * `[--selectfield-label-width:7rem]` — rather than every field agreeing on a
 * number.
 */
const layout = {
  vertical: "flex flex-col gap-1",
  horizontal: `
    grid items-center gap-x-4 gap-y-1
    grid-cols-[var(--selectfield-label-width,5rem)_1fr]
  `,
} as const;

const labelRow = {
  vertical: "flex min-h-4 items-center gap-2",
  horizontal: "flex min-h-4 items-center justify-end gap-2 text-right",
} as const;

const labelText = {
  vertical: "flex-1",
  horizontal: "min-w-0",
} as const;

const actionLink = `
  h-4 min-w-0 px-1
  group-data-[disabled=true]:pointer-events-none
  group-data-[disabled=true]:text-foreground-state-disabled
`;

type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

type SelectOptionGroup = {
  label: React.ReactNode;
  options: readonly SelectOption[];
};

type SelectFieldProps = Omit<React.ComponentProps<typeof Select>, "children"> & {
  /**
   * Required: the field has to be submittable and addressable by form state,
   * and it is what `FormSelectField` binds react-hook-form to.
   */
  name: string;
  /**
   * The choices. An entry with its own `options` becomes a captioned group, so
   * a flat list and a grouped one are the same prop rather than two.
   */
  options: readonly (SelectOption | SelectOptionGroup)[];
  /** Shown in the box until something is chosen. */
  placeholder?: string;
  label?: React.ReactNode;
  /**
   * Where the label sits. `vertical` puts it above the box; `horizontal` puts it
   * beside it, right-aligned in a column of `--selectfield-label-width` (`5rem`
   * by default), with the helper or error line under the box.
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
   * destination — an `<a>`, or a router's `Link` — and the field styles it.
   */
  action?: React.ReactNode;
  /** An icon at the leading edge of the box, inside it. */
  startAdornment?: React.ReactNode;
  /**
   * The designed validation glyph, drawn between the value and the chevron.
   * Figma models this as its own toggle, so an invalid field does not grow one
   * implicitly.
   */
  validation?: "positive" | "negative";
  id?: string;
  className?: string;
  /** Lands on the trigger — the focusable element, which is what RHF wants. */
  ref?: React.Ref<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  "aria-describedby"?: string;
  /**
   * Names the whole field, not just the box: the parts derive theirs from it as
   * `-label`, `-action`, `-trigger` and `-description`. Defaults to `name`.
   */
  "data-testid"?: string;
  /**
   * Classes for the parts inside the field. `className` styles the column that
   * holds them, and is where width belongs.
   */
  classNames?: {
    label?: string;
    action?: string;
    /** The box itself. */
    trigger?: string;
    /** The dropdown panel. */
    content?: string;
    /** The helper or error line — the same node either way. */
    description?: string;
  };
};

function isGroup(entry: SelectOption | SelectOptionGroup): entry is SelectOptionGroup {
  return "options" in entry;
}

/**
 * A select with everything the design puts around the box: a label row with an
 * optional action link, the box itself, and one line of helper or error text
 * below it. The box and the menu are [Select](./select.tsx) — this composes it,
 * exactly as [TextField](./textField.tsx) composes `Input`.
 *
 * Choices come from `options` rather than children, so a field stays one line in
 * a form. An entry carrying its own `options` renders as a captioned group.
 * Reach for the bare `Select` when an item needs custom content.
 *
 * Wiring is handled here so the parts stay associated: the label points at the
 * trigger, the helper line is announced through `aria-describedby`, and an error
 * sets `aria-invalid`. An `id` is generated when none is passed.
 *
 * Test ids come for free from `name`: a field named `country` answers to
 * `country` as a whole and to `country-trigger`, `country-label`,
 * `country-action` and `country-description` in its parts.
 *
 * `ref` lands on the trigger — the focusable element — so react-hook-form can
 * focus the field on a failed submit. See
 * [FormSelectField](./form/index.tsx) for the bound version. An incoming
 * `aria-describedby` is merged with this component's own helper id rather than
 * replacing it, so it survives `FormControl`.
 *
 * @param {string} name - Field name, also the base for every part's test id
 * @param {Array} options - Choices; an entry with its own `options` is a group
 * @param {string} [placeholder] - Shown until something is chosen
 * @param {React.ReactNode} [label] - Label above (or beside) the box
 * @param {('vertical'|'horizontal')} [orientation='vertical'] - Label above the box, or beside it
 * @param {React.ReactNode} [description] - Helper text below the field
 * @param {React.ReactNode} [error] - Replaces the helper text and marks the field invalid
 * @param {boolean} [invalid] - Error styling without a message
 * @param {React.ReactNode} [action] - Link in the label row
 * @param {React.ReactNode} [startAdornment] - Icon at the leading edge of the box
 * @param {('positive'|'negative')} [validation] - Validation glyph before the chevron
 * @param {boolean} [disabled] - Whether the field is disabled
 *
 * @example
 * ```tsx
 * <SelectField
 *   name="country"
 *   label="Country"
 *   placeholder="Select a country"
 *   startAdornment={<Globe />}
 *   options={[
 *     { value: "us", label: "United States" },
 *     { value: "ca", label: "Canada" },
 *     { value: "mx", label: "Mexico", disabled: true },
 *   ]}
 *   description="Where your account is billed."
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Grouped choices, and the label beside the box.
 * <SelectField
 *   name="timezone"
 *   orientation="horizontal"
 *   label="Timezone"
 *   options={[
 *     { label: "Europe", options: [{ value: "cet", label: "CET" }] },
 *     { label: "America", options: [{ value: "est", label: "EST" }] },
 *   ]}
 * />
 * ```
 *
 * @cssVariables
 * Layout:
 * - `--selectfield-label-width` — the label column in `horizontal`, `5rem` by default
 *
 * Typography:
 * - `--typography-font-size-body-s`
 * - `--typography-font-size-label-m`
 *
 * Semantic colors:
 * - `--color-foreground-feedback-negative`
 * - `--color-foreground-feedback-positive`
 * - `--color-foreground-on-page-default`
 * - `--color-foreground-on-page-muted`
 * - `--color-foreground-state-disabled`
 */
function SelectField({
  id: idProp,
  name,
  options,
  placeholder,
  className,
  classNames,
  label,
  orientation = "vertical",
  description,
  error,
  invalid,
  action,
  startAdornment,
  validation,
  disabled,
  ref,
  onBlur,
  "aria-describedby": ariaDescribedBy,
  "data-testid": testId = name,
  ...props
}: SelectFieldProps) {
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

  // As in `TextField`: horizontal renders the cell even when it is empty, so the
  // box stays in the second column and a form of fields keeps its left edge.
  const showsLabelRow = !!label || !!action || orientation === "horizontal";

  return (
    <div
      // `group` + `data-disabled` is how `Label` learns that its control is
      // disabled; the label is not a DOM sibling of the trigger here, so its
      // `peer-disabled` rules would never match.
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
            // bare `<a>` and a router's `Link` both land as the designed link.
            <Slot
              data-testid={testIdFor("action")}
              aria-disabled={disabled || undefined}
              tabIndex={disabled ? -1 : undefined}
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                actionLink,
                classNames?.action,
              )}
            >
              {action}
            </Slot>
          )}
        </div>
      )}

      <Select name={name} data-testid={testId} disabled={disabled} {...props}>
        <SelectTrigger
          id={id}
          ref={ref}
          onBlur={onBlur}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          className={cn(orientation === "horizontal" && "col-start-2", classNames?.trigger)}
          startAdornment={startAdornment}
          endAdornment={
            ValidationIcon && (
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
            )
          }
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent className={classNames?.content}>
          {options.map((entry, index) =>
            isGroup(entry) ? (
              // A group has no identity of its own — two of them can carry the
              // same caption, or none at all — so it is keyed by position. Safe
              // here because the group holds no state and its rows are keyed by
              // value: reordering the groups still reconciles every row.
              <SelectGroup key={`group:${index}`}>
                <SelectLabel>{entry.label}</SelectLabel>
                {entry.options.map((option) => (
                  <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : (
              <SelectItem key={entry.value} value={entry.value} disabled={entry.disabled}>
                {entry.label}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

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
            // the user chose.
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

export { SelectField, type SelectFieldProps, type SelectOption, type SelectOptionGroup };
