"use client";

import * as React from "react";

import { cn, createTestIdFor, fieldBox } from "@/lib/utils";

/**
 * Figma draws Focus and Pressed as two variants, but for a text field they are one
 * state, so `:active` takes the focus visual — the border going `state-active`, 2px
 * in Figma and here 1px plus a 1px inset shadow, over a fill that stays
 * `surface-variant1` — and the field never takes the `state-pressed` overlay the
 * Pressed variant carries. The fill is one token in every state on purpose: it moved
 * off `layout-surface` when the design did.
 * `:focus-visible` lands on mousedown anyway, so in a browser the two rarely
 * disagree; both are spelled out so the state reads the same however it was entered.
 */
const base = `
  ${fieldBox}

  min-w-0
  cursor-text
  placeholder:text-foreground-on-surface-muted

  not-active:not-focus-visible:group-hover/field:bg-linear-[0deg,var(--color-background-state-hover)_0%,var(--color-background-state-hover)_100%]

  active:border-border-state-active
  active:shadow-[inset_0_0_0_1px_var(--color-border-state-active)]

  aria-invalid:active:border-border-feedback-negative
  aria-invalid:active:shadow-[inset_0_0_0_1px_var(--color-border-feedback-negative)]

  disabled:placeholder:text-foreground-state-disabled

  [[readonly]]:cursor-default
  [[readonly]]:not-active:not-focus-visible:group-hover/field:bg-linear-[0deg,transparent_0%,transparent_100%]

  file:inline-flex
  file:h-7
  file:border-0
  file:bg-transparent
  file:text-(length:--typography-font-size-label-m)
  file:font-(--typography-font-weight-medium)

  autofill:[transition:background-color_0s_1000s]
`;

/**
 * The adornments' containing block, which is why they need no stacking order —
 * they are positioned and the `<input>` is not. An `<input>` is a replaced
 * element and cannot contain a box of its own, so the wrapper exists for them.
 *
 * It carried a focus ring too — an `::after` box, the way Button still draws
 * one. The field no longer takes it: focus is the border going `state-active`
 * over the `surface-variant1` fill, which is indicator enough on a control that
 * is already a bordered box, and does not put a 4px halo into the layout of
 * every form row.
 *
 * It is also the hover group, because Figma tints the whole box: an interactive
 * adornment is the `<input>`'s sibling, not its child, so with `hover:` on the
 * input the fill dropped back to `default` the moment the pointer reached the
 * password toggle. The wrapper's box is the input's box, so the hover area is
 * unchanged — only what observes it moved out.
 */
const wrapper = "relative flex w-full";

/**
 * A row rather than a box per position, because a side routinely carries more
 * than one thing — a password toggle beside a validation glyph is the most
 * common field in the product. Inert, so a decorative icon never swallows the
 * click that should focus the field, while anything interactive gets its
 * pointer events back.
 */
const adornmentRow = `
  pointer-events-none
  absolute top-1/2 flex -translate-y-1/2 items-center gap-2
  [&_a]:pointer-events-auto
  [&_button]:pointer-events-auto
`;

/** One box in that row. */
const adornmentSlot = "flex size-4 items-center justify-center [&_svg]:size-4";

/**
 * Room to reserve, indexed by how many boxes sit on that side: `16 + 24n`, since
 * an `<input>` cannot hold children. Spelled out rather than computed because
 * Tailwind only generates classes it can read as literals; a side with more
 * boxes than entries keeps the last inset.
 */
const startPadding = ["", "pl-10", "pl-16"] as const;
const endPadding = ["", "pr-10", "pr-16", "pr-22"] as const;

function paddingFor(scale: readonly string[], count: number) {
  return scale[Math.min(count, scale.length - 1)];
}

/**
 * Fragments opened up: a side is routinely written as
 * `<>{toggle}{isTouched && <Check />}</>`, and counting that as one box would
 * stack both icons in the same 16px square.
 */
function adornmentNodes(node: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(node).flatMap((child) =>
    React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment
      ? adornmentNodes(child.props.children)
      : [child],
  );
}

type InputProps = React.ComponentProps<"input"> & {
  /**
   * Icons or icon buttons inside the field. Pass a fragment for several — each
   * child gets its own 16px box, in reading order. The row is muted on the
   * leading side; a child that has to keep its own colour, such as a validation
   * glyph, should carry the class itself.
   */
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  /**
   * Classes for the `<input>` itself, for overriding the box: its height,
   * padding, colours, text alignment. `className` sizes and places the field as
   * a whole — the adornments and the focus ring are positioned against it, so
   * width belongs there and not here.
   */
  inputClassName?: string;
  /**
   * Lands on the `<input>` itself; the parts around it derive from it —
   * `-wrapper` for the box, `-start`/`-end` for the adornment rows.
   *
   * The input rather than the wrapper, because the input is what a consumer
   * means by it: `TextField` passes `<base>-input` down here, and putting that on
   * the wrapper would leave the actual field answering to `<base>-input-input`.
   */
  "data-testid"?: string;
};

/**
 * The field box: the input itself and the adornments inside it. It is the bare
 * control — for a labelled field with helper or error text, reach for
 * [TextField](./textField.tsx), which composes this.
 *
 * The `<input>` is wrapped, because the adornments are boxes an `<input>`
 * cannot contain. `className` therefore lands on that wrapper — the
 * element that sizes and places the field, and the one the adornments are
 * positioned against, so `w-*`, `mt-*` and the like belong there. Use
 * `inputClassName` to reach the box inside it.
 *
 * @param {string} [className] - Additional CSS classes for the field as a whole
 * @param {string} [inputClassName] - Additional CSS classes for the `<input>`
 * @param {string} [type] - HTML input type (e.g., 'text', 'password', 'email', etc.)
 * @param {React.ComponentProps<'input'>} props - Props for the input element
 *
 * @example
 * ```tsx
 * // Basic text input
 * <Input type="text" placeholder="Enter your name" />
 *
 * // Password input
 * <Input type="password" placeholder="Enter your password" />
 *
 * // Disabled input
 * <Input disabled type="text" value="Disabled input" />
 *
 * // Input with error state
 * <Input aria-invalid type="email" placeholder="Enter your email" />
 * ```
 *
 * @example
 * ```tsx
 * // A search box: an icon on one side, a clear button on the other.
 * <Input
 *   type="search"
 *   placeholder="Search…"
 *   startAdornment={<Search />}
 *   endAdornment={
 *     value !== "" && (
 *       <Button variant="link" size="sm" aria-label="Clear" onClick={clear}>
 *         <X />
 *       </Button>
 *     )
 *   }
 * />
 * ```
 *
 * @cssVariables
 * Component and typography:
 * - `--components-textfield-border`
 * - `--components-textfield-radius`
 * - `--typography-font-family`
 * - `--typography-font-weight-medium`
 * - `--typography-font-size-label-m`
 *
 * Semantic colors:
 * - `--color-background-layout-surface-variant1`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-border-feedback-negative`
 * - `--color-border-neutral-default`
 * - `--color-border-neutral-subtle`
 * - `--color-border-state-active`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-on-surface-muted`
 * - `--color-foreground-state-disabled`
 *
 * @see [Documentation](https://ui.shadcn.com/docs/components/input)
 */
function Input({
  className,
  inputClassName,
  type,
  startAdornment,
  endAdornment,
  disabled,
  "data-testid": testIdProp,
  ...props
}: InputProps) {
  const startSlots = adornmentNodes(startAdornment);
  const endSlots = adornmentNodes(endAdornment);
  // A form control is addressable by the name it already has, which is the same
  // string the form, the label and the validation message are keyed on. An explicit
  // `data-testid` still wins; `name` stays in `...props` and is placed by the spread.
  const testId = testIdProp ?? props.name;
  const testIdFor = createTestIdFor(testId);

  return (
    <div
      data-testid={testIdFor("wrapper")}
      // The wrapper is what a sibling `Label` can see, and it is never
      // `:disabled` itself, so the state is mirrored onto it for the
      // `peer-data-[disabled=true]` rules in `Label`.
      data-disabled={disabled || undefined}
      // The group is dropped when disabled rather than guarded on the input:
      // `disabled:pointer-events-none` keeps the input out of `:hover`, but it
      // cannot stop the wrapper from being hovered, and the hover overlay wins
      // on specificity over the disabled one.
      className={cn(wrapper, !disabled && "group/field", className)}
    >
      {startSlots.length > 0 && (
        <span
          data-testid={testIdFor("start")}
          className={cn(
            adornmentRow,
            "left-4",
            disabled ? "text-foreground-state-disabled" : "text-foreground-on-surface-muted",
          )}
        >
          {startSlots.map((content, index) => (
            <span key={`start-${index}`} className={adornmentSlot}>
              {content}
            </span>
          ))}
        </span>
      )}

      <input
        type={type}
        data-testid={testId}
        disabled={disabled}
        className={cn(
          base,
          paddingFor(startPadding, startSlots.length),
          paddingFor(endPadding, endSlots.length),
          inputClassName,
        )}
        {...props}
      />

      {endSlots.length > 0 && (
        <span
          data-testid={testIdFor("end")}
          className={cn(
            adornmentRow,
            "right-4",
            disabled ? "text-foreground-state-disabled" : "text-foreground-on-surface-default",
          )}
        >
          {endSlots.map((content, index) => (
            <span key={`end-${index}`} className={adornmentSlot}>
              {content}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

export { Input, type InputProps };
