"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDownIcon } from "lucide-react";

import { useCollapsible } from "@/molecules/Collapsible/lib/context";
import { Button, type ButtonProps } from "@/atoms/Button";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * The 40×40 disclosure button that sits in a `CollapsibleHeader` — Figma's
 * `Size=Large` `Button` (`924:5315`).
 *
 * It is a real [Button](../../../atoms/Button.tsx) in its `ghost` variant with the
 * `icon` shape. That shape is its own axis rather than a size, so the size stays at the
 * default `h-10` and `aspect-square` takes the width from it: 40×40 with a 20px glyph
 * and `--components-button-radius` — Figma's measurements exactly, so there is nothing
 * to re-derive here. That also means its
 * hover, pressed, focus and disabled states are the button's own, which is what Figma
 * draws (`924:6038`, `924:6574`, `924:6834`, `924:6970`).
 *
 * `ml-auto` lives here rather than on the row, so the toggle lands at the right edge
 * whatever else the header holds.
 *
 * Icon-only, so it has no name from its own content — Radix supplies `aria-expanded`
 * and `aria-controls`, which say *what state it is in*, not what it controls.
 *
 * **It names itself from the `CollapsibleLabel` beside it**, through an id the root
 * minted for both of them, so the section's title does the job and there is no second
 * string to translate in step with the first. That is the normal case and it needs
 * nothing from the caller.
 *
 * The two ways out, in order: pass an `aria-label` when the button means something the
 * title does not say, which suppresses the link to the label; and if there is no
 * `CollapsibleLabel` in the row at all, the `aria-labelledby` resolves to nothing and
 * the browser falls back to `Toggle section`. That fallback is a last resort for an
 * untranslated case, not a good default — a row with no title should pass an
 * `aria-label`.
 *
 * @param {string} [aria-label] - Overrides the name taken from the `CollapsibleLabel`.
 * Translate it. Only needed when the button means something the title does not say
 * @param {React.ReactNode} [children] - Replaces the chevron
 * @param {string} [className] - Additional CSS classes for the button
 * @param {string} [data-testid] - Replaces the id derived from the root's
 * @param {ButtonProps} props - Props for the button
 *
 * @example
 * ```tsx
 * // Named "Recent activity" by the label beside it — nothing to pass.
 * <CollapsibleHeader>
 *   <CollapsibleLabel>Recent activity</CollapsibleLabel>
 *   <CollapsibleToggle />
 * </CollapsibleHeader>
 *
 * // Named by hand, for a button that means more than the title says.
 * <CollapsibleToggle aria-label={t("activity.toggle")} />
 * ```
 *
 * @cssVariables
 * Inherited from [Button](../../../atoms/Button.tsx)'s `ghost` variant.
 */
function CollapsibleToggle({
  "aria-label": ariaLabel,
  children,
  className,
  "data-testid": testId,
  ...props
}: ButtonProps & { "data-testid"?: string }) {
  const { labelId } = useCollapsible();
  const { testId: resolvedTestId, testIdFor } = usePartTestId("toggle", testId);

  // Both are emitted, and which one wins is the accessible-name algorithm's job:
  // `aria-labelledby` is consulted first and, when it resolves to nothing — no
  // `CollapsibleLabel` in the row — the browser falls through to `aria-label`. A
  // caller's own label suppresses the link entirely, since they are saying the title
  // is not the name they want.
  const labelledBy = ariaLabel ? undefined : labelId;

  return (
    <CollapsiblePrimitive.Trigger asChild>
      <Button
        aria-label={ariaLabel ?? "Toggle section"}
        aria-labelledby={labelledBy}
        // The rotation is keyed on the button's own `data-state`, which Radix sets on
        // whatever `asChild` renders. `>svg` reaches the chevron because `Button` puts
        // its children directly in the element.
        className={cn("ml-auto shrink-0 [&[data-state=open]>svg]:rotate-180", className)}
        data-testid={resolvedTestId}
        icon
        type="button"
        variant="ghost"
        {...props}
      >
        {children ?? (
          <ChevronDownIcon
            aria-hidden
            className="transition-transform duration-200"
            data-testid={testIdFor("chevron")}
          />
        )}
      </Button>
    </CollapsiblePrimitive.Trigger>
  );
}

export { CollapsibleToggle };
