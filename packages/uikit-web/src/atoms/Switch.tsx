"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn, createTestIdFor } from "@/lib/utils";

/**
 * Like Checkbox, Figma draws no component-level radius or border token for the
 * switch — it reaches for the `Radius/base` and `border-width/border-1`
 * primitives directly. `Radius/base` is 12px against a 24px track and a 20px
 * thumb, so both clamp to a full pill; a brand that lowers the token gets a
 * squarer switch on purpose.
 *
 * Figma models the two halves as one node: the 44×24 track beside a label and
 * description. Only the track lives here, the way only the 20px box lives in
 * [Checkbox](./checkbox.tsx) — the label half is a `SwitchField` that does not
 * exist yet, and until it does a caller pairs this with `Label` by hand.
 *
 * The overlays follow Checkbox: a transparent `background-image` on the base so
 * hover and pressed have something to paint over, leaving `background-color` to
 * the checked state. Figma gives Focus **no** overlay — only the ring — which is
 * where this parts company with Checkbox, so there is no `focus-visible:` entry
 * among the three.
 *
 * `disabled:data-[state]` is the same specificity trick Checkbox documents:
 * Tailwind emits `data-[state=checked]:*` after the plain `disabled:*` rules, so
 * without the qualifier a disabled checked switch would keep its brand fill. The
 * qualifier lifts disabled to `(0,3,0)` and it wins.
 */
const track = `
  peer group/switch
  relative inline-flex shrink-0 items-center
  h-6 w-11 px-px
  cursor-pointer
  transition-all
  outline-none

  border-solid
  border-(length:--border-width-border-1)
  rounded-base

  bg-linear-[0deg,transparent_0%,transparent_100%]

  data-[state=unchecked]:bg-background-layout-surface-variant1
  data-[state=unchecked]:border-border-neutral-default
  data-[state=checked]:bg-background-brand-primary-container
  data-[state=checked]:border-border-neutral-subtle

  hover:bg-linear-[0deg,var(--color-background-state-hover)_0%,var(--color-background-state-hover)_100%]
  active:bg-linear-[0deg,var(--color-background-state-pressed)_0%,var(--color-background-state-pressed)_100%]

  focus-visible:after:pointer-events-none
  focus-visible:after:absolute
  focus-visible:after:-inset-1.25
  focus-visible:after:border-4
  focus-visible:after:border-solid
  focus-visible:after:border-border-state-focus
  focus-visible:after:content-['']

  disabled:pointer-events-none
  disabled:cursor-not-allowed
  disabled:after:hidden

  disabled:data-[state]:bg-background-state-disabled
  disabled:data-[state]:border-transparent
`;

/**
 * The 2px Figma writes between the track edge and the thumb is 1px of border
 * plus 1px of padding, not 2px of padding on top of the border — which is why
 * the track is `px-px`. The vertical gap proves it: 24 tall, minus two 1px
 * borders, minus the 20px thumb, leaves 2px that `items-center` splits into 1px
 * above and below. Padding the sides by 2 would inset the thumb 3px
 * horizontally against 2px vertically, and the circle would sit visibly wrong.
 *
 * That makes the travel 44 − 2 border − 2 padding − 20 thumb = 20px, one clean
 * `translate-x-5` rather than a fractional step.
 */
const thumb = `
  pointer-events-none block
  size-5
  rounded-base
  bg-foreground-on-surface-default
  transition-transform
  data-[state=unchecked]:translate-x-0
  data-[state=checked]:translate-x-5
  group-disabled/switch:bg-foreground-state-disabled
`;

/**
 * A control that toggles a single option on or off.
 * Built on Radix UI's Switch primitive.
 *
 * This is the bare 44×24 track. Figma draws it beside a label and an optional
 * description; pair it with [Label](./label.tsx) until a `SwitchField` exists.
 *
 * It carries `peer`, so a `Label` written next to it picks up the disabled state
 * through `peer-disabled`.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ComponentProps<typeof SwitchPrimitive.Root>} props - Props for the switch root element
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Switch />
 *
 * // With label
 * <div className="flex items-center gap-2">
 *   <Switch id="airplane-mode" />
 *   <Label htmlFor="airplane-mode">Airplane mode</Label>
 * </div>
 *
 * // Controlled
 * <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
 *
 * // Disabled
 * <Switch disabled />
 * ```
 *
 * @cssVariables
 * Component and typography:
 * - `--border-width-border-1`
 * - `--radius-base`
 *
 * Semantic colors:
 * - `--color-background-brand-primary-container`
 * - `--color-background-layout-surface-variant1`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-background-state-pressed`
 * - `--color-border-neutral-default`
 * - `--color-border-neutral-subtle`
 * - `--color-border-state-focus`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-state-disabled`
 *
 * @see [API Reference](https://www.radix-ui.com/primitives/docs/components/switch#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/switch)
 */
function Switch({
  className,
  "data-testid": testIdProp,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & { "data-testid"?: string }) {
  // A form control is addressable by the name it already has, which is the same
  // string the form, the label and the validation message are keyed on. An explicit
  // `data-testid` still wins; `name` stays in `...props` and is placed by the spread.
  const testId = testIdProp ?? props.name;
  const testIdFor = createTestIdFor(testId);

  return (
    <SwitchPrimitive.Root data-testid={testId} className={cn(track, className)} {...props}>
      <SwitchPrimitive.Thumb data-testid={testIdFor("thumb")} className={thumb} />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
