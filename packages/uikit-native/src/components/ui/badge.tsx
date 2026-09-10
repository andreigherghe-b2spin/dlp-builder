import { View, type ViewProps, Text, type TextProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const viewBase =
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border px-2 py-0.5 whitespace-nowrap";

const textBase = "font-sans text-xs font-medium";

const viewConfig = {
  variants: {
    variant: {
      default:
        "rounded-(--badge-default-border-radius) border-(length:--badge-default-border-width) border-(--badge-default-border-color) bg-(--badge-default-background-color)",
      secondary:
        "rounded-(--badge-secondary-border-radius) border-(length:--badge-secondary-border-width) border-(--badge-secondary-border-color) bg-(--badge-secondary-background-color)",
      destructive:
        "rounded-(--badge-destructive-border-radius) border-(length:--badge-destructive-border-width) border-(--badge-destructive-border-color) bg-(--badge-destructive-background-color)",
      outline:
        "rounded-(--badge-outline-border-radius) border-(length:--badge-outline-border-width) border-(--badge-outline-border-color) bg-(--badge-outline-background-color)",
    },
  },
  defaultVariants: {
    variant: "default",
  } as const,
};

const textConfig = {
  variants: {
    variant: {
      default: "text-(--badge-default-color)",
      secondary: "text-(--badge-secondary-color)",
      destructive: "text-(--badge-destructive-color)",
      outline: "text-(--badge-outline-color)",
    },
  },
  defaultVariants: {
    variant: "default",
  } as const,
};

const badgeViewVariants = cva(viewBase, viewConfig);
const badgeTextVariants = cva(textBase, textConfig);

/**
 * A component that displays a badge or a component that looks like a badge.
 *
 * @param {string} [className] - Additional CSS classes to apply to the badge
 * @param {('default' | 'secondary' | 'destructive' | 'outline')} [variant='default'] - The visual style variant of the badge
 * @param {React.ReactNode} children - The content to display inside the badge
 *
 * @example
 * ```tsx
 * import { Badge } from '@ui/native/badge';
 *
 * <Badge variant="default">Default</Badge>
 * <Badge variant="secondary">Secondary</Badge>
 * <Badge variant="destructive">Destructive</Badge>
 * <Badge variant="outline">Outline</Badge>
 * ```
 *
 * @cssVariables
 * - `--badge-default-border-radius`
 * - `--badge-default-border-width`
 * - `--badge-default-border-color`
 * - `--badge-default-background-color`
 * - `--badge-default-color`
 * - `--badge-secondary-border-radius`
 * - `--badge-secondary-border-width`
 * - `--badge-secondary-border-color`
 * - `--badge-secondary-background-color`
 * - `--badge-secondary-color`
 * - `--badge-destructive-border-radius`
 * - `--badge-destructive-border-width`
 * - `--badge-destructive-border-color`
 * - `--badge-destructive-background-color`
 * - `--badge-destructive-color`
 * - `--badge-outline-border-radius`
 * - `--badge-outline-border-width`
 * - `--badge-outline-border-color`
 * - `--badge-outline-background-color`
 * - `--badge-outline-color`
 */
function Badge({
  children,
  className,
  variant,
  ...props
}: Omit<ViewProps, "children"> &
  VariantProps<typeof badgeViewVariants> & {
    children: TextProps["children"];
  }) {
  return (
    <View data-slot="badge" className={cn(badgeViewVariants({ variant }), className)} {...props}>
      <Text className={badgeTextVariants({ variant })}>{children}</Text>
    </View>
  );
}

export { Badge, badgeViewVariants, badgeTextVariants };
