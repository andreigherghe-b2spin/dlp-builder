import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * `display: contents` — the group generates **no box of its own**, and its slots
 * become flex items of the field's row directly.
 *
 * That is the whole trick, and it is what makes grouping free. A group used to be
 * a nested flex container, and a nested flex container does its own arithmetic:
 * it took half the row through `grow`, its slots capped at `max-w-18` before they
 * had spent it, and the difference stayed as slack on the group's trailing edge.
 * Measured at a 600px row: 108px of it, so the dash sat 108px from the group
 * before it and 8px from the group after it. Sizing the group to its content
 * instead only traded that for the boxes collapsing to 2px.
 *
 * With no box there is one flex context for the whole field, so every slot is the
 * same width whether it is grouped or not, every gap is the row's own `spacing/2`,
 * and the separator has exactly that on both sides — 8 and 8, by construction
 * rather than by two levels of rounding agreeing. It is also why any arrangement
 * works: 3+3, 2+2+2, 2+2 are all just six slots and some separators in one row.
 *
 * The cost is that there is nothing to style. `className` still lands, and can
 * still change what the slots inherit, but no padding, border or background will
 * render — an element with `display: contents` has no box to paint them on.
 */
const group = "contents";

/**
 * Groups slots so a separator can sit between them.
 *
 * **The design does not use this.** Figma draws six equal boxes with nothing
 * between, which is what `InputOTP` lays out on its own — so reach for a group
 * only when the code is genuinely read in parts, the way a `123-456` is, and
 * pair it with [InputOTPSeparator](./InputOTPSeparator.tsx).
 *
 * It groups and nothing else. It draws no box, takes no space and changes no
 * spacing: the slots inside are laid out by the field exactly as if they were
 * written directly in it, which is what keeps a grouped field identical to an
 * ungrouped one and the separator centred between its neighbours. Any number of
 * groups of any size works.
 *
 * Because it renders no box, this is also the one part with no derived
 * `data-testid` — there would be nothing to select, and a field with three groups
 * would emit the same id three times. A `data-testid` you pass yourself still
 * lands on the element.
 *
 * @param {string} [className] - Additional classes. Inherited values only —
 * `display: contents` means padding, borders and backgrounds will not render.
 *
 * @example
 * ```tsx
 * <InputOTPGroup>
 *   <InputOTPSlot index={0} />
 *   <InputOTPSlot index={1} />
 * </InputOTPGroup>
 * <InputOTPSeparator />
 * <InputOTPGroup>
 *   <InputOTPSlot index={2} />
 *   <InputOTPSlot index={3} />
 * </InputOTPGroup>
 * ```
 */
function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(group, className)} {...props} />;
}

export { InputOTPGroup };
