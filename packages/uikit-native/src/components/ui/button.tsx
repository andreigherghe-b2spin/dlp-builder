import { Pressable, type PressableProps, Text, type TextProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

const viewBase =
  "inline-flex shrink-0 items-center justify-center gap-2 transition-all whitespace-nowrap disabled:opacity-50";

const textBase = "font-sans text-(length:--button-font-size) font-(--button-font-weight)";

const viewConfig = {
  variants: {
    variant: {
      default:
        "bg-linear-[to_bottom,var(--button-default-background-color-start),var(--button-default-background-color-end)] border-(--button-default-border-color) border-(length:--button-default-border-width) rounded-(--button-default-border-radius) active:bg-linear-[to_bottom,var(--button-default-hover-background-color),var(--button-default-hover-background-color)] active:shadow-[0_0_20px_0_var(--button-default-hover-box-shadow-color)] disabled:bg-linear-[to_bottom,var(--button-default-disabled-background-color),var(--button-default-disabled-background-color)]",
      destructive:
        "bg-(--button-destructive-background-color) border-(--button-destructive-border-color) border-(length:--button-destructive-border-width) rounded-(--button-destructive-border-radius) shadow-xs active:bg-(--button-destructive-background-color)/90",
      outline:
        "bg-(--button-outline-background-color) border-(--button-outline-border-color) border-(length:--button-outline-border-width) rounded-(--button-outline-border-radius) shadow-xs active:bg-(--button-outline-hover-background-color) active:border-(--button-outline-hover-border-color)",
      secondary:
        "bg-linear-[to_bottom,var(--button-secondary-background-color-start),var(--button-secondary-background-color-end)] border-(--button-secondary-border-color) border-(length:--button-secondary-border-width) rounded-(--button-secondary-border-radius) active:bg-linear-[to_bottom,var(--button-secondary-hover-background-color),var(--button-secondary-hover-background-color)] active:shadow-[0_0_20px_0_var(--button-secondary-hover-box-shadow-color)]",
      ghost:
        "bg-(--button-ghost-background-color) border-(--button-ghost-border-color) border-(length:--button-ghost-border-width) rounded-(--button-ghost-border-radius) active:bg-(--button-ghost-hover-background-color) active:border-(--button-ghost-hover-border-color)",
      link: "bg-(--button-link-background-color) border-(--button-link-border-color) border-(length:--button-link-border-width) rounded-(--button-link-border-radius)",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 gap-1.5 px-3",
      lg: "h-10 px-6",
      icon: "size-9",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  } as const,
};

const textConfig = {
  variants: {
    variant: {
      default: "text-(--button-default-color) disabled:text-(--button-default-disabled-color)",
      destructive: "text-(--button-destructive-color)",
      outline: "text-(--button-outline-color)",
      secondary: "text-(--button-secondary-color)",
      ghost: "text-(--button-ghost-color)",
      link: "text-(--button-link-color) underline underline-offset-4",
    },
  },
  defaultVariants: {
    variant: "default",
  } as const,
};

const buttonViewVariants = cva(viewBase, viewConfig);
const buttonTextVariants = cva(textBase, textConfig);

/**
 * Displays a button or a component that looks like a button.
 *
 * @param {string} [className] - Additional CSS classes to apply to the button
 * @param {('default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link')} [variant='default'] - The visual style variant of the button
 * @param {('default' | 'sm' | 'lg' | 'icon')} [size='default'] - The size variant of the button
 * @param {React.ReactNode} children - The content to display inside the button
 *
 * @example
 * ```tsx
 * import { Button } from '@ui/native/button';
 *
 * <Button variant="default" size="lg">Default</Button>
 * <Button variant="destructive" size="lg">Destructive</Button>
 * <Button variant="outline" size="lg">Outline</Button>
 * <Button variant="secondary" size="lg">Secondary</Button>
 * <Button variant="ghost" size="lg">Ghost</Button>
 * <Button variant="link" size="lg">Link</Button>
 * ```
 *
 * @cssVariables
 * Base variables:
 * - `--button-font-size`
 * - `--button-font-weight`
 *
 * Default variant:
 * - `--button-default-background-color-start`
 * - `--button-default-background-color-end`
 * - `--button-default-border-color`
 * - `--button-default-border-radius`
 * - `--button-default-border-width`
 * - `--button-default-color`
 * - `--button-default-disabled-background-color`
 * - `--button-default-disabled-color`
 * - `--button-default-hover-background-color`
 * - `--button-default-hover-box-shadow-color`
 *
 * Secondary variant:
 * - `--button-secondary-background-color-start`
 * - `--button-secondary-background-color-end`
 * - `--button-secondary-border-color`
 * - `--button-secondary-border-radius`
 * - `--button-secondary-border-width`
 * - `--button-secondary-color`
 * - `--button-secondary-hover-background-color`
 * - `--button-secondary-hover-box-shadow-color`
 *
 * Destructive variant:
 * - `--button-destructive-background-color`
 * - `--button-destructive-color`
 * - `--button-destructive-border-color`
 * - `--button-destructive-border-radius`
 * - `--button-destructive-border-width`
 *
 * Outline variant:
 * - `--button-outline-background-color`
 * - `--button-outline-color`
 * - `--button-outline-border-color`
 * - `--button-outline-border-radius`
 * - `--button-outline-border-width`
 * - `--button-outline-hover-background-color`
 * - `--button-outline-hover-border-color`
 * - `--button-outline-hover-color`
 *
 * Ghost variant:
 * - `--button-ghost-background-color`
 * - `--button-ghost-color`
 * - `--button-ghost-border-color`
 * - `--button-ghost-border-radius`
 * - `--button-ghost-border-width`
 * - `--button-ghost-hover-background-color`
 * - `--button-ghost-hover-border-color`
 * - `--button-ghost-hover-color`
 *
 * Link variant:
 * - `--button-link-background-color`
 * - `--button-link-color`
 * - `--button-link-border-color`
 * - `--button-link-border-radius`
 * - `--button-link-border-width`
 * - `--button-link-hover-color`
 */
function Button({
  children,
  className,
  variant,
  size,
  ...props
}: VariantProps<typeof buttonViewVariants> &
  Omit<PressableProps, "children"> & {
    children: TextProps["children"];
  }) {
  return (
    <Pressable className={buttonViewVariants({ variant, size, className })} {...props}>
      <Text disabled={props.disabled ?? undefined} className={buttonTextVariants({ variant })}>
        {children}
      </Text>
    </Pressable>
  );
}

export { Button, buttonViewVariants, buttonTextVariants };
