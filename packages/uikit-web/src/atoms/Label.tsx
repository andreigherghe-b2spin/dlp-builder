"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { labelVariants } from "@/atoms/Typography";
import { cn } from "@/lib/utils";

// The type is `Label/Medium/Medium`, taken from `labelVariants` rather than
// respelled here, so the form label and `TypographyLabel` cannot drift apart.
// The `Label` family is identical on the Mobile and Desktop boards and its size
// tokens are untouched by the brand files' `min-width: 1024px` block, so there
// is no responsive variant to add.
//
// It also brings `no-underline` along, from the variant's `underline: false`
// default: a label is not underlined even when it sits inside something that is.
const base = `
  flex items-center gap-2
  select-none

  text-foreground-on-page-default

  group-data-[disabled=true]:pointer-events-none
  group-data-[disabled=true]:text-foreground-state-disabled

  peer-disabled:cursor-not-allowed
  peer-disabled:text-foreground-state-disabled

  peer-data-[disabled=true]:cursor-not-allowed
  peer-data-[disabled=true]:text-foreground-state-disabled
`;

/**
 * An accessible label component that can be associated with form controls.
 * Built on top of Radix UI's Label primitive.
 *
 * Associate it with its control through `htmlFor`, pointing at the control's
 * `id`. Radix also forwards a click on the label to the control, but only the
 * explicit pairing is announced to assistive technology, so `htmlFor` is not
 * optional. [TextField](./textField.tsx) wires this up for you.
 *
 * Disabled reaches the label two ways: from a control marked `peer` next to it,
 * or from a `group` ancestor carrying `data-disabled`. `Input` is a wrapped
 * `<input>`, so the sibling the label sees is the wrapper and cannot itself be
 * `:disabled` — it mirrors the state as `data-disabled`, which is why the peer
 * rules match on both.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ComponentProps<typeof LabelPrimitive.Root>} props - Props for the label element
 *
 * @example
 * // Basic usage
 * <Label htmlFor="email">Email</Label>
 * <Input id="email" type="email" />
 *
 * @example
 * // With disabled state
 * <div className="group" data-disabled={true}>
 *   <Label htmlFor="name">Name</Label>
 *   <Input id="name" disabled />
 * </div>
 *
 * @example
 * // With required indicator
 * <Label htmlFor="password">
 *   Password <span className="text-foreground-feedback-negative">*</span>
 * </Label>
 *
 * @cssVariables
 * Typography:
 * - `--typography-font-family`
 * - `--typography-font-size-label-m`
 * - `--typography-font-weight-medium`
 *
 * Semantic colors:
 * - `--color-foreground-on-page-default`
 * - `--color-foreground-state-disabled`
 *
 * @see [Reference](https://www.radix-ui.com/primitives/docs/components/label#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/label)
 */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn(labelVariants(), base, className)} {...props} />;
}

export { Label };
