import { View, type ViewProps, Text, type TextProps } from "react-native";

import { cn } from "@/lib/utils";

/**
 * Card Components - A complete set of components for building card-based layouts.
 *
 * @param {string} [className] - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * import {
 *   Card,
 *   CardHeader,
 *   CardTitle,
 *   CardDescription,
 *   CardContent,
 *   CardFooter,
 * } from '@ui/native/card';
 * import { Button } from '@ui/native/button';
 *
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <Text>Card content</Text>
 *   </CardContent>
 *   <CardFooter>
 *     <Button variant="default" size="lg">Action 1</Button>
 *     <Button variant="outline" size="lg">Action 2</Button>
 *   </CardFooter>
 * </Card>
 * ```
 *
 * @cssVariables
 * - `--card-background-color`
 * - `--card-border-radius`
 * - `--card-color`
 * - `--card-title-color`
 */
function Card({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground rounded-(--card-border-radius) border-(--border) flex w-full flex-col gap-6 border py-6 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="card-header"
      className={cn("grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="card-title"
      className={cn("text-(--card-title-color) font-sans font-semibold leading-none", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="card-description"
      className={cn("text-muted-foreground font-sans text-sm", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ViewProps) {
  return <View data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="card-footer"
      className={cn("flex-row items-center justify-between gap-2 px-6", className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
