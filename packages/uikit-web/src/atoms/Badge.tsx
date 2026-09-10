import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { captionVariants, labelVariants } from "@/atoms/Typography";
import { cn } from "@/lib/utils";

// The two shapes are two Figma text styles, taken from the typography families
// rather than respelled here so the badge cannot drift from the type scale:
// `square` is `Caption/Medium - Uppercase`, `round` is `Label/Small/SemiBold`.
//
// Both bring their own `text-(length:…) … leading-none` in that order, which is
// load-bearing — see the note on `labelVariants`. It is also why the font family
// is not on `base`: every shape already carries it, and a `leading-none` placed
// up here would be cancelled by the size class that follows it.
const base = `
  inline-flex w-fit shrink-0 items-center justify-center gap-1
  h-5 py-0.5
  border border-solid
  whitespace-nowrap
  transition-colors
  outline-none
  focus-visible:ring-2
  focus-visible:ring-border-state-focus
  [&_svg]:pointer-events-none [&_svg]:shrink-0
  [&_svg:not([class*='size-'])]:size-3
`;

const config = {
  variants: {
    variant: {
      default: `
        bg-background-brand-accent1container
        border-border-brand-on-accent1container
        text-foreground-brand-on-accent1container
      `,
      secondary: `
        bg-background-brand-accent2container
        border-border-brand-on-accent2container
        text-foreground-brand-on-accent2container
      `,
      positive: `
        bg-background-feedback-positive-container
        border-border-feedback-positive
        text-foreground-feedback-on-positive-container
      `,
      negative: `
        bg-background-feedback-negative-container
        border-border-feedback-negative
        text-foreground-feedback-on-negative-container
      `,
      warning: `
        bg-background-feedback-warning-container
        border-border-feedback-warning
        text-foreground-feedback-on-warning-container
      `,
      informative: `
        bg-background-feedback-informative-container
        border-border-feedback-informative
        text-foreground-feedback-on-informative-container
      `,
      goldCoins: `
        bg-background-brand-gold-coins-container
        border-border-brand-on-gold-coins-container
        text-foreground-brand-on-gold-coins-container
      `,
      sweepstakesCoins: `
        bg-background-brand-sweepstakes-coins-container
        border-border-brand-on-sweepstakes-coins-container
        text-foreground-brand-on-sweepstakes-coins-container
      `,
    },
    shape: {
      square: cn(captionVariants(), "rounded-(--components-badge-radius) px-1"),
      round: cn(
        labelVariants({ size: "s", weight: "semibold" }),
        "min-w-5 rounded-full px-0 text-center",
      ),
    },
  },
  defaultVariants: {
    variant: "default",
    shape: "square",
  } as const,
};

const badgeVariants = cva(base, config);

/**
 * Displays a short status, category or count marker.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the badge
 * - @param {('default' | 'secondary' | 'positive' | 'negative' | 'warning' | 'informative' | 'goldCoins' | 'sweepstakesCoins')} [variant='default'] - The semantic color of the badge. `default` and `secondary` map to the brand accent 1 / accent 2 tokens; `goldCoins` and `sweepstakesCoins` are the two currency badges.
 * - @param {('square' | 'round')} [shape='square'] - `square` is the uppercase text badge; `round` is the pill used for counters
 * - @param {ElementType} [as='span'] - Element or component to render, with that component's props
 * - @param {React.ReactNode} children - The content to display inside the badge
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Badge>New</Badge>
 *
 * // With variant
 * <Badge variant="negative">Expired</Badge>
 *
 * // Counter
 * <Badge variant="negative" shape="round">9</Badge>
 *
 * // As a link
 * <Badge as="a" href="#">Promo</Badge>
 * ```
 *
 * @cssVariables
 * Component and typography:
 * - `--components-badge-radius`
 * - `--typography-font-family`
 * - `--typography-font-size-caption-m`
 * - `--typography-font-size-label-s`
 * - `--typography-font-weight-medium`
 * - `--typography-font-weight-semibold`
 *
 * Semantic colors:
 * - `--color-background-brand-accent1container`
 * - `--color-background-brand-accent2container`
 * - `--color-background-brand-gold-coins-container`
 * - `--color-background-brand-sweepstakes-coins-container`
 * - `--color-background-feedback-informative-container`
 * - `--color-background-feedback-negative-container`
 * - `--color-background-feedback-positive-container`
 * - `--color-background-feedback-warning-container`
 * - `--color-border-brand-on-accent1container`
 * - `--color-border-brand-on-accent2container`
 * - `--color-border-brand-on-gold-coins-container`
 * - `--color-border-brand-on-sweepstakes-coins-container`
 * - `--color-border-feedback-informative`
 * - `--color-border-feedback-negative`
 * - `--color-border-feedback-positive`
 * - `--color-border-feedback-warning`
 * - `--color-border-state-focus`
 * - `--color-foreground-brand-on-accent1container`
 * - `--color-foreground-brand-on-accent2container`
 * - `--color-foreground-brand-on-gold-coins-container`
 * - `--color-foreground-brand-on-sweepstakes-coins-container`
 * - `--color-foreground-feedback-on-informative-container`
 * - `--color-foreground-feedback-on-negative-container`
 * - `--color-foreground-feedback-on-positive-container`
 * - `--color-foreground-feedback-on-warning-container`
 *
 * @see [Documentation](https://ui.shadcn.com/docs/components/badge)
 */
type BadgeProps<T extends React.ElementType = "span"> = Omit<React.ComponentProps<T>, "as"> & {
  as?: T;
} & VariantProps<typeof badgeVariants>;

function Badge<T extends React.ElementType = "span">({
  className,
  variant,
  shape,
  as,
  ...props
}: BadgeProps<T>) {
  // Resolved inline rather than through a helper: `react-hooks/static-components`
  // reads the expression that produces the component and cannot see through a call.
  const Component = as ?? "span";

  return <Component className={cn(badgeVariants({ variant, shape, className }))} {...props} />;
}

export { Badge, badgeVariants, type BadgeProps };
