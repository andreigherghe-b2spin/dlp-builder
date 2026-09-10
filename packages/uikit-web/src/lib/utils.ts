import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createTestIdFor(testId?: string) {
  return (part: string) => (testId != null ? `${testId}-${part}` : undefined);
}

/**
 * The 48px field box. Figma draws one rectangle for every text-shaped control —
 * `Input`'s `<input>` and `Select`'s trigger are the same box down to the focus
 * and disabled treatments — so the rules they share live here rather than in two
 * copies that drift apart on the next token move.
 *
 * A component appends what only it has: the caret and `file:` rules for `Input`,
 * the open-menu state and the chevron for `Select`. Append, never prepend —
 * `cn()` resolves a conflict in favour of the last class it sees.
 */
export const fieldBox = `
  flex w-full
  h-12 px-4 py-1
  transition-all
  outline-none

  border-solid
  border-(length:--components-textfield-border)
  rounded-(--components-textfield-radius)

  font-(family-name:--typography-font-family)
  font-(--typography-font-weight-medium)
  text-(length:--typography-font-size-label-m)

  bg-background-layout-surface-variant1
  bg-linear-[0deg,transparent_0%,transparent_100%]
  border-border-neutral-default
  text-foreground-on-surface-default

  focus-visible:border-border-state-active
  focus-visible:shadow-[inset_0_0_0_1px_var(--color-border-state-active)]

  aria-invalid:border-border-feedback-negative
  aria-invalid:focus-visible:border-border-feedback-negative
  aria-invalid:focus-visible:shadow-[inset_0_0_0_1px_var(--color-border-feedback-negative)]

  disabled:pointer-events-none
  disabled:cursor-not-allowed
  disabled:border-border-neutral-subtle
  disabled:bg-linear-[0deg,var(--color-background-state-disabled)_0%,var(--color-background-state-disabled)_100%]
  disabled:text-foreground-state-disabled
  disabled:aria-invalid:border-border-neutral-subtle
`;

/**
 * The label row above a field box: the label, and Figma's optional "Link"
 * pushed to the far edge. `height/h-4` is a floor rather than a height, so the
 * row keeps its 16px even when only one of the two is in it.
 *
 * Shared for the same reason as `fieldBox` — `TextField` and `TextareaField`
 * draw the identical row, and the horizontal variant is this plus its two
 * alignment classes.
 */
export const fieldLabelRow = "flex min-h-4 items-center gap-2";

/**
 * That "Link", once `buttonVariants({ variant: 'link', size: 'sm' })` has
 * dressed it: sized to the row rather than to a button, and following the
 * field's `group`/`data-disabled` because it is not a DOM sibling of the
 * control and so can never see `peer-disabled`.
 */
export const fieldActionLink = `
  h-4 min-w-0 px-1
  group-data-[disabled=true]:pointer-events-none
  group-data-[disabled=true]:text-foreground-state-disabled
`;

/**
 * One row of a popup menu: 32px tall, `Label/Medium/Regular`, `Radius/base`.
 *
 * Shared by `Select`'s menu and `DropdownMenu`, and the sharing was deliberately
 * held open until a drawing could settle it rather than a resemblance. `Select`
 * had the only menu node in Figma for a long time, so the dropdown kept its own
 * copy of these classes on purpose: shared too early, the first dropdown-only
 * change would have moved every select row in every brand — a regression in a
 * signed-off primitive, delivered by a change meant to add a component.
 *
 * The dropdown's own node has landed (`🔵 DS Components` 3427:5416) and settles
 * it: the row is the same rectangle. Height (`height/h-8`), padding
 * (`spacing/3`), gap (`spacing/2`), radius (`Radius/base`), the type scale, all
 * three washes, the disabled tone, the trailing check and the truncation are
 * each what `Select` already drew — measured, not eyeballed. So the two copies
 * become one here, and a token move is one file rather than two that drift.
 *
 * What is **not** shared is the panel around the rows, because there the two
 * genuinely differ: `Select`'s is pinned to its trigger's width and stacks rows
 * flush, a dropdown's sizes to its content and leaves `spacing/1` between them,
 * and each reads its own `--radix-*` variables. Those stay in the two components.
 *
 * The type is spelled out rather than taken from `labelVariants`, and that is
 * this file's constraint rather than a preference: `Typography` imports `cn`
 * from here, so importing it back would be a cycle, and a top-level `cva()` call
 * across one would land in its own TDZ. `fieldBox` above spells its type out for
 * the same reason. `labelVariants` is still where the values are decided —
 * `Label/M` is 14px at `leading-none` — so the two change together.
 *
 * Radix marks both the hovered row and the keyboard-navigated one with
 * `data-highlighted`, so the two cannot be told apart, and Figma draws them the
 * same anyway. A highlighted row beats a checked one, which is why the selected
 * wash is guarded with `not-data-[highlighted]` rather than left to the cascade.
 *
 * **There is no focus ring on a row, and that is not an omission.** Figma's node
 * draws one (`State=Focus`), but it cannot be expressed here: Radix focuses a
 * row on `pointerenter`, and Chromium then matches `:focus-visible` on it —
 * measured — so a `focus-visible:` ring would light up on every row the mouse
 * passes over, which is the hover state, not the focus one. Nothing in CSS
 * separates the two. `data-highlighted` is the visible indicator instead: it
 * tracks the roving focus, so keyboard navigation stays legible without a ring.
 *
 * `truncate` is **not** here, and must not be added: on a flex row it clips
 * without an ellipsis and pushes the trailing icon out of the box — measured.
 * It belongs on a `min-w-0 flex-1 truncate` wrapper around the label, which is
 * what `SelectItem` and the dropdown's indicator rows each render.
 */
export const menuRow = `
  relative flex w-full min-w-0 items-center gap-2
  h-8 px-3
  cursor-pointer select-none
  rounded-base
  outline-none

  font-(family-name:--typography-font-family)
  font-(--typography-font-weight-regular)
  text-(length:--typography-font-size-label-m)
  leading-none
  text-foreground-on-surface-default

  bg-background-layout-surface
  bg-linear-[0deg,transparent_0%,transparent_100%]

  not-data-[highlighted]:data-[state=checked]:bg-linear-[0deg,var(--color-background-state-selected)_0%,var(--color-background-state-selected)_100%]
  data-[highlighted]:bg-linear-[0deg,var(--color-background-state-hover)_0%,var(--color-background-state-hover)_100%]
  active:bg-linear-[0deg,var(--color-background-state-pressed)_0%,var(--color-background-state-pressed)_100%]

  data-[state=checked]:font-(--typography-font-weight-semibold)

  data-[disabled]:pointer-events-none
  data-[disabled]:text-foreground-state-disabled
  data-[disabled]:bg-linear-[0deg,transparent_0%,transparent_100%]
`;

/**
 * The label inside a `menuRow`, and all three classes are load-bearing.
 *
 * Figma draws the row's label as `flex-1` with the check against the trailing
 * edge, and this is the only shape that produces it. `truncate` on the row
 * itself does not: on a flex container it clips the text with no ellipsis *and*
 * pushes the trailing icon out of the box — a 160px row measured 258px of
 * content with the icon outside it. `min-w-0` is what lets the wrapper shrink
 * below its content at all, since a flex item's floor is `min-content` by
 * default and a long word would otherwise hold the row open.
 *
 * So a menu row that owns its own label renders one of these around it. A row
 * whose children are the caller's composition — `DropdownMenuItem`, which may
 * hold an icon, a `DropdownMenuShortcut` with its own `ml-auto`, or anything
 * else — deliberately does not get one, because wrapping arbitrary children
 * would capture the trailing element into the truncating box.
 */
export const menuRowLabel = "min-w-0 flex-1 truncate";
