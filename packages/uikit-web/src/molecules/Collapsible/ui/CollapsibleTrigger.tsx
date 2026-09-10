"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDownIcon } from "lucide-react";

import { useSizedFor } from "@/molecules/Collapsible/lib/context";
import { collapsibleTriggerVariants } from "@/molecules/Collapsible/lib/utils";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * The full-width disclosure row — Figma's `Size=Default` (`924:1838`), where the whole
 * row is the button.
 *
 * It draws the chevron itself, at the end of the row, and rotates it when the panel
 * opens. Everything before it is yours: an icon, a `CollapsibleLabel`, a `Badge`, in
 * whatever order you write them. The chevron is pushed to the right edge by `ml-auto`,
 * which is what lets a badge sit *next to* the label rather than being flung across the
 * row — Figma's own layout (`924:1913`).
 *
 * An icon passed as a direct child is sized for you (16px at this size), so a call site
 * does not carry the number.
 *
 * `asChild` renders the row as your own element — an `<a>` for a row that is also a
 * link — and the chevron is composed *into* it, so the whole row stays one target.
 *
 * **At `size="large"` use `CollapsibleHeader` + `CollapsibleToggle` instead.** Figma
 * paints the hover overlay on the button alone at that size (`924:6038`), which is the
 * design saying the rest of the row is not a click target — and a badge or a menu in
 * the row could not be one anyway inside a `<button>`. Using this part there warns in
 * development: it renders, and it draws the compact size's 16px icons and colours
 * inside the large size's bordered card, which is nearly right and therefore easy to
 * ship.
 *
 * @param {React.ReactNode} children - What goes in the row before the chevron
 * @param {boolean} [selected=false] - Figma's `Selected` state (`924:3626`): the row is
 * the current one in a list. Orthogonal to whether the panel is open, and reflected as
 * `data-selected` for styling and tests. Hovering still shows the hover overlay, which
 * is why Figma draws no `Selected + Hover` variant
 * @param {string} [className] - Additional CSS classes for the row
 * @param {string} [data-testid] - Replaces the id derived from the root's, for the rare
 * case of two triggers in one collapsible
 * @param {React.ComponentProps<typeof CollapsiblePrimitive.Trigger>} props - Props for the trigger
 *
 * @example
 * ```tsx
 * <CollapsibleTrigger>
 *   <Home aria-hidden />
 *   <CollapsibleLabel>Order #4189</CollapsibleLabel>
 *   <Badge>New</Badge>
 * </CollapsibleTrigger>
 * ```
 *
 * @example
 * ```tsx
 * // A row in a list, with the current one marked. `selected` is not `open`.
 * <CollapsibleTrigger selected={id === currentId}>
 *   <CollapsibleLabel>{title}</CollapsibleLabel>
 * </CollapsibleTrigger>
 * ```
 *
 * @cssVariables
 * See [Collapsible](./collapsible.tsx). The states come from `button-base`.
 */
function CollapsibleTrigger({
  children,
  className,
  selected = false,
  // Destructured, unlike everywhere else in this package: what lands on the element is
  // derived from the base the root published, so it is not the value `...props` holds.
  "data-testid": testId,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger> & {
  selected?: boolean;
  "data-testid"?: string;
}) {
  useSizedFor("default", "CollapsibleTrigger");
  const { testId: resolvedTestId, testIdFor } = usePartTestId("trigger", testId);

  // One icon rotated rather than Figma's two, which are `ChevronDown` and `ChevronUp` —
  // the same glyph mirrored. Named by what it is so the rotation rule in
  // `collapsibleTriggerVariants` can find it without depending on it being the last
  // child.
  const chevron = (
    <ChevronDownIcon
      aria-hidden
      className="ml-auto shrink-0 transition-transform duration-200"
      data-collapsible-chevron=""
      data-testid={testIdFor("chevron")}
    />
  );

  // The trigger always has two children — the caller's and the chevron — and `asChild`
  // reaches Radix through `...props`, whose `Slot` then requires exactly one. So the
  // chevron is composed into the caller's element here instead.
  //
  // `Slottable` is the usual answer and does not work in this file. Radix recognises it
  // by a `Symbol("radix.slottable")` created per copy of `@radix-ui/react-slot`, and
  // this tree has two: the one `@ui/web` depends on, and the one nested under
  // `react-collapsible`'s own `react-primitive`. A `Slottable` imported here is an
  // unrecognised child over there, so the trigger throws exactly as it did without one.
  // `Button` can use `Slottable` because it owns its `Slot` too, from the same copy.
  const content =
    props.asChild && React.isValidElement<{ children?: React.ReactNode }>(children) ? (
      React.cloneElement(children, undefined, children.props.children, chevron)
    ) : (
      <>
        {children}
        {chevron}
      </>
    );

  return (
    <CollapsiblePrimitive.Trigger
      className={cn(collapsibleTriggerVariants({ selected }), className)}
      // Emitted rather than kept in the class list alone, so a consumer can style and a
      // test can assert on the state. Omitted when false: an attribute that is always
      // present says nothing.
      data-selected={selected || undefined}
      data-testid={resolvedTestId}
      {...props}
    >
      {content}
    </CollapsiblePrimitive.Trigger>
  );
}

export { CollapsibleTrigger };
