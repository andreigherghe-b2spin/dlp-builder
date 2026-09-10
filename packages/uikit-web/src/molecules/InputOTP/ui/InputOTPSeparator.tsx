"use client";

import * as React from "react";
import { Minus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Muted rather than the digits' colour: the separator marks a break in the code,
 * it is not part of it. Sized like the icon in any other control here.
 *
 * `size-4` on the box, not only on the glyph, and `shrink-0` with it. Without a
 * width of its own the box was sized by the icon inside it, so its own layout
 * rounding decided how much of the row it took and the `gap-2` either side of it
 * came out visibly uneven — one group sat closer to the dash than the other. A
 * definite 16px square makes both gaps exactly `spacing/2`, and `shrink-0` keeps
 * it that way on a narrow row, where the boxes are what should give.
 */
const separator = `
  flex size-4 shrink-0 items-center justify-center
  text-foreground-on-surface-muted
  [&_svg:not([class*='size-'])]:size-4
`;

/**
 * The dash between two [InputOTPGroup](./InputOTPGroup.tsx)s.
 *
 * **The design does not use this** — Figma's field is six equal boxes with
 * nothing between them. It is here for a code that is genuinely read in parts,
 * and for the fields that already draw one.
 *
 * `role="separator"` rather than `aria-hidden`, because the dash is part of how
 * the code is spoken. Pass `children` to replace the glyph with something else.
 *
 * Like the group, it derives no `data-testid`. A `12-34-56` field draws two of
 * these, and a name derived from the field's would be the same string on both —
 * one locator matching two elements, which is worse than no locator at all.
 * `role="separator"` is what addresses it, and a `data-testid` passed here lands
 * on the element as usual.
 *
 * @param {React.ReactNode} [children] - Replaces the dash.
 * @param {string} [className] - Additional CSS classes for the separator.
 *
 * @example
 * ```tsx
 * <InputOTPGroup>…</InputOTPGroup>
 * <InputOTPSeparator />
 * <InputOTPGroup>…</InputOTPGroup>
 * ```
 */
function InputOTPSeparator({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div role="separator" className={cn(separator, className)} {...props}>
      {children ?? <Minus aria-hidden />}
    </div>
  );
}

export { InputOTPSeparator };
