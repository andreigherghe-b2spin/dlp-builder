import { menuRow } from "@/lib/utils";

// Every class the menu wears, in one file — the same place `Collapsible` and
// `Tabs` keep theirs, so a token move is one file to open rather than nine.
//
// The row is no longer one of them. These classes started life shared with
// `Select` and were split out on purpose: Figma had one menu node
// (`Select / Subcomponent / Menu`), a dropdown merely *looked* like it, and
// sharing on a resemblance meant the first dropdown-only change would move every
// select row in every brand — a regression in a signed-off primitive, delivered
// by a change meant to add a component. The comment here said the duplication
// ends "when the dropdown's own node exists… with a design to point at".
//
// It exists now (`🔵 DS Components` 3427:5416), and it settled the question the
// other way: the row is the same rectangle to the pixel, so it has moved back to
// `menuRow` in `src/lib/utils.ts` and `Select` reads the same constant.
//
// The panel did *not* move, because the two genuinely differ — see `panel`
// below.

/**
 * The panel: `--color-background-layout-surface` inside
 * `--color-border-neutral-subtle`, `--radius-offset4`, 4px of padding, and the
 * open/close transitions Radix drives off `data-state` and `data-side`.
 */
export const panel = `
  relative z-50
  flex flex-col gap-1
  min-w-45
  max-h-(--radix-dropdown-menu-content-available-height)
  origin-(--radix-dropdown-menu-content-transform-origin)
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
 * One row, and almost all of it is [`menuRow`](../../../lib/utils.ts) — the
 * shared rectangle `Select`'s menu draws too. That file carries the geometry,
 * the three washes, the disabled tone, and the reason a row has no focus ring.
 *
 * What is appended here is only what a select row has no use for: a dropdown row
 * carries arbitrary icons, where a select renders just the check it draws itself.
 * `:not([class*='size-'])` leaves an icon that was given a size alone.
 *
 * `data-inset:pl-9` survives the check moving to the trailing edge, because it
 * was never really about the check: 12px of padding plus a 16px leading icon
 * plus an 8px gap is the same 36px, so `inset` still lines a plain row up with
 * one that leads with an icon.
 */
export const row = `
  ${menuRow}

  [&_svg]:pointer-events-none
  [&_svg]:shrink-0
  [&_svg:not([class*='size-'])]:size-4

  data-inset:pl-9
  data-[variant=destructive]:text-foreground-feedback-negative
`;

/**
 * The wash a submenu's row keeps while its panel is open, so the path taken
 * through a nested menu stays visible.
 */
export const rowOpen =
  "data-[state=open]:bg-linear-[0deg,var(--color-background-state-hover)_0%,var(--color-background-state-hover)_100%]";

/**
 * Where a checked row's indicator sits: against the trailing edge, which is what
 * the node draws and what `SelectItem` already did. It used to be an
 * `absolute left-3` slot with the row indented `pl-9` to clear it; the design
 * puts the check on the right and the label on `flex-1`, so both the slot and
 * the indent are gone.
 *
 * `ItemIndicator` renders nothing when the row is unchecked, and with the
 * indicator trailing that no longer matters: an unchecked row's label starts at
 * the same 12px as a checked one, so ticking a row cannot shift its text
 * sideways. That was the one thing the old indent bought, and the trailing
 * position gives it for free.
 */
export const indicatorSlot = "ml-auto flex size-4 shrink-0 items-center justify-center";

/** The caption above a group. `SelectLabel`'s treatment — Figma draws one for both. */
export const label = `
  text-foreground-on-surface-muted
  data-inset:pl-9
  px-3 py-1.5
  text-(length:--typography-font-size-body-s)
  font-(--typography-font-weight-regular)
`;

/** The rule between groups. Negative margin so it spans the panel's padding. */
export const separator = "bg-border-neutral-subtle pointer-events-none -mx-1 my-1 h-px";

/** The shortcut hint against a row's trailing edge. */
export const shortcut = `
  text-foreground-on-surface-muted
  ml-auto tracking-widest
  text-(length:--typography-font-size-body-s)
`;
