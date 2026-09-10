import { Icon } from "@/components/ui/icon";
import { Typography, TypographyClassContext } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react-native";
import * as React from "react";
import { View } from "react-native";

const alertViewVariants = cva(
  "rounded-(--alert-border-radius) relative w-full border px-4 pb-2 pt-3.5",
  {
    variants: {
      variant: {
        default: "border-(--alert-default-border-color) bg-(--alert-default-background-color)",
        destructive:
          "border-(--alert-destructive-border-color) bg-(--alert-destructive-background-color)",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const alertTextVariants = cva("text-sm", {
  variants: {
    variant: {
      default: "text-(--alert-default-color)",
      destructive: "text-(--alert-destructive-color)",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const alertIconVariants = cva("size-4", {
  variants: {
    variant: {
      default: "text-(--alert-default-color)",
      destructive: "text-(--alert-destructive-icon-color)",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Displays a callout for user attention.
 *
 * @param {string} [className] - Additional CSS classes to apply to the alert
 * @param {('default' | 'destructive')} [variant='default'] - The visual style variant of the alert
 * @param {LucideIcon} icon - The icon component to display in the alert
 * @param {string} [iconClassName] - Additional CSS classes to apply to the icon
 *
 * @example
 * ```tsx
 * import { Alert, AlertTitle, AlertDescription } from '@ui/native/alert';
 * import { InfoIcon } from 'lucide-react-native';
 *
 * <Alert icon={InfoIcon}>
 *   <AlertTitle>Heads up!</AlertTitle>
 *   <AlertDescription>You can add components to your app using the cli.</AlertDescription>
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
 */
function Alert({
  className,
  variant,
  children,
  icon,
  iconClassName,
  ...props
}: React.ComponentProps<typeof View> &
  React.RefAttributes<View> &
  VariantProps<typeof alertViewVariants> & {
    icon: LucideIcon;
    iconClassName?: string;
  }) {
  return (
    <TypographyClassContext.Provider value={alertTextVariants({ variant })}>
      <View role="alert" className={cn(alertViewVariants({ variant }), className)} {...props}>
        <View className="absolute left-3.5 top-3">
          <Icon as={icon} className={cn(alertIconVariants({ variant }), iconClassName)} />
        </View>
        {children}
      </View>
    </TypographyClassContext.Provider>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<typeof Typography>) {
  return (
    <Typography
      className={cn("mb-1 ml-0.5 min-h-4 pl-6 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<typeof Typography>) {
  return (
    <Typography
      className={cn("ml-0.5 pb-1.5 pl-6 text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export {
  Alert,
  AlertDescription,
  AlertTitle,
  alertIconVariants,
  alertTextVariants,
  alertViewVariants,
};
