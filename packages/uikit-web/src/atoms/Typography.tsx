import type { ComponentProps, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The type system is Figma's, one component per family (`🔴 DS Foundation`).
 * There is no `H1` or `H4` here on purpose: the design names a *style*, not a
 * heading level, so the level is the page's decision. Say which one you mean
 * with `as` — `<TypographyHeading size="xl" as="h1">` — and the markup stays
 * yours while the type stays the design's. `as` moves nothing but the tag: the
 * scale is `size` and `weight`, always.
 *
 * ```
 *                mobile   desktop   line height
 * Display  xl      56        80        1.29
 *          l       48        64        1.33
 *          m       40        48        1.4
 *          s       36        40        1.33
 * Heading  xl      28        32        1.43
 *          l       24        28        1.33
 *          m       22        24        1.45
 *          s       20        20        1.4
 *          xs      18        18        1.56
 * Body     l       16        16        1.5
 *          m       14        14        1.46
 *          s       12        12        1.46
 * Label    xl      18        18        1
 *          l       16        16        1
 *          m       14        14        1
 *          s       12        12        1
 * Caption  m       10        10        1
 * ```
 *
 * Checked against the `Mobile` and `Desktop` mode exports of the Figma variable
 * collection — every value above is the token's, not a transcription. The two
 * modes are the only ones the collection defines (`Min Width` 320 / 1024,
 * `Max Width` 1023 / 1535), which is what makes the single 1024px breakpoint
 * below the whole story.
 *
 * One size in the export has no component: `Body/XS` (10px). There is no
 * `--typography-font-size-body-xs` in any brand file yet, so it cannot be built
 * — add the token first.
 *
 * **Mobile and desktop need no code here.** The brand files redeclare the seven
 * sizes that grow inside `@media (min-width: 1024px)` — the same 64rem Tailwind
 * calls `lg` — so anything under 1024px gets the mobile column and anything at
 * or above it gets the desktop one, from the token alone. Line heights are
 * unitless and identical in both columns, so they follow the new size on their
 * own. Never add a `lg:` variant to a component here: it would pin one
 * breakpoint's value into a class and fight the token at the other.
 *
 * Line height and letter spacing have no token to reference — Figma keeps them
 * inside the composite text style (`Body/Large/Regular` = `Font(size: Body/L,
 * weight: Regular, lineHeight: 1.5, letterSpacing: 0)`), and a composite style
 * cannot be emitted as a CSS variable. Hence the arbitrary multipliers below,
 * and no `tracking-*` at all: every style on the page is `letterSpacing: 0`.
 */
const fontFamily = "font-(family-name:--typography-font-family)";

/** Shared by every family that is drawn in more than one weight. */
const weightVariants = {
  regular: "font-(--typography-font-weight-regular)",
  medium: "font-(--typography-font-weight-medium)",
  semibold: "font-(--typography-font-weight-semibold)",
  bold: "font-(--typography-font-weight-bold)",
} as const;

/**
 * `false` is a real value here, not the absence of one: it emits `no-underline`,
 * so the decoration is the design's decision rather than the user agent's. It
 * matters the moment a family renders an `<a>` — `as="a"` — or sits nested in
 * one: without it the browser underlines the text and the `Label - Underline`
 * style stops meaning anything. Pass `underline` to opt in.
 */
const underlineVariants = { true: "underline", false: "no-underline" } as const;

const displayVariants = cva(fontFamily, {
  variants: {
    size: {
      xl: "text-(length:--typography-font-size-display-xl) leading-[1.29]",
      l: "text-(length:--typography-font-size-display-l) leading-[1.33]",
      m: "text-(length:--typography-font-size-display-m) leading-[1.4]",
      s: "text-(length:--typography-font-size-display-s) leading-[1.33]",
    },
    weight: weightVariants,
  },
  defaultVariants: { size: "m", weight: "bold" },
});

const headingVariants = cva(fontFamily, {
  variants: {
    size: {
      xl: "text-(length:--typography-font-size-heading-xl) leading-[1.43]",
      l: "text-(length:--typography-font-size-heading-l) leading-[1.33]",
      m: "text-(length:--typography-font-size-heading-m) leading-[1.45]",
      s: "text-(length:--typography-font-size-heading-s) leading-[1.4]",
      xs: "text-(length:--typography-font-size-heading-xs) leading-[1.56]",
    },
    weight: weightVariants,
  },
  defaultVariants: { size: "m", weight: "semibold" },
});

const bodyVariants = cva(fontFamily, {
  variants: {
    size: {
      l: "text-(length:--typography-font-size-body-l) leading-[1.5]",
      m: "text-(length:--typography-font-size-body-m) leading-[1.46]",
      s: "text-(length:--typography-font-size-body-s) leading-[1.46]",
    },
    weight: weightVariants,
    underline: underlineVariants,
  },
  defaultVariants: { size: "l", weight: "regular", underline: false },
});

/**
 * Every `Label` style is `lineHeight: 1`, which is what `leading-none` sets.
 * `underline` is its own family in Figma (`Label - Underline`) rather than a
 * modifier, but it changes nothing except the decoration, so it is a prop.
 */
const labelVariants = cva(fontFamily, {
  variants: {
    // `leading-none` rides along with each size rather than sitting on the base:
    // tailwind-merge treats `text-*` as a font-size *and* line-height utility
    // (`text-base/7` is one class), so a `text-(length:…)` emitted after a
    // `leading-*` silently cancels it. Same reason the other families keep the
    // pair together.
    size: {
      xl: "text-(length:--typography-font-size-label-xl) leading-none",
      l: "text-(length:--typography-font-size-label-l) leading-none",
      m: "text-(length:--typography-font-size-label-m) leading-none",
      s: "text-(length:--typography-font-size-label-s) leading-none",
    },
    weight: weightVariants,
    underline: underlineVariants,
  },
  defaultVariants: { size: "m", weight: "medium", underline: false },
});

/**
 * The design draws exactly one Caption style — `Medium - Uppercase` — so there
 * is nothing to vary. It is still a `cva` like the rest of the page so that
 * `captionVariants` can be reused the way [Label](./label.tsx) reuses
 * `labelVariants`, instead of the classes being respelled at the call site.
 *
 * `leading-none` sits after `text-(length:…)` for the same tailwind-merge reason
 * spelled out on `labelVariants` above — the order is load-bearing.
 *
 * `weight` is a variant here like it is on the other four families, because the
 * family is drawn in more than one: the DS Components tooltip
 * (`🔵 DS Components` 3176:2701) uses `Caption/Bold - Uppercase`, whose composite
 * style names `Typography/FontWeight/Bold`. `medium` stays the default, which is
 * the single weight this emitted before the variant existed.
 */
const captionVariants = cva(
  `${fontFamily} text-(length:--typography-font-size-caption-m) uppercase leading-none`,
  {
    variants: { weight: weightVariants },
    defaultVariants: { weight: "medium" },
  },
);

/**
 * Polymorphic in `T`, so the props really are the rendered element's: `as="a"`
 * offers `href`, `as="h2"` does not, and `ref` is typed for whatever comes out.
 * Each family pins the default — `T` only moves when a call site passes `as`, so
 * every existing call site keeps exactly the props and the element it had.
 *
 * `ComponentProps` rather than `ComponentPropsWithoutRef` on purpose: these
 * families took a `ref` through `...props` before `as` existed (React 19 passes
 * it as a plain prop), and dropping it from the type would break call sites that
 * hold one.
 *
 * `as` is removed from the element's own props so that an element carrying an
 * `as` attribute of its own — `<link as="style">` — cannot collide with this one.
 *
 * **There is no `asChild` on these five.** It was the previous answer to the
 * same question, and `as` covers it — including the case it existed for: `as`
 * takes a component as readily as a tag, so a router link is `as={Link}
 * href="/x"` where it used to be a slot wrapped around a `<Link>`. One prop
 * instead of a wrapper element, and no merge step that can quietly lose a
 * `className` or a handler. `Link`, `Button` and `Badge` have since taken the
 * same prop for the same reason, and no component here owns an `asChild` prop
 * any more; what is left of it is a Radix primitive's own, where the *consumer*
 * supplies the element rather than names it.
 *
 * Each family resolves the element inline — `as ?? tag` — rather than through a
 * shared helper: `react-hooks/static-components` reads the expression that
 * produces the component and cannot see through a call.
 */
type TypographyProps<T extends ElementType> = Omit<ComponentProps<T>, "as"> & {
  as?: T;
};
type TypographyDisplayProps<T extends ElementType = "div"> = TypographyProps<T> &
  VariantProps<typeof displayVariants>;
type TypographyHeadingProps<T extends ElementType = "div"> = TypographyProps<T> &
  VariantProps<typeof headingVariants>;
type TypographyBodyProps<T extends ElementType = "p"> = TypographyProps<T> &
  VariantProps<typeof bodyVariants>;
type TypographyLabelProps<T extends ElementType = "span"> = TypographyProps<T> &
  VariantProps<typeof labelVariants>;
type TypographyCaptionProps<T extends ElementType = "span"> = TypographyProps<T> &
  VariantProps<typeof captionVariants>;

/**
 * The largest type in the system — hero and marketing scale, four sizes, all
 * four weights. Every size grows at 1024px, so this is the family that changes
 * most between mobile and desktop.
 *
 * Renders a `<div>`, because a display style carries no document semantics of
 * its own — say which element you mean with `as`.
 *
 * @param {'xl' | 'l' | 'm' | 's'} [size] - Design size. Defaults to `m`.
 * @param {'regular' | 'medium' | 'semibold' | 'bold'} [weight] - Defaults to `bold`.
 * @param {ElementType} [as] - Element or component to render instead of the
 * `<div>`, with that element's props. The tag and nothing else: it never moves
 * `size` or `weight`, because the level is the page's decision and the scale is
 * the design's.
 *
 * @example
 * ```tsx
 * <TypographyDisplay size="xl" as="h1">Win big tonight</TypographyDisplay>
 * ```
 *
 * @cssVariables
 * - `--typography-font-family`
 * - `--typography-font-size-display-{xl,l,m,s}`
 * - `--typography-font-weight-{regular,medium,semibold,bold}`
 */
function TypographyDisplay<T extends ElementType = "div">({
  as,
  children,
  className,
  size,
  weight,
  ...props
}: TypographyDisplayProps<T>) {
  const Component = as ?? "div";

  return (
    <Component className={cn(displayVariants({ size, weight, className }))} {...props}>
      {children}
    </Component>
  );
}

/**
 * Section type, five sizes. `xl`, `l` and `m` grow at 1024px; `s` and `xs` are
 * the same on both.
 *
 * Renders a `<div>` by default — pick the heading level yourself with `as`,
 * since the design says how big a heading is, not how deep it sits. A `<div>` is
 * a safe default and a silent one: it leaves the text out of the document
 * outline, so a section title wants `as="h2"` (or the level the page needs)
 * rather than the default.
 *
 * @param {'xl' | 'l' | 'm' | 's' | 'xs'} [size] - Design size. Defaults to `m`.
 * @param {'regular' | 'medium' | 'semibold' | 'bold'} [weight] - Defaults to `semibold`.
 * @param {ElementType} [as] - Element or component to render instead of the
 * `<div>`, with that element's props. The tag and nothing else: `as="h2"` does
 * not imply a size, and a size does not imply a level.
 *
 * @example
 * ```tsx
 * <TypographyHeading size="l" as="h2">Today's winners</TypographyHeading>
 * <TypographyHeading size="xs" as="h3" weight="semibold">Live now</TypographyHeading>
 * ```
 *
 * @cssVariables
 * - `--typography-font-family`
 * - `--typography-font-size-heading-{xl,l,m,s,xs}`
 * - `--typography-font-weight-{regular,medium,semibold,bold}`
 */
function TypographyHeading<T extends ElementType = "div">({
  as,
  children,
  className,
  size,
  weight,
  ...props
}: TypographyHeadingProps<T>) {
  const Component = as ?? "div";

  return (
    <Component className={cn(headingVariants({ size, weight, className }))} {...props}>
      {children}
    </Component>
  );
}

/**
 * Running text — the `Body` family, three sizes, identical on mobile and
 * desktop. Renders a `<p>`.
 *
 * Carries no colour of its own, so it takes the colour of whatever it sits in.
 * That is what lets [TextField](./textField.tsx) recolour its helper line per
 * state without fighting the component.
 *
 * @param {'l' | 'm' | 's'} [size] - Design size. Defaults to `l` (16px).
 * @param {'regular' | 'medium' | 'semibold' | 'bold'} [weight] - Defaults to `regular`.
 * @param {boolean} [underline] - Underline the text, for body links. Defaults to
 * `false`, which actively removes the decoration — an `<a>` rendered with
 * `as="a"` is not underlined unless you ask for it.
 * @param {ElementType} [as] - Element or component to render instead of the
 * `<p>`, with that element's props. The tag and nothing else — it never moves
 * the scale.
 *
 * @example
 * ```tsx
 * <TypographyBody>Body text at 16px.</TypographyBody>
 * <TypographyBody size="s" weight="medium">Helper text at 12px.</TypographyBody>
 * <TypographyBody as="a" href="/terms" underline>Terms</TypographyBody>
 * <TypographyBody as={Link} href="/terms">Terms</TypographyBody>
 * ```
 *
 * @note Do not set size or weight through `className` — the props are what keep
 * a paragraph on the scale.
 *
 * @cssVariables
 * - `--typography-font-family`
 * - `--typography-font-size-body-{l,m,s}`
 * - `--typography-font-weight-{regular,medium,semibold,bold}`
 */
function TypographyBody<T extends ElementType = "p">({
  as,
  children,
  className,
  size,
  weight,
  underline,
  ...props
}: TypographyBodyProps<T>) {
  const Component = as ?? "p";

  return (
    <Component className={cn(bodyVariants({ size, weight, underline, className }))} {...props}>
      {children}
    </Component>
  );
}

/**
 * Interface type — what sits on buttons, chips and form labels. Four sizes,
 * the same on mobile and desktop, and always `lineHeight: 1`, which is what
 * keeps a label centred in a control rather than padded by its own leading.
 *
 * Renders a `<span>`. For a form label bound to a control, reach for
 * [Label](./label.tsx) instead — it is this style plus the Radix wiring.
 *
 * @param {'xl' | 'l' | 'm' | 's'} [size] - Design size. Defaults to `m` (14px).
 * @param {'regular' | 'medium' | 'semibold' | 'bold'} [weight] - Defaults to `medium`.
 * @param {boolean} [underline] - The `Label - Underline` styles from Figma.
 * Defaults to `false`, which actively removes the decoration rather than
 * inheriting it — see `underlineVariants`.
 * @param {ElementType} [as] - Element or component to render instead of the
 * `<span>`, with that element's props. The tag and nothing else — it never moves
 * the scale.
 *
 * @example
 * ```tsx
 * <TypographyLabel size="l" weight="bold">Play now</TypographyLabel>
 * <TypographyLabel underline as="a" href="/help">Need help?</TypographyLabel>
 * ```
 *
 * @cssVariables
 * - `--typography-font-family`
 * - `--typography-font-size-label-{xl,l,m,s}`
 * - `--typography-font-weight-{regular,medium,semibold,bold}`
 */
function TypographyLabel<T extends ElementType = "span">({
  as,
  children,
  className,
  size,
  weight,
  underline,
  ...props
}: TypographyLabelProps<T>) {
  const Component = as ?? "span";

  return (
    <Component className={cn(labelVariants({ size, weight, underline, className }))} {...props}>
      {children}
    </Component>
  );
}

/**
 * The smallest type: 10px, uppercase, in one size. `weight` is a prop while
 * `size` is not — the design draws the family at a single size but in more than
 * one weight, `Caption/Bold - Uppercase` among them — and the uppercasing is
 * part of the style rather than something a caller opts into.
 *
 * @param {('regular' | 'medium' | 'semibold' | 'bold')} [weight='medium'] - Font weight
 * @param {ElementType} [as] - Element or component to render instead of the
 * `<span>`, with that element's props. The tag and nothing else — `as` moves no
 * part of the style.
 *
 * @example
 * ```tsx
 * <TypographyCaption>New</TypographyCaption>
 * <TypographyCaption weight="bold">Steps 1 of 5</TypographyCaption>
 * ```
 *
 * @cssVariables
 * - `--typography-font-family`
 * - `--typography-font-size-caption-m`
 * - `--typography-font-weight-regular`
 * - `--typography-font-weight-medium`
 * - `--typography-font-weight-semibold`
 * - `--typography-font-weight-bold`
 */
function TypographyCaption<T extends ElementType = "span">({
  as,
  children,
  className,
  weight,
  ...props
}: TypographyCaptionProps<T>) {
  const Component = as ?? "span";

  return (
    <Component className={cn(captionVariants({ weight, className }))} {...props}>
      {children}
    </Component>
  );
}

export {
  TypographyBody,
  TypographyCaption,
  TypographyDisplay,
  TypographyHeading,
  TypographyLabel,
  bodyVariants,
  captionVariants,
  displayVariants,
  headingVariants,
  labelVariants,
};
