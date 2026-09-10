import type { AriaAttributes, ComponentProps, ElementType, MouseEvent } from "react";
import type { VariantProps } from "class-variance-authority";

import { labelVariants } from "@/atoms/Typography";
import { cn } from "@/lib/utils";

/**
 * A link is a type style plus a tone, and only the second half lives here.
 *
 * The type comes from [Typography](./Typography.tsx)'s `labelVariants` — Figma's
 * link is `Label - Underline/Large/Bold`, which that family already draws, down
 * to the `lineHeight: 1` that has no token to reference. Restating the size and
 * the weight here would put the scale in a second place and let a link fall
 * behind the next time the type moves.
 *
 * What is left is the part Typography deliberately has no opinion about:
 * `TypographyBody` "carries no colour of its own, so it takes the colour of
 * whatever it sits in", which is right for a paragraph and wrong for a control.
 * A link needs a colour and the four states Figma draws around it, and those are
 * what `tone` is. The set (`🔵 DS Components` 3370:17133) is exactly five:
 *
 * ```
 *            colour                          underline
 * Default    foreground/onSurface/Default    yes
 * Hover      foreground/onSurface/Default    no
 * Active     foreground/onSurface/Default    yes
 * Visited    foreground/onSurface/Muted      yes
 * Focus      foreground/onSurface/Default    no    + 4px ring
 * ```
 *
 * Disabled is not in that set — it is the kit's own addition, and it stays,
 * because a link the app has to switch off has to look switched off.
 *
 * The ring is 4px of `--color-border-state-focus` drawn 4px outside the text by
 * an `::after` rather than by `outline`, which is this node's `inset: -4px`: the
 * band sits flush against the text box. `Switch`, `Checkbox` and `StepperIcon`
 * draw the same 4px border a pixel further out (`-inset-1.25`), leaving a 1px
 * gap — right for a control with a border of its own to stand off from, and not
 * what this node asks for. An `::after` rather than a share of `button-base`,
 * which brings a background wash with it, and a link has no box to wash.
 *
 * Focus also *removes* the underline, which is the design being consistent
 * rather than the spec being odd: the underline is what marks a link at rest, so
 * both ways of engaging one drop it — the mouse through `hover`, the keyboard
 * through `focus-visible` — and `active` puts it back while the link is held
 * down. Tailwind orders `hover` < `focus-visible` < `active`, so the pressed
 * state beats the focused one on source order alone, with no specificity trick.
 *
 * `visited` is the one state here that is only ever the browser's to report, and
 * it is deliberately not a prop. `:visited` matches an `<a href>` the user has
 * already followed — a fact about their history, not about this render — so there
 * is nothing for a consumer to pass, and a `visited` prop would be a second,
 * disagreeing answer to a question the UA already answers. Two consequences fall
 * out of that and neither is a defect: browsers restrict `:visited` to colour
 * properties, and colour is the only thing this state changes; and
 * `getComputedStyle` always reports the *unvisited* value, so the state cannot be
 * asserted in a test or forced in a story. It is the one state on this component
 * with no shot in the visual suite.
 *
 * A link that is both visited and `aria-disabled` comes out disabled, which is
 * the right way round and is decided by nothing more than emission order:
 * Tailwind puts every `aria-*` variant after the pseudo-class variants, so
 * `aria-disabled:text-foreground-state-disabled` lands later in the sheet than
 * `visited:text-foreground-on-surface-muted` and wins between two equally
 * specific rules. Checked in the compiled sheet rather than assumed. If a
 * Tailwind upgrade ever reorders the two, the fix is to stack the variants
 * (`aria-disabled:visited:…`), which wins on specificity instead of on order —
 * not to drop one of the states.
 *
 * It also means **a story must not point a link at `href="#"`.** That resolves to
 * the document's own URL, and Chrome's partitioned-visited-links rules style a
 * link to the page you are already on as visited — so `#` would render every
 * link muted, in Storybook and in a baseline, for a reason nothing about the
 * story says. Point them at real paths.
 *
 * `aria-disabled` rather than `:disabled`: an `<a>` cannot be disabled, and the
 * whole point of this component is that it may not be an `<a>` at all. Tailwind's
 * built-in `aria-disabled:` variant compiles to `[aria-disabled="true"]`, so
 * `aria-disabled={false}` — which React serialises rather than drops — does not
 * fire it.
 */
const tone = `
  relative
  cursor-pointer
  text-foreground-on-surface-default
  underline-offset-2
  transition-all

  visited:text-foreground-on-surface-muted

  hover:no-underline
  focus-visible:no-underline
  active:underline

  outline-none
  focus-visible:after:pointer-events-none
  focus-visible:after:absolute
  focus-visible:after:-inset-1
  focus-visible:after:border-4
  focus-visible:after:border-solid
  focus-visible:after:border-border-state-focus
  focus-visible:after:content-['']

  aria-disabled:pointer-events-none
  aria-disabled:cursor-not-allowed
  aria-disabled:text-foreground-state-disabled
`;

/**
 * A link to where the user already is. It is a link state rather than a
 * breadcrumb one — `aria-current` is the standard way to say "you are here", and
 * the treatment is keyed on the same thing a screen reader reads, so the two
 * cannot disagree.
 *
 * It shares the muted colour with `visited` above and is not the same state:
 * visited is "you have been here before", current is "you are here now". The one
 * that separates them visually is the underline — a visited link keeps it,
 * because it is still somewhere to go; the current page drops it, because it is
 * not. Nothing has to arbitrate between the two: `:visited` needs an `<a href>`
 * to match at all, and the current crumb is a `<span>`.
 *
 * Applied from JS rather than through an `aria-[current]:` variant, and that is
 * the point rather than a shortcut. Tailwind's *arbitrary* aria variants match
 * on the attribute being **present**, and React serialises `aria-*` booleans
 * instead of dropping them — so `aria-current={item.href === pathname}` writes
 * `aria-current="false"` onto every other link in the list and `[aria-current]`
 * would style all of them as current. Deciding here means the class is on the
 * element only when the value genuinely says so.
 *
 * It appends to `tone` rather than fighting it: `cn()` resolves each conflicting
 * pair — the cursor, the colour, the resting underline and the pressed one — in
 * favour of the last class it sees, so nothing here depends on selector
 * specificity. There is deliberately no `focus-visible:` rule below: `tone`
 * already drops the underline there, so the current page needs nothing to say
 * about a state it agrees with.
 */
const currentTone = `
  cursor-default
  text-foreground-on-surface-muted
  no-underline
  hover:no-underline
  active:no-underline
`;

/**
 * What `aria-disabled` has to do to actually mean it.
 *
 * `pointer-events-none` stops the mouse and nothing else: an `<a href>` marked
 * `aria-disabled` stays in the tab order and Enter still follows it. Cancelling
 * the click is what closes that, and it is deliberately done by cancelling
 * rather than by removing the `href` — the element may be a router link, and
 * `next/link` takes `href` as a required prop, so handing it `undefined` breaks
 * exactly the `as` case this component exists for. Every router link worth the
 * name checks `defaultPrevented` before it navigates, and a bare `<a>` obeys it
 * outright.
 */
function preventNavigation(event: MouseEvent) {
  event.preventDefault();
}

/**
 * Whether an `aria-current` value means "this one".
 *
 * Every token — `page`, `step`, `location`, `date`, `time` — and `true` do;
 * `false` and the absent attribute do not. Written against the string as well as
 * the boolean because React renders both.
 */
function isCurrent(value: LinkProps["aria-current"]) {
  return value != null && value !== false && value !== "false";
}

/**
 * `aria-current` and `aria-disabled` are named here rather than left to
 * `ComponentProps<T>`, because the component reads both: a generic prop bag
 * cannot be indexed, so declaring them is what makes them legal to destructure.
 * That is the declaration's job, not documentation.
 */
type LinkProps<T extends ElementType = "a"> = Omit<ComponentProps<T>, "as"> & {
  as?: T;
} & Pick<AriaAttributes, "aria-current" | "aria-disabled"> &
  VariantProps<typeof labelVariants>;

/**
 * A navigational link.
 *
 * **`as` is the whole point of this component.** Nothing in these apps renders a
 * bare `<a>`: every brand has a `components/Link` of its own wrapping
 * `next/link`, and it is not decoration — it resolves the locale into the href,
 * starts the NProgress bar, and swaps external links for a delayed redirect that
 * keeps INP down. A design system that hard-codes `<a>` is a design system those
 * apps cannot use for navigation, so the element is a prop:
 *
 * ```tsx
 * import { Link as BrandLink } from "components/Link";
 *
 * <Link as={BrandLink} href="/slots">Slots</Link>
 * <Link as={NextLink} href="/slots">Slots</Link>
 * <Link href="https://example.com">A plain anchor, when that is all it is</Link>
 * ```
 *
 * `as` moves the element and nothing else — the type and the tone stay this
 * component's, and the props become the passed component's, so `as={BrandLink}`
 * offers `prefetch` and `language` while the default `"a"` does not.
 *
 * This is the same `as` [Typography](./Typography.tsx) takes, and for the same
 * reason it gives there: `asChild` was the older answer, and `as` covers the case
 * it existed for with one prop instead of a wrapper element that can quietly lose
 * a `className` or a handler. [Button](./Button.tsx) and [Badge](./Badge.tsx)
 * take the same prop for the same reason, and no component in the kit owns an
 * `asChild` prop any more. What is left of it is a Radix primitive's own —
 * `<DropdownMenuTrigger asChild>` and friends, where the *consumer* supplies the
 * element rather than naming it, which is a different question.
 *
 * The defaults are Figma's link — `Label - Underline/Large/Bold`, the variant
 * that node literally names `Size=Default`. `size`, `weight` and `underline` move
 * it onto any other step of the Label scale — but **most call sites should pass
 * none of the three.** They are the design's own defaults, so `<Link href="…">`
 * is already the link Figma draws, and every override is a step away from it.
 *
 * **A link in running text takes the paragraph's step of the scale.** Wrap the
 * copy in `TypographyBody` and let this sit inside it — the paragraph keeps its
 * own leading — and match the two names, which is mechanical because the Body and
 * Label scales share their px values:
 *
 * ```
 * paragraph              link
 * TypographyBody   l  16px   size="l"   ← the default, so pass nothing
 *                  m  14px   size="m"
 *                  s  12px   size="s"
 * ```
 *
 * Get that pairing wrong and the link reads as having slipped down the line even
 * though its baseline is exact to the pixel: `vertical-align: baseline` lines the
 * baselines up regardless, so what the eye catches is the smaller cap height, not
 * an offset. A 14px link in a 16px paragraph looks broken and measures perfect,
 * which is why it is worth stating rather than leaving to be rediscovered.
 *
 * **The node's five sizes are four, and its names are not these names.** Read it
 * off the type style rather than off the variant label, because the labels do not
 * line up with the scale they point at:
 *
 * ```
 * Figma variant   type style          px    size here
 * Size=xl         Label/ExtraLarge    18    "xl"
 * Size=lg         Label/Large         16    "l"
 * Size=Default    Label/Large         16    "l"   ← same style as lg
 * Size=sm         Label/Medium        14    "m"
 * Size=xs         Label/Small         12    "s"
 * ```
 *
 * So `lg` and `Default` are one size drawn twice, and a designer asking for `sm`
 * wants `size="m"`. Four `--typography-font-size-label-*` tokens exist and the
 * node uses all four, which is the whole scale — there is no fifth size to build
 * and no `label-xs` token to add.
 *
 * @param {ElementType} [as='a'] - Element or component to render, with that component's props
 * @param {('xl' | 'l' | 'm' | 's')} [size='l'] - Design size, from the Label scale
 * @param {('regular' | 'medium' | 'semibold' | 'bold')} [weight='bold'] - Defaults to `bold`
 * @param {boolean} [underline=true] - Underline the text. `false` actively removes it.
 * @param {('page' | 'step' | 'location' | 'date' | 'time' | boolean)} [aria-current] - Marks the link as where the user already is, and takes the muted, un-underlined treatment
 * @param {boolean} [aria-disabled] - Marks the link unavailable: the tab stop goes and the click is cancelled, so it is unavailable to the keyboard too. The `href` is kept, because a router link needs one.
 * @param {string} [className] - Additional CSS classes
 *
 * @example
 * ```tsx
 * <Link as={BrandLink} href="/promotions">Promotions</Link>
 * <Link size="m" weight="medium" href="/terms">Terms and conditions</Link>
 * <Link href="/locked" aria-disabled>Not yet</Link>
 * <Link as="span" aria-current="page">Where you are</Link>
 * ```
 *
 * @cssVariables
 * - `--typography-font-family`
 * - `--typography-font-size-label-{xl,l,m,s}`
 * - `--typography-font-weight-{regular,medium,semibold,bold}`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-on-surface-muted`
 * - `--color-foreground-state-disabled`
 * - `--color-border-state-focus`
 * - `--border-width-border-4`
 */
function Link<T extends ElementType = "a">({
  as,
  className,
  size = "l",
  underline = true,
  weight = "bold",
  "aria-current": ariaCurrent,
  "aria-disabled": ariaDisabled,
  ...props
}: LinkProps<T>) {
  // Resolved inline rather than through a helper: `react-hooks/static-components`
  // reads the expression that produces the component and cannot see through a call.
  const Component = as ?? "a";

  // The tab stop goes and the click is cancelled — see `preventNavigation`. The
  // focus ring is left visible rather than hidden for this state: a focusable
  // element with no indicator is worse than a disabled one, and hiding the ring
  // was papering over the fact that it was still reachable at all.
  const unreachable = ariaDisabled === true || ariaDisabled === "true";

  return (
    <Component
      className={cn(
        labelVariants({ size, weight, underline }),
        tone,
        isCurrent(ariaCurrent) && currentTone,
        className,
      )}
      {...props}
      aria-current={ariaCurrent}
      aria-disabled={ariaDisabled}
      {...(unreachable ? { onClick: preventNavigation, tabIndex: -1 } : {})}
    />
  );
}

export { Link, type LinkProps };
