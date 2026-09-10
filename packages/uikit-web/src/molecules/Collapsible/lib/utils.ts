import { cva } from "class-variance-authority";

import { bodyVariants, labelVariants } from "@/atoms/Typography";
import { cn } from "@/lib/utils";

// Every class list below is a plain `const`, and each `cva()` is handed identifiers
// rather than literals. That is the same split [Button](../../../atoms/Button.tsx) makes
// and for the same reason: `cva` is in `.prettierrc`'s `tailwindFunctions`, so a string
// written inside the call is sorted and folded onto one line — 200 characters of class
// names with nowhere to hang the comment explaining any of them.

/**
 * The shell. A column, because the header and the panel stack, and the gap between
 * them is what the two sizes disagree on: `default` sets the panel 4px below the row
 * it belongs to (Figma's `spacing/1`), `large` butts them together and lets the
 * header's own 16px padding do the spacing.
 *
 * `min-h-10` rather than `h-10` — the row inside is what has a height, and pinning the
 * shell would clip a panel that is taller than its content.
 *
 * Nothing clips here, deliberately: the trigger's focus ring is drawn outside its box,
 * and an `overflow-hidden` on the shell would slice it off. Figma's focus variants drop
 * the root's own `overflow-clip` for exactly that reason. The panel carries the clip
 * instead, where a collapse animation would need it.
 */
const shell = `
  flex w-full min-h-10 flex-col
  bg-background-layout-surface
`;

/**
 * `large` is the bordered card: `border/neutral/subtle` at `border-1`, and a
 * `rounded-offset16` that is nearly twice `default`'s `rounded-base`. It is also the
 * only size that goes flat when disabled — Figma repaints the whole card in
 * `background/state/disabled` (`924:6970`), where `default` keeps its surface and only
 * fades the text (`924:3914`). `data-disabled` is Radix's own attribute on the root, so
 * nothing has to be threaded down for this.
 */
const shellBySize = {
  default: `
    gap-1
    rounded-base
  `,
  large: `
    gap-0
    rounded-offset16
    border-solid
    border-(length:--border-width-border-1)
    border-border-neutral-subtle
    data-[disabled]:bg-background-state-disabled
  `,
};

/**
 * The full-width disclosure row — Figma's `Size=Default`, where the row *is* the
 * button.
 *
 * `button-base` (in `@ui/themes/config.css`) is doing most of the work, and it is the
 * reason there are no hover, pressed, focus or disabled classes spelled out here:
 * Figma's states for this component are the same `background/state/*` overlays and the
 * same `border/state/focus` ring every other control in the system uses, and that
 * utility already draws them. Borrowing it also keeps the overlays as a
 * `background-image` over the surface rather than a `background-color` replacing it,
 * which is what a half-transparent token like `background/state/hover` needs.
 *
 * `relative` is not decoration: the focus ring `button-base` draws is an absolutely
 * positioned `::after`, and it needs a positioned ancestor to be 5px outside *this* box
 * rather than 5px outside the page. Around this box is where Figma puts it too — its
 * `Focus` layer is a child of the header row at `inset: -4px` (`924:4346`, `924:4348`),
 * so an open collapsible rings the row and leaves the panel below it outside the ring.
 *
 * `[&>svg]:size-4` sizes whatever icon the consumer puts in the row without them having
 * to know the number, and stops at the row's own children so the chevron's explicit
 * size is untouched. The rotation is keyed on `data-collapsible-chevron` rather than on
 * `svg:last-child` so that it keeps working when a consumer appends something of their
 * own.
 */
const trigger = `
  button-base
  relative flex w-full min-h-10 items-center gap-2
  px-3 py-2
  rounded-base
  cursor-pointer
  text-left
  text-foreground-on-surface-muted
  transition-colors
  [&>svg]:size-4
  [&[data-state=open]>[data-collapsible-chevron]]:rotate-180
  disabled:text-foreground-state-disabled
`;

/**
 * Figma's sixth state (`924:3626`) — a row marked as the current one, which is
 * orthogonal to whether it is open.
 *
 * The overlay is deliberately an *unprefixed* `bg-linear-`, so that `button-base`'s
 * `:hover` and `:active` rules — one specificity class higher, being pseudo-classes —
 * always win over it regardless of which is emitted first. Hovering a selected row
 * therefore shows the hover overlay, which is what Figma implies by drawing no
 * `Selected + Hover` variant.
 */
const triggerSelected = `
  bg-linear-[0deg,var(--color-background-state-selected)_0%,var(--color-background-state-selected)_100%]
  text-foreground-state-active
`;

/**
 * The inert header row — Figma's `Size=Large` container (`924:5310`).
 *
 * Inert is the point. At this size Figma paints the hover overlay on the 40×40 button
 * alone (`924:6038`), which is the design saying the rest of the row is not a click
 * target: it is where a badge, a count, a menu or a second control goes, and any of
 * those inside a `<button>` would be a nested interactive element.
 *
 * `[&>svg]:size-6` is the 24px icon this size draws, and it reaches only the row's own
 * children — the chevron inside `CollapsibleToggle` is `Button`'s 20px and is left
 * alone.
 */
const header = `
  flex w-full items-center gap-2
  p-4
  text-foreground-on-surface-default
  [&>svg]:size-6
  [&>svg]:shrink-0
`;

/**
 * The panel.
 *
 * `default` puts the content in a tinted inner box — `background/layout/surfaceVariant1`
 * at `rounded-offset4` with a 4px inset (`924:1842`); `large` has no fill of its own and
 * simply pads by 16px to line up with the header above it (`924:5143`).
 *
 * `overflow-hidden` is what makes the height animation look like anything: the content
 * keeps its full height throughout and the box slides down over it, rather than the
 * text reflowing on every frame.
 *
 * The animation itself is a 200ms height-and-padding keyframe pair from
 * `@ui/themes/config.css`, driven by `--radix-collapsible-content-height`, which Radix
 * measures onto this element. Figma draws no motion for this component, so the duration
 * and the easing are ours rather than the design's — deliberately short enough to read
 * as a disclosure rather than a transition. `motion-reduce:animate-none` drops it
 * entirely, and Radix then unmounts on the same tick because it waits on a running
 * animation and there is none.
 *
 * **`[&[hidden]]:hidden` is load-bearing, and it must key on the attribute rather than
 * on `data-state`.** Radix does not unmount a closed panel — it needs the node to
 * measure — so it hides it with a `hidden` attribute and relies on the UA's
 * `[hidden] { display: none }`, which the `display: flex` above outranks. But it sets
 * that attribute only once the exit animation has finished, while `data-state="closed"`
 * is on the element for the whole of it. Keying on `data-state` therefore hides the
 * panel on the first frame of closing and the collapse is never seen; keying on
 * `hidden` hides it exactly when Radix says it is gone.
 */
const content = `
  flex w-full flex-col gap-1
  overflow-hidden
  [&[hidden]]:hidden
  data-[state=open]:animate-collapsible-expand
  data-[state=closed]:animate-collapsible-collapse
  motion-reduce:animate-none
`;

// The radius is `default`'s alone: it is the tinted inner box that has corners to
// round, and `large` has no fill at all. In the base it was inert at `large` and read
// as shared, which is the one thing the split above is meant to prevent.
const contentBySize = {
  default: `
    p-1
    rounded-offset4
    bg-background-layout-surface-variant1
  `,
  large: "p-4",
};

const collapsibleVariants = cva(shell, {
  variants: { size: shellBySize },
  defaultVariants: { size: "default" },
});

const collapsibleTriggerVariants = cva(trigger, {
  variants: { selected: { true: triggerSelected, false: "" } },
  defaultVariants: { selected: false },
});

const collapsibleHeaderVariants = cva(header, {
  variants: { disabled: { true: "text-foreground-state-disabled", false: "" } },
  defaultVariants: { disabled: false },
});

/**
 * The label. Only type and truncation live here — the colour comes from the row above
 * it, so that `selected` and `disabled` recolour the label and any icon beside it from
 * one place instead of each part re-deriving the state.
 *
 * The two type styles are taken from [Typography](../../../atoms/Typography.tsx)'s own
 * variant builders rather than respelled, so a collapsible's label and a
 * `TypographyLabel` cannot drift apart on the next token move. `Label/Medium/Medium` at
 * `default`, `Body/Large/SemiBold` at `large` — Figma's names, both.
 *
 * `min-w-0` is what makes `truncate` work at all: a flex item refuses to shrink below
 * its content without it, so the label would push the chevron off the end of the row
 * instead of ellipsising.
 */
const collapsibleLabelVariants = cva("min-w-0 truncate", {
  variants: {
    size: {
      default: cn(labelVariants({ size: "m", weight: "medium" })),
      large: cn(bodyVariants({ size: "l", weight: "semibold" })),
    },
  },
  defaultVariants: { size: "default" },
});

const collapsibleContentVariants = cva(content, {
  variants: { size: contentBySize },
  defaultVariants: { size: "default" },
});

export {
  collapsibleContentVariants,
  collapsibleHeaderVariants,
  collapsibleLabelVariants,
  collapsibleTriggerVariants,
  collapsibleVariants,
};
