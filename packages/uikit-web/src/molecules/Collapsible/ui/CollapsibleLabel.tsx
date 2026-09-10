"use client";

import * as React from "react";

import { useCollapsible } from "@/molecules/Collapsible/lib/context";
import { collapsibleLabelVariants } from "@/molecules/Collapsible/lib/utils";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * The label in the row — Figma's `Label` text (`924:1914`, `924:5314`).
 *
 * Type and truncation only. The colour comes from the row above it, which is how
 * `selected` and `disabled` recolour the label and any icon beside it from one place
 * instead of each part re-deriving the state.
 *
 * Which type style is a consequence of `size` on the root, not a prop here:
 * `Label/Medium/Medium` at `default`, `Body/Large/SemiBold` at `large`. Both come from
 * [Typography](../../../atoms/Typography.tsx)'s own variant builders, so a
 * collapsible's label and a `TypographyLabel` cannot drift apart.
 *
 * It truncates rather than wrapping, which is Figma's own treatment, and it is what
 * keeps a long title from pushing the chevron off the end of the row. Override with
 * `className="whitespace-normal"` if a row is allowed to grow instead.
 *
 * Renders a `<span>`, and carries the id `CollapsibleToggle` names itself from — which
 * is why a `large` collapsible does not have to spell its title twice.
 *
 * **`asChild` is for the `large` size**, where the row is an inert `<div>` and a titled
 * section that opens is exactly what a heading is for:
 * `<CollapsibleLabel as="h3">…</CollapsibleLabel>`. It is not available in any
 * useful sense at `default`, where the label sits inside the trigger `<button>` and a
 * heading inside a button is not valid content.
 *
 * @param {React.ReactNode} children - The label text
 * @param {ElementType} [as='span'] - Element or component to render instead of a `<span>`,
 * keeping the type, the truncation and the id. For a heading at `size="large"`
 * @param {string} [className] - Additional CSS classes for the label
 * @param {string} [id] - Overrides the id the root minted. Needed only for a second
 * label in one collapsible, which would otherwise repeat the first one's
 * @param {string} [data-testid] - Replaces the id derived from the root's
 * @param {React.ComponentProps<'span'>} props - Props for the label element
 *
 * @example
 * ```tsx
 * <CollapsibleLabel>Order #4189</CollapsibleLabel>
 * <CollapsibleLabel className="whitespace-normal">A title allowed to wrap</CollapsibleLabel>
 *
 * // At size="large", where the row is not a button, the title can be a real heading.
 * <CollapsibleLabel as="h3">Recent activity</CollapsibleLabel>
 * ```
 *
 * @cssVariables
 * Typography:
 * - `--typography-font-family`
 * - `--typography-font-size-label-m` (at `size="default"`)
 * - `--typography-font-size-body-l` (at `size="large"`)
 * - `--typography-font-weight-medium`
 * - `--typography-font-weight-semibold`
 */
function CollapsibleLabel<T extends React.ElementType = "span">({
  as,
  className,
  "data-testid": testId,
  ...props
}: Omit<React.ComponentProps<T>, "as"> & { as?: T; "data-testid"?: string }) {
  const { labelId, size } = useCollapsible();
  const { testId: resolvedTestId } = usePartTestId("label", testId);
  // Resolved inline rather than through a helper: `react-hooks/static-components`
  // reads the expression that produces the component and cannot see through a call.
  const Component = as ?? "span";

  return (
    <Component
      className={cn(collapsibleLabelVariants({ size }), className)}
      data-testid={resolvedTestId}
      // Before `...props`, so a consumer with two labels in one collapsible can give
      // the second one an id of its own rather than repeating the first's.
      id={labelId}
      {...props}
    />
  );
}

export { CollapsibleLabel };
