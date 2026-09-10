"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn, createTestIdFor } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * `button-base` (in `@ui/themes/config.css`) carries the chrome no variant, size
 * or consumer `className` ever reaches: the hover/active state overlay, the
 * focus ring, and the disabled and icon resets. Eighteen classes, and about
 * half the rendered markup by weight, for one.
 *
 * `no-underline` sits here rather than in each of the six non-link variants
 * because `as` makes the root whatever the caller named, and an `<a>` arrives
 * already underlined by the UA sheet — a `default` button rendered as a link
 * came out underlined for that reason alone. The `link` variant's own
 * `underline` still wins: `cn()` joins base before the variant and twMerge
 * keeps the last class of the `text-decoration` group. Which is also why
 * `buttonVariants()` is only ever called inside a `cn()` — raw, Tailwind emits
 * `.no-underline` after `.underline` and the base would win instead.
 */
const base = `
  button-base
  cursor-pointer
  relative inline-flex shrink-0 items-center justify-center
  whitespace-nowrap
  border-border-neutral-default
  border-(length:--components-button-border)
  rounded-(--components-button-radius)
  font-(family-name:--typography-font-family)
  font-(--typography-font-weight-bold)
  no-underline
  transition-all
  disabled:border-transparent
  disabled:bg-background-state-disabled
  disabled:text-foreground-state-disabled
`;

const config = {
  variants: {
    variant: {
      default: `
        bg-background-brand-primary-container
        text-foreground-brand-on-primary-container
      `,
      secondary: `
        bg-background-brand-secondary-container
        text-foreground-brand-on-secondary-container
      `,
      destructive: `
        bg-background-feedback-negative-container
        text-foreground-feedback-on-negative-container
      `,
      outline: `
        bg-transparent
        text-foreground-on-surface-default
        disabled:bg-transparent
        disabled:border-border-neutral-default
      `,
      overlay: `
        bg-background-layout-surface-overlay
        border-0
        text-foreground-on-surface-default
      `,
      ghost: `
        bg-transparent
        border-0
        text-foreground-on-surface-default
      `,
      link: `
        bg-transparent
        border-0
        rounded-none
        text-foreground-on-surface-default
        underline
        underline-offset-2
        hover:no-underline
        active:underline
        disabled:bg-transparent
      `,
    },
    size: {
      xs: `
        h-6 min-w-6 gap-1 px-3
        has-[>svg:first-child]:pl-2
        has-[>svg:last-child]:pr-2
        text-(length:--typography-font-size-label-s)
        leading-none
        [&_svg:not([class*='size-'])]:size-3
      `,
      sm: `
        h-8 min-w-8 gap-1 px-3
        has-[>svg:first-child]:pl-2
        has-[>svg:last-child]:pr-2
        text-(length:--typography-font-size-label-m)
        leading-none
        [&_svg:not([class*='size-'])]:size-4
      `,
      default: `
        h-10 min-w-10 gap-2 px-4
        has-[>svg:first-child]:pl-2
        has-[>svg:last-child]:pr-2
        text-(length:--typography-font-size-label-l)
        leading-none
        [&_svg:not([class*='size-'])]:size-5
      `,
      lg: `
        h-12 min-w-12 gap-2 px-5
        has-[>svg:first-child]:pl-3
        has-[>svg:last-child]:pr-3
        text-(length:--typography-font-size-label-l)
        leading-none
        [&_svg:not([class*='size-'])]:size-5
      `,
      xl: `
        h-14 min-w-14 gap-2 px-6
        has-[>svg:first-child]:pl-4
        has-[>svg:last-child]:pr-4
        text-(length:--typography-font-size-label-xl)
        leading-none
        [&_svg:not([class*='size-'])]:size-6
      `,
    },
    icon: {
      true: `
        aspect-square p-0
        has-[>svg:first-child]:pl-0
        has-[>svg:last-child]:pr-0
      `,
      false: "",
    },
  },
  compoundVariants: [
    {
      variant: "link" as const,
      size: "xs" as const,
      className: "h-3 min-w-0 gap-1 px-1 has-[>svg:first-child]:pl-0 has-[>svg:last-child]:pr-0",
    },
    {
      variant: "link" as const,
      size: "sm" as const,
      className: "h-4 min-w-0 gap-1 px-1 has-[>svg:first-child]:pl-0 has-[>svg:last-child]:pr-0",
    },
    {
      variant: "link" as const,
      size: "default" as const,
      className: "h-5 min-w-0 gap-2 px-2 has-[>svg:first-child]:pl-0 has-[>svg:last-child]:pr-0",
    },
    {
      variant: "link" as const,
      size: "lg" as const,
      className: "h-5 min-w-0 gap-2 px-2 has-[>svg:first-child]:pl-0 has-[>svg:last-child]:pr-0",
    },
    {
      variant: "link" as const,
      size: "xl" as const,
      className: "h-6 min-w-0 gap-2 px-2 has-[>svg:first-child]:pl-0 has-[>svg:last-child]:pr-0",
    },
    {
      variant: "link" as const,
      icon: true,
      className: "px-0",
    },
  ],
  defaultVariants: {
    variant: "default",
    size: "default",
    icon: false,
  } as const,
};

const buttonVariants = cva(base, config);

// Declared above the component's JSDoc rather than between it and the function.
// `scripts/reindex-uikit-docs.js` attaches the last comment it saw to the next
// function it finds, so the one-line `/** Names the button … */` inside this type
// would otherwise become `Button`'s entire entry in `ai-docs.json` — which is
// exactly what it did, silently, for one release of this branch.
type ButtonProps<T extends React.ElementType = "button"> = Omit<React.ComponentProps<T>, "as"> & {
  as?: T;
  isLoading?: boolean;
  /** Names the button; the spinner becomes `<testId>-spinner`. */
  "data-testid"?: string;
} & VariantProps<typeof buttonVariants>;

/**
 * Displays a button or a component that looks like a button.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the button
 * - @param {('default' | 'secondary' | 'destructive' | 'outline' | 'overlay' | 'ghost' | 'link')} [variant='default'] - The visual style variant of the button
 * - @param {('xs' | 'sm' | 'default' | 'lg' | 'xl')} [size='default'] - The size variant of the button
 * - @param {boolean} [icon=false] - Draws the icon-only shape: square, no padding, at whichever `size` is set. Give the button an `aria-label` — there is no text to name it.
 * - @param {ElementType} [as='button'] - Element or component to render, with that component's props. An `<a>` rendered this way is not underlined unless `variant="link"`.
 * - @param {boolean} [isLoading=false] - When true, a spinner replaces the leading icon and `aria-busy` is set
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 *
 * // With variant and size
 * <Button variant="destructive" size="lg">Delete</Button>
 *
 * // Icon-only. `icon` is its own axis, so the variant and the size stay free:
 * // 24, 32, 40, 48 and 56px squares, in any of the seven variants.
 * <Button icon size="lg" variant="ghost" aria-label="Close">
 *   <X />
 * </Button>
 *
 * @cssVariables
 * Component and typography:
 * - `--components-button-border`
 * - `--components-button-radius`
 * - `--border-width-border-4`
 * - `--typography-font-family`
 * - `--typography-font-weight-bold`
 * - `--typography-font-size-label-s`
 * - `--typography-font-size-label-m`
 * - `--typography-font-size-label-l`
 * - `--typography-font-size-label-xl`
 *
 * Semantic colors:
 * - `--color-background-brand-primary-container`
 * - `--color-background-brand-secondary-container`
 * - `--color-background-feedback-negative-container`
 * - `--color-background-layout-surface-overlay`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-background-state-pressed`
 * - `--color-border-neutral-default`
 * - `--color-border-state-focus`
 * - `--color-foreground-brand-on-primary-container`
 * - `--color-foreground-brand-on-secondary-container`
 * - `--color-foreground-feedback-on-negative-container`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-state-disabled`
 *
 * @see [Documentation](https://ui.shadcn.com/docs/components/button)
 */
function Button<T extends React.ElementType = "button">({
  children,
  className,
  variant,
  size,
  icon,
  as,
  isLoading = false,
  "data-testid": testId,
  ...props
}: ButtonProps<T>) {
  // Resolved inline rather than through a helper: `react-hooks/static-components`
  // reads the expression that produces the component and cannot see through a call.
  const Component = as ?? "button";

  // Destructured and put back rather than read off `props` and left to the
  // spread, which is what the rest of the kit does. A generic prop bag cannot be
  // indexed by a string, so reading it is what forces the destructure here; the
  // attribute still reaches the root exactly once.
  const testIdFor = createTestIdFor(testId);

  return (
    <Component
      aria-busy={isLoading || undefined}
      className={cn(buttonVariants({ variant, size, icon, className }))}
      data-testid={testId}
      {...props}
    >
      {isLoading ? (
        <Loader2
          data-icon="inline-start"
          data-testid={testIdFor("spinner")}
          className="animate-spin"
        />
      ) : null}
      {children}
    </Component>
  );
}

export { Button, buttonVariants, type ButtonProps };
