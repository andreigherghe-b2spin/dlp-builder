"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { usePortalContainer } from "@/lib/portalContainer";
import { TestIdProvider, usePartTestId } from "@/lib/testId";
import { cn, fieldBox, menuRow } from "@/lib/utils";

const trigger = `
  ${fieldBox}

  group/trigger
  items-center gap-2
  cursor-pointer
  whitespace-nowrap
  text-left
  data-[placeholder]:text-foreground-on-surface-muted

  not-data-[state=open]:hover:bg-linear-[0deg,var(--color-background-state-hover)_0%,var(--color-background-state-hover)_100%]
  active:bg-linear-[0deg,var(--color-background-state-pressed)_0%,var(--color-background-state-pressed)_100%]

  data-[state=open]:border-border-state-active
  data-[state=open]:shadow-[inset_0_0_0_1px_var(--color-border-state-active)]

  aria-invalid:data-[state=open]:border-border-feedback-negative
  aria-invalid:data-[state=open]:shadow-[inset_0_0_0_1px_var(--color-border-feedback-negative)]

  disabled:data-[placeholder]:text-foreground-state-disabled
`;

const adornmentSlot = "flex size-4 shrink-0 items-center justify-center [&_svg]:size-4";

const content = `
  relative z-50
  max-h-(--radix-select-content-available-height)
  w-(--radix-select-trigger-width)
  origin-(--radix-select-content-transform-origin)
  overflow-y-auto overflow-x-hidden
  p-1

  outline-none

  border-solid
  border-(length:--components-textfield-border)
  border-border-neutral-subtle
  rounded-offset4
  bg-background-layout-surface
  shadow-md

  font-(family-name:--typography-font-family)

  data-[state=open]:animate-in data-[state=closed]:animate-out
  data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
  data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
  data-[side=bottom]:slide-in-from-top-2
  data-[side=left]:slide-in-from-right-2
  data-[side=right]:slide-in-from-left-2
  data-[side=top]:slide-in-from-bottom-2
`;

/**
 * One row of the menu, and it is the shared one — the same rectangle
 * `DropdownMenu` draws. See `menuRow` in [lib/utils](../lib/utils.ts) for what
 * is shared, what deliberately is not, and why there is no focus ring on a row.
 *
 * What a select row adds is nothing: the trailing check and the truncating
 * label wrapper are rendered by `SelectItem` below rather than carried in
 * classes here.
 */
const item = menuRow;

/**
 * A single-choice select built on Radix. This is the bare primitive — for a
 * labelled field with helper or error text, reach for
 * [SelectField](./selectField.tsx), which composes it.
 *
 * @param {React.ComponentProps<typeof SelectPrimitive.Root>} props - Props for the select root
 *
 * @example
 * ```tsx
 * <Select>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Select an option" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="apple">Apple</SelectItem>
 *     <SelectItem value="banana">Banana</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 *
 * @cssVariables
 * Component and typography:
 * - `--components-textfield-border`
 * - `--components-textfield-radius`
 * - `--radius-offset4`
 * - `--shadow-md`
 * - `--typography-font-family`
 * - `--typography-font-size-body-s`
 * - `--typography-font-size-label-m`
 * - `--typography-font-weight-medium`
 * - `--typography-font-weight-regular`
 * - `--typography-font-weight-semibold`
 *
 * Semantic colors:
 * - `--color-background-layout-surface`
 * - `--color-background-layout-surface-variant1`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-background-state-pressed`
 * - `--color-background-state-selected`
 * - `--color-border-feedback-negative`
 * - `--color-border-neutral-default`
 * - `--color-border-neutral-subtle`
 * - `--color-border-state-active`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-on-surface-muted`
 * - `--color-foreground-state-disabled`
 *
 * @see [Reference](https://www.radix-ui.com/primitives/docs/components/select#api-reference)
 */
function Select({
  "data-testid": testId,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root> & {
  /**
   * Names the whole select. Defaults to `name`, since a form control already has
   * the most predictable id it could have; every part derives from it.
   */
  "data-testid"?: string;
}) {
  // `Root` renders no element, so the base is published rather than placed.
  return (
    <TestIdProvider value={testId ?? props.name}>
      <SelectPrimitive.Root {...props} />
    </TestIdProvider>
  );
}

/**
 * Groups related items under a shared [SelectLabel](#selectlabel).
 *
 * @param {string} [data-testid] - Overrides the id derived from the select's own
 * @param {React.ComponentProps<typeof SelectPrimitive.Group>} props - Props for the group element
 */
function SelectGroup({
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group> & {
  /** Replaces the derived `<select>-group`. */
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId("group", override);

  return <SelectPrimitive.Group data-testid={testId} {...props} />;
}

/**
 * The selected item's text inside the trigger, or the placeholder when nothing
 * is selected.
 *
 * @param {string} [placeholder] - Text shown while no value is selected
 * @param {React.ComponentProps<typeof SelectPrimitive.Value>} props - Props for the value element
 */
function SelectValue({
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("value", override);

  return <SelectPrimitive.Value data-testid={testId} {...props} />;
}

type SelectTriggerProps = React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  /**
   * An icon at the leading edge, inside the box. Muted like `Input`'s, so a
   * child that has to keep its own colour should carry the class itself.
   */
  startAdornment?: React.ReactNode;
  /**
   * An icon between the value and the chevron — where the field puts its
   * validation glyph. The chevron always stays against the trailing edge.
   */
  endAdornment?: React.ReactNode;
  /**
   * Base for this part's `data-testid`. Everything inside derives from it — a
   * trigger named `country` gives `country-chevron` — and nothing at all reaches
   * the DOM when no base was passed.
   */
  "data-testid"?: string;
};

/**
 * The box that opens the menu. Figma draws one size only, so there is no `size`
 * prop: the trigger is 48px tall like every other field box.
 *
 * The chevron is a single `ChevronDown` rotated on open rather than a second
 * glyph — Figma's ChevronUp is the same path at 180°, and rotating it is what
 * lets the change animate.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ReactNode} [startAdornment] - Icon at the leading edge
 * @param {React.ReactNode} [endAdornment] - Icon before the chevron
 * @param {React.ComponentProps<typeof SelectPrimitive.Trigger>} props - Props for the trigger
 */
function SelectTrigger({
  className,
  children,
  startAdornment,
  endAdornment,
  "data-testid": override,
  ...props
}: SelectTriggerProps) {
  const { testId, testIdFor } = usePartTestId("trigger", override);

  return (
    <SelectPrimitive.Trigger data-testid={testId} className={cn(trigger, className)} {...props}>
      {startAdornment && (
        <span
          data-testid={testIdFor("start")}
          // Off the trigger's own `:disabled` rather than a `disabled` prop:
          // Radix disables the trigger from the `Select` root as well, and that
          // is the path a `SelectField` takes, so the prop is `undefined`
          // exactly when the field is disabled.
          className={cn(
            adornmentSlot,
            "text-foreground-on-surface-muted",
            "group-disabled/trigger:text-foreground-state-disabled",
          )}
        >
          {startAdornment}
        </span>
      )}

      {/*
        Blockified on purpose — no `flex` here. `truncate` needs a block
        container to have anywhere to put the ellipsis; on a flex row it does
        nothing and a long value hard-clips instead.
      */}
      <span data-testid={testIdFor("value-row")} className="min-w-0 flex-1 truncate">
        {children}
      </span>

      {endAdornment && (
        <span data-testid={testIdFor("end")} className={adornmentSlot}>
          {endAdornment}
        </span>
      )}

      <SelectPrimitive.Icon asChild>
        <ChevronDown
          aria-hidden
          data-testid={testIdFor("chevron")}
          className="size-4 shrink-0 transition-transform duration-150 group-data-[state=open]/trigger:rotate-180"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/**
 * The menu panel. Always `popper`, so it can be sized to the trigger — Figma
 * draws the menu exactly as wide as the box it belongs to, 4px below it.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {('item'|'popper')} [position='popper'] - Positioning strategy
 * @param {number} [sideOffset=4] - Gap between the trigger and the panel
 * @param {React.ComponentProps<typeof SelectPrimitive.Content>} props - Props for the content element
 */
function SelectContent({
  className,
  children,
  position = "popper",
  sideOffset = 4,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & { "data-testid"?: string }) {
  const { testId, testIdFor } = usePartTestId("content", override);
  const container = usePortalContainer();

  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        data-testid={testId}
        position={position}
        sideOffset={sideOffset}
        className={cn(content, className)}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-testid={testIdFor("viewport")}
          className="flex flex-col gap-1 *:shrink-0"
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/**
 * Caption above a [SelectGroup](#selectgroup).
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [data-testid] - Overrides the id derived from the select's own
 * @param {React.ComponentProps<typeof SelectPrimitive.Label>} props - Props for the label element
 */
function SelectLabel({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label> & {
  /** Replaces the derived `<select>-group-label`. */
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId("group-label", override);

  return (
    <SelectPrimitive.Label
      data-testid={testId}
      className={cn(
        "text-foreground-on-surface-muted px-3 py-1.5",
        "text-(length:--typography-font-size-body-s)",
        "font-(--typography-font-weight-regular)",
        className,
      )}
      {...props}
    />
  );
}

/**
 * One choice in the menu. The selected row goes semibold and grows a check
 * against the trailing edge, which is the only thing that distinguishes it once
 * the highlight has moved elsewhere.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} value - The value submitted when this item is chosen
 * @param {boolean} [disabled] - Whether the item can be selected
 * @param {React.ComponentProps<typeof SelectPrimitive.Item>} props - Props for the item element
 */
function SelectItem({
  className,
  children,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & { "data-testid"?: string }) {
  // Named by the value it stands for — `country-item-us`. One id shared by every
  // item would leave a test reaching them by position, which reorders with the data.
  const { testId, testIdFor } = usePartTestId(`item-${props.value}`, override);

  return (
    <SelectPrimitive.Item data-testid={testId} className={cn(item, className)} {...props}>
      {/*
        The wrapper is what carries the layout, not `ItemText`: Radix strips
        `className` and `style` off `ItemText` — it renders the same children a
        second time inside the trigger, and styling both copies from one prop
        would be wrong — so anything put there is dropped. Without this the row
        does not fill and the check sits against the value instead of the
        trailing edge, and `truncate` never applies either.
      */}
      <span data-testid={testIdFor("text")} className="min-w-0 flex-1 truncate">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </span>
      <SelectPrimitive.ItemIndicator asChild>
        <Check
          aria-hidden
          data-testid={testIdFor("indicator")}
          className="ml-auto size-4 shrink-0"
        />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

/**
 * Rule between groups of items.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [data-testid] - Overrides the id derived from the select's own
 * @param {React.ComponentProps<typeof SelectPrimitive.Separator>} props - Props for the separator
 */
function SelectSeparator({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator> & {
  /** Replaces the derived `<select>-separator`. */
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId("separator", override);

  return (
    <SelectPrimitive.Separator
      data-testid={testId}
      className={cn("bg-border-neutral-subtle pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

/**
 * Appears at the top of the panel when the list overflows.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [data-testid] - Overrides the id derived from the select's own
 * @param {React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>} props - Props for the button
 */
function SelectScrollUpButton({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton> & {
  /** Replaces the derived `<select>-scroll-up`. */
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId("scroll-up", override);

  return (
    <SelectPrimitive.ScrollUpButton
      data-testid={testId}
      className={cn(
        "text-foreground-on-surface-muted flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDown aria-hidden className="size-4 rotate-180" />
    </SelectPrimitive.ScrollUpButton>
  );
}

/**
 * Appears at the bottom of the panel when the list overflows.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [data-testid] - Overrides the id derived from the select's own
 * @param {React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>} props - Props for the button
 */
function SelectScrollDownButton({
  className,
  "data-testid": override,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton> & {
  /** Replaces the derived `<select>-scroll-down`. */
  "data-testid"?: string;
}) {
  const { testId } = usePartTestId("scroll-down", override);

  return (
    <SelectPrimitive.ScrollDownButton
      data-testid={testId}
      className={cn(
        "text-foreground-on-surface-muted flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDown aria-hidden className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  type SelectTriggerProps,
  SelectValue,
};
