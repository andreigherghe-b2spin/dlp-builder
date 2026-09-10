"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

import { CollapsibleProvider, type CollapsibleSize } from "@/molecules/Collapsible/lib/context";
import { collapsibleVariants } from "@/molecules/Collapsible/lib/utils";
import { TestIdProvider } from "@/lib/testId";
import { cn } from "@/lib/utils";

/**
 * A section that expands and collapses, built on Radix Collapsible and drawn from
 * Figma's `Collapsible` (`924:1837`).
 *
 * The root is the shell and the state — the parts are composed by the caller, which is
 * what makes the contents swappable: whatever goes in the row and in the panel is the
 * feature's own markup, with its own handlers and its own translations, and every part
 * takes its own `className`, so there is nothing here to reach past one part into
 * another with.
 *
 * `size` is the one prop that changes shape, because Figma's two sizes disagree about
 * six correlated things at once — the shell's radius and border, the label's type, the
 * icon size, the panel's fill, and *what is clickable*:
 *
 * | | `default` | `large` |
 * | --- | --- | --- |
 * | Clickable | the whole row (`CollapsibleTrigger`) | a 40×40 button in it (`CollapsibleToggle`) |
 * | Shell | `rounded-base`, no border | `rounded-offset16`, `border-1` |
 * | Label | `Label/Medium/Medium`, muted | `Body/Large/SemiBold`, default |
 * | Icons | 16px | 24px, chevron 20px |
 * | Panel | tinted inner box, 4px inset | bare, 16px padding |
 *
 * So the two compose differently, and that is deliberate rather than a leak: at
 * `default` there is nothing in the row but the disclosure, at `large` the row is a
 * place to put a badge, a count or a second control — none of which may live inside a
 * `<button>`.
 *
 * **They are for two different jobs**, which is the reading that makes the rest of the
 * table follow. `default` is a **menu row** — one entry in a list of them, which is why
 * the whole row is the target, why the label is muted until it is the current one, and
 * why `Selected` is a state this size has and `large` does not. `large` is a **section
 * of text** — a titled card you open to read, which is why the row around its toggle
 * stays inert and free to hold a count or a control, and why its label is `Body/Large`
 * rather than a label style.
 *
 * Controlled with `open` + `onOpenChange`, uncontrolled with `defaultOpen`. Both are
 * Radix's own props and behave the way they do everywhere else.
 *
 * @param {('default' | 'large')} [size='default'] - Which of Figma's two sizes to draw.
 * Read by every part through context, so it is set once here
 * @param {boolean} [open] - Whether the panel is expanded, when controlled
 * @param {boolean} [defaultOpen] - Whether the panel starts expanded, when uncontrolled
 * @param {(open: boolean) => void} [onOpenChange] - Called with the new state
 * @param {boolean} [disabled] - Turns the disclosure off. Radix marks every part it
 * owns `data-disabled` and disables the trigger button; the header reads the flag from
 * context, since it is not a Radix part
 * @param {string} [className] - Additional CSS classes for the shell. This is where a
 * width goes
 * @param {string} [data-testid] - Names the collapsible; every part derives its own id
 * from it — `-trigger`, `-header`, `-toggle`, `-label`, `-content`
 *
 * @remarks
 * **The toggle is named by the label.** The root mints one id, `CollapsibleLabel` wears
 * it and `CollapsibleToggle` points `aria-labelledby` at it, so the icon-only button at
 * `size="large"` announces the section it opens without the consumer passing the title
 * twice — once as text and once as an `aria-label` that has to be translated alongside
 * it. Passing an explicit `aria-label` to the toggle still wins.
 * @param {React.ComponentProps<typeof CollapsiblePrimitive.Root>} props - Props for the root element
 *
 * @example
 * ```tsx
 * // The compact size: the whole row toggles, so the row holds only the disclosure.
 * <Collapsible className="w-96" data-testid="order">
 *   <CollapsibleTrigger>
 *     <Home aria-hidden />
 *     <CollapsibleLabel>Order #4189</CollapsibleLabel>
 *     <Badge>New</Badge>
 *   </CollapsibleTrigger>
 *   <CollapsibleContent>
 *     <TypographyBody size="m">100 Market St, San Francisco</TypographyBody>
 *   </CollapsibleContent>
 * </Collapsible>
 * ```
 *
 * @example
 * ```tsx
 * // The large size: the header is inert and only the toggle button opens the panel,
 * // which is what lets a real control sit beside the label.
 * <Collapsible size="large" defaultOpen className="w-96">
 *   <CollapsibleHeader>
 *     <Home aria-hidden />
 *     <CollapsibleLabel>Recent activity</CollapsibleLabel>
 *     <Badge>3</Badge>
 *     <CollapsibleToggle aria-label="Show recent activity" />
 *   </CollapsibleHeader>
 *   <CollapsibleContent>…</CollapsibleContent>
 * </Collapsible>
 * ```
 *
 * @remarks
 * Requires `@ui/themes/config.css`. It defines `button-base`, which is every state the
 * trigger has — the `background/state/hover` and `background/state/pressed` overlays,
 * the `border/state/focus` ring, and the disabled reset. Figma's states for this
 * component are the same ones every other control uses, so they are one utility name
 * here rather than twenty classes. That file is already every brand app's one required
 * import.
 *
 * **The focus ring goes round the row, not the shell.** Figma draws it as a 4px
 * `border/state/focus` outline offset outside the header row and nothing else —
 * `924:4202` collapsed, `924:4209` open, where the panel below is left outside the
 * ring. That is `button-base`'s ring exactly, so it comes from the same utility every
 * other control in the system uses; the one liberty taken is its offset, 5px rather
 * than Figma's 4px, because a design system whose ring sits 1px tighter on one
 * component than on its buttons is worse than one that is uniformly 5px.
 *
 * Which is also why the shell does not clip: `overflow-hidden` is on the panel, where
 * a collapse animation would need it, rather than on the root where it would slice the
 * ring off. Figma's focus variants drop the root's `overflow-clip` for the same reason.
 *
 * At `large` the ring is the toggle `Button`'s own, which comes free.
 *
 * **The panel animates open and shut over 200ms**, height and padding together, from
 * the `collapsible-expand` / `collapsible-collapse` keyframes in
 * `@ui/themes/config.css`. Figma draws no motion for this component, so the duration
 * and easing are ours; they are short enough to read as a disclosure rather than a
 * transition. `prefers-reduced-motion` drops it, and the panel then opens and closes on
 * the same tick.
 *
 * The keyframes are in `config.css` rather than the optional `animations.css` because
 * this is the component's own chrome, like `button-base` — it must not depend on which
 * stylesheets a consumer happened to add. Worth knowing that `tw-animate-css`, which
 * Storybook loads and brand apps do not, ships its own `collapsible-down` / `-up`; the
 * names here differ so there is never a question of which definition is running, and
 * `Accordion.tsx` still depends on that package's `accordion-down` / `-up`, which means
 * its animation works in Storybook and silently does not anywhere else.
 *
 * @cssVariables
 * Component:
 * - `--animate-collapsible-expand`
 * - `--animate-collapsible-collapse`
 * - `--border-width-border-1`
 * - `--radius-base`
 * - `--radius-offset4`
 * - `--radius-offset16`
 *
 * Typography, through `labelVariants` and `bodyVariants`:
 * - `--typography-font-family`
 * - `--typography-font-size-label-m`
 * - `--typography-font-size-body-l`
 * - `--typography-font-weight-medium`
 * - `--typography-font-weight-semibold`
 *
 * Semantic colors:
 * - `--color-background-layout-surface`
 * - `--color-background-layout-surface-variant1`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-background-state-pressed`
 * - `--color-background-state-selected`
 * - `--color-border-neutral-subtle`
 * - `--color-border-state-focus`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-on-surface-muted`
 * - `--color-foreground-state-active`
 * - `--color-foreground-state-disabled`
 *
 * Through `Button`, for the `large` size's toggle:
 * - `--components-button-radius`
 *
 * @see [Reference](https://www.radix-ui.com/primitives/docs/components/collapsible#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/collapsible)
 */
function Collapsible({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & {
  size?: CollapsibleSize;
  /** Names the collapsible; every part derives its own id from this one. */
  "data-testid"?: string;
}) {
  // Minted here rather than in `CollapsibleLabel` because two parts have to agree on
  // it and neither can see the other: the label wears it, the toggle points at it.
  const labelId = React.useId();

  // `disabled` and `data-testid` are read off `props` rather than destructured.
  // `...props` is what carries the first to Radix and the second to the root, so taking
  // either would mean re-placing it by hand and having two mechanisms that can
  // disagree; the providers only republish what is already going where it belongs.
  return (
    <CollapsibleProvider
      value={{ size, disabled: props.disabled ?? false, labelId, hasRoot: true }}
    >
      <TestIdProvider value={props["data-testid"]}>
        <CollapsiblePrimitive.Root
          className={cn(collapsibleVariants({ size }), className)}
          {...props}
        />
      </TestIdProvider>
    </CollapsibleProvider>
  );
}

export { Collapsible };
