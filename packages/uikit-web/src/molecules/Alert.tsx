import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "rounded-(--alert-border-radius) border-1 relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 border-solid px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default:
          "border-(--alert-default-border-color) bg-(--alert-default-background-color) text-(--alert-default-color)",
        destructive:
          "border-(--alert-destructive-border-color) bg-(--alert-destructive-background-color) text-(--alert-destructive-color) [&>svg]:text-(--alert-destructive-icon-color)",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Displays a callout for user attention.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the alert
 * - @param {('default' | 'destructive')} [variant='default'] - The visual style variant of the alert
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Alert>
 *   <AlertIcon>
 *   <AlertTitle>Heads up!</AlertTitle>
 *   <AlertDescription>You can add components to your app using the cli.</AlertDescription>
 * </Alert>
 *
 * // Destructive variant
 * <Alert variant="destructive">
 *   <AlertIcon>
 *   <AlertTitle>Error</AlertTitle>
 *   <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
 * </Alert>
 * ```
 *
 * @cssVariables
 * - `--alert-border-radius`
 * - `--alert-default-border-color`
 * - `--alert-default-background-color`
 * - `--alert-default-color`
 * - `--alert-destructive-border-color`
 * - `--alert-destructive-background-color`
 * - `--alert-destructive-color`
 * - `--alert-destructive-icon-color`
 *
 * @see [Documentation](https://ui.shadcn.com/docs/components/alert)
 */
function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

/**
 * The title component for the Alert.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the title
 */
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

/**
 * The description component for the Alert.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the description
 */
function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("col-start-2 grid justify-items-start gap-1", className)}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle };
