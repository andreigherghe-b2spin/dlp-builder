"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn, createTestIdFor } from "@/lib/utils";

/**
 * Figma draws no component-level radius or border token for the checkbox — it
 * reaches for the `Radius/compact` and `border-width/border-1` primitives
 * directly, unlike Button and TextField. These are the repo primitives with the
 * same values; a `--components-checkbox-*` pair is an open question for the
 * designers.
 *
 * Checked and Indeterminate paint identically — one filled box, only the glyph
 * differs — so the two `data-state` selectors always travel together.
 *
 * Figma models Error as a fourth Status rather than a State: an unchecked box
 * with a negative border, and the label beside it recoloured — that half lives
 * in [CheckboxField](./checkboxField.tsx). It draws no Error × Disabled cell,
 * and disabled is the stronger statement, so here disabled wins.
 *
 * Hence the `:data-[state]` hanging off the invalid and disabled rules. Radix
 * always writes a state, so it changes nothing about when they match; it is
 * there for specificity. Tailwind emits `data-[state=checked]:*` last of the
 * three, so at equal weight the status would win, and a checked invalid box
 * would lose its negative border while a disabled one kept the brand fill.
 * The qualifier lifts both to `(0,3,0)`, and among those three the emitted
 * order settles it: disabled last, so disabled beats invalid.
 *
 * The overlays are plain `hover:` / `focus-visible:` / `active:`, all at
 * `(0,2,0)` and emitted in that order, so each state beats the ones before it.
 * They all paint `background-image`, so there is nothing to stack and no need
 * for the `not-focus-visible:hover:` guard `Input` carries — which at `(0,3,0)`
 * would have outranked `active:` and swallowed the pressed state entirely.
 */
const base = `
  peer
  relative inline-flex shrink-0 items-center justify-center
  size-5
  cursor-pointer
  transition-all
  outline-none

  border-solid
  border-(length:--border-width-border-1)
  rounded-(--radius-rounded-4)

  bg-background-layout-surface-variant1
  bg-linear-[0deg,transparent_0%,transparent_100%]
  border-border-neutral-strong

  data-[state=checked]:bg-background-brand-primary-container
  data-[state=indeterminate]:bg-background-brand-primary-container
  data-[state=checked]:border-border-neutral-subtle
  data-[state=indeterminate]:border-border-neutral-subtle
  data-[state=checked]:text-foreground-brand-on-primary-container
  data-[state=indeterminate]:text-foreground-brand-on-primary-container

  hover:bg-linear-[0deg,var(--color-background-state-hover)_0%,var(--color-background-state-hover)_100%]
  focus-visible:bg-linear-[0deg,var(--color-background-state-pressed)_0%,var(--color-background-state-pressed)_100%]
  active:bg-linear-[0deg,var(--color-background-state-pressed)_0%,var(--color-background-state-pressed)_100%]

  focus-visible:after:pointer-events-none
  focus-visible:after:absolute
  focus-visible:after:-inset-1.25
  focus-visible:after:border-4
  focus-visible:after:border-solid
  focus-visible:after:border-border-state-focus
  focus-visible:after:content-['']

  not-disabled:aria-invalid:border-border-feedback-negative

  disabled:pointer-events-none
  disabled:cursor-not-allowed
  disabled:after:hidden

  disabled:data-[state]:bg-background-state-disabled
  disabled:data-[state]:border-border-neutral-subtle
  disabled:data-[state]:text-foreground-state-disabled
`;

/**
 * The glyph box: 16px inside the 20px square, as Figma nests it. Radix mounts
 * it only once the box is checked or indeterminate, and puts the state on it,
 * which is what the two icons read to pick themselves.
 *
 * They read it through a *named* group rather than a bare ancestor selector.
 * `data-state` is not ours alone — a Radix menu item or select item carries one
 * too — and an unnamed ancestor match would let a `data-state="checked"` menu
 * row hide the dash of an indeterminate box nested inside it, leaving an empty
 * square.
 */
const indicator = "group/indicator flex items-center justify-center [&_svg]:size-4";

/**
 * A control that toggles between checked, unchecked and indeterminate.
 * Built on Radix UI's Checkbox primitive.
 *
 * This is the bare 20px box. For the designed field — box beside a label with
 * an optional description or error line — reach for
 * [CheckboxField](./checkboxField.tsx), which composes this with `Label`.
 *
 * Pass `checked="indeterminate"` for the partially-selected state; the glyph
 * switches from a tick to a dash on its own. `children` still overrides the
 * indicator entirely when a product needs its own mark.
 *
 * `aria-invalid` gives Figma's Error status its negative border. The other half
 * of that status — the label turning negative too — belongs to whatever renders
 * the label, which is `CheckboxField` in the composed case.
 *
 * It carries `peer`, so a `Label` written next to it picks up the disabled
 * state through `peer-disabled`.
 *
 * @param {React.ReactNode} [children] - Custom indicator content (defaults to a tick, or a dash when indeterminate)
 * @param {string} [className] - Additional CSS classes
 * @param {React.ComponentProps<typeof CheckboxPrimitive.Root>} props - Props for the checkbox root element
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Checkbox />
 *
 * // With label
 * <div className="flex items-center gap-3">
 *   <Checkbox id="terms" />
 *   <Label htmlFor="terms">Accept terms and conditions</Label>
 * </div>
 *
 * // Partially selected
 * <Checkbox checked="indeterminate" />
 *
 * // Figma's Error status
 * <Checkbox aria-invalid />
 *
 * // Disabled state
 * <Checkbox disabled />
 * ```
 *
 * @cssVariables
 * Component and typography:
 * - `--border-width-border-1`
 * - `--radius-rounded-4`
 *
 * Semantic colors:
 * - `--color-background-brand-primary-container`
 * - `--color-background-layout-surface-variant1`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-background-state-pressed`
 * - `--color-border-feedback-negative`
 * - `--color-border-neutral-strong`
 * - `--color-border-neutral-subtle`
 * - `--color-border-state-focus`
 * - `--color-foreground-brand-on-primary-container`
 * - `--color-foreground-state-disabled`
 *
 * @see [API Reference](https://www.radix-ui.com/primitives/docs/components/checkbox#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/checkbox)
 */
function Checkbox({
  children,
  className,
  "data-testid": testIdProp,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & { "data-testid"?: string }) {
  // A form control is addressable by the name it already has, which is the same
  // string the form, the label and the validation message are keyed on. An explicit
  // `data-testid` still wins; `name` stays in `...props` and is placed by the spread.
  const testId = testIdProp ?? props.name;
  const testIdFor = createTestIdFor(testId);

  return (
    <CheckboxPrimitive.Root data-testid={testId} className={cn(base, className)} {...props}>
      <CheckboxPrimitive.Indicator data-testid={testIdFor("indicator")} className={indicator}>
        {children ?? (
          <>
            <Check aria-hidden className="group-data-[state=indeterminate]/indicator:hidden" />
            <Minus aria-hidden className="group-data-[state=checked]/indicator:hidden" />
          </>
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
