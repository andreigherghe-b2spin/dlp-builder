"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use client"
// directive only from the entry point — the ones on the files behind this barrel are
// dropped on the way into dist/. So the boundary is declared here, where the built
// consumer actually sees it. Every export below is client-only anyway: they render
// Radix primitives and read React context.

/**
 * The collapsible's single entry point: `@ui/web/Collapsible` resolves here, and
 * nothing outside this directory imports any deeper.
 *
 * `Collapsible` holds the state and the shell; everything else is a part the caller
 * composes, which is what makes the contents swappable and every piece separately
 * stylable — each part takes its own `className`, so there are no `*ClassName` props
 * here reaching past one part into another.
 *
 * **Which parts you use follows `size`.** Figma draws two sizes and they disagree about
 * what is clickable, so they are composed differently:
 *
 * ```tsx
 * // size="default" — the row is the button
 * <Collapsible>
 *   <CollapsibleTrigger>
 *     <Home aria-hidden />
 *     <CollapsibleLabel>Order #4189</CollapsibleLabel>
 *     <Badge>New</Badge>
 *   </CollapsibleTrigger>
 *   <CollapsibleContent>…</CollapsibleContent>
 * </Collapsible>
 *
 * // size="large" — the row is inert, a 40×40 button in it is the disclosure
 * <Collapsible size="large">
 *   <CollapsibleHeader>
 *     <Home aria-hidden />
 *     <CollapsibleLabel>Recent activity</CollapsibleLabel>
 *     <CollapsibleToggle aria-label="Show recent activity" />
 *   </CollapsibleHeader>
 *   <CollapsibleContent>…</CollapsibleContent>
 * </Collapsible>
 * ```
 *
 * `lib/` is internal — the size context the parts read — but the five `cva` builders
 * behind the parts are exported, the way `badgeVariants` and `buttonVariants` are: a
 * feature that has to draw a row this component does not cover should reach for the
 * same class list rather than respelling it and drifting on the next token move.
 *
 * ## Coming from the old `Collapsible.tsx`
 *
 * The three shadcn parts are still the three shadcn parts, with the same Radix props —
 * `open`, `defaultOpen`, `onOpenChange`, `disabled`. What changed is that they now draw
 * something: the old version forwarded props to Radix and set no classes at all, so
 * every call site rebuilt the row by hand.
 *
 * | before | now |
 * | --- | --- |
 * | `<CollapsibleTrigger asChild><Button icon>…` | `<CollapsibleTrigger>` is the row |
 * | the label was a `TypographyBody` at the call site | `CollapsibleLabel` |
 * | the panel was a `Card` at the call site | `CollapsibleContent` |
 * | `data-slot` on all three | `data-testid`, derived from the root's |
 *
 * `asChild` still works on the trigger for the case it is actually for — wrapping a
 * link or a control of your own.
 */
export {
  collapsibleContentVariants,
  collapsibleHeaderVariants,
  collapsibleLabelVariants,
  collapsibleTriggerVariants,
  collapsibleVariants,
} from "@/molecules/Collapsible/lib/utils";
export { Collapsible } from "@/molecules/Collapsible/ui/Collapsible";
export { CollapsibleContent } from "@/molecules/Collapsible/ui/CollapsibleContent";
export { CollapsibleHeader } from "@/molecules/Collapsible/ui/CollapsibleHeader";
export { CollapsibleLabel } from "@/molecules/Collapsible/ui/CollapsibleLabel";
export { CollapsibleToggle } from "@/molecules/Collapsible/ui/CollapsibleToggle";
export { CollapsibleTrigger } from "@/molecules/Collapsible/ui/CollapsibleTrigger";
export { type CollapsibleSize } from "@/molecules/Collapsible/lib/context";
