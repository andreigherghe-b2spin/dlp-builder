import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Card Components - A complete set of components for building card-based layouts
 *
 * - @param className - Additional CSS classes to apply
 * - @param props - All standard div element props
 *
 * @example
 * ```tsx
 * import {
 *   Card,
 *   CardContent,
 *   CardDescription,
 *   CardFooter,
 *   CardHeader,
 *   CardTitle,
 * } from "@ui/web/Card"
 * import { Button } from "@ui/web/Button"
 *
 * // Complete card example with all components
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Project Dashboard</CardTitle>
 *     <CardDescription>
 *       View and manage your project details, team members, and settings.
 *     </CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here...</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Save Changes</Button>
 *     <Button variant="outline">Cancel</Button>
 *   </CardFooter>
 * </Card>
 *
 * // Basic card with custom content. It provides a paddings and a border.
 * <Card>
 *   <CardContent>
 *     <p>Card content</p>
 *   </CardContent>
 * </Card>
 * ```
 *
 * @cssVariables
 * - `--card-background-color`
 * - `--card-border-radius`
 * - `--card-color`
 *
 * @see [Documentation](https://ui.shadcn.com/docs/components/card)
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground rounded-(--card-border-radius) flex flex-col gap-6 border py-6 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

/**
 * CardHeader component - Container for card title and description
 *
 * - @param className - Additional CSS classes to apply
 * - @param props - All standard div element props
 *
 * @example
 * // Basic card header
 * ```tsx
 * import {
 *   CardDescription,
 *   CardHeader,
 *   CardTitle,
 * } from "@ui/web/Card"
 * <CardHeader>
 *   <CardTitle>Card Title</CardTitle>
 *   <CardDescription>Card description text</CardDescription>
 * </CardHeader>
 * ```
 *
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6",
        className,
      )}
      {...props}
    />
  );
}

/**
 * CardTitle component - Main title for the card
 *
 * - @param className - Additional CSS classes to apply
 * - @param props - All standard div element props
 *
 * @example
 * // Basic card title
 * ```tsx
 * import {
 *   CardTitle,
 * } from "@ui/web/Card"
 * <CardTitle>Project Dashboard</CardTitle>
 * ```
 *
 * @example
 * // Card title with custom styling
 * ```tsx
 * <CardTitle className="text-2xl font-bold text-blue-600">
 *   Important Notice
 * </CardTitle>
 * ```
 *
 * @cssVariables
 * - `--card-title-color`
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-(--card-title-color) font-semibold leading-none", className)}
      {...props}
    />
  );
}

/**
 * CardDescription component - Secondary text that provides context for the card
 *
 * - @param className - Additional CSS classes to apply
 * - @param props - All standard div element props
 *
 * @example
 * // Basic card description
 * ```tsx
 * import {
 *   CardDescription,
 * } from "@ui/web/Card"
 * <CardDescription className="text-gray-600 italic">
 *   View and manage your project details, team members, and settings.
 * </CardDescription>
 * ```
 *
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/**
 * CardContent component - Main content area of the card with horizontal padding
 *
 * - @param className - Additional CSS classes to apply
 * - @param props - All standard div element props
 *
 * @example
 * // Basic card content
 * ```tsx
 * import {
 *   CardContent,
 * } from "@ui/web/Card"
 * <CardContent>
 *   <p>Main card content goes here</p>
 *   <div>Additional content sections</div>
 * </CardContent>
 * ```
 *
 * @example
 * // Card content with custom styling
 * ```tsx
 * <CardContent className="space-y-4">
 *   <h3>Section Title</h3>
 *   <p>Content paragraph</p>
 * </CardContent>
 * ```
 *
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-card-content="" className={cn("px-6", className)} {...props} />;
}

/**
 * CardFooter component - Container for action buttons and additional content
 *
 * - @param className - Additional CSS classes to apply
 * - @param props - All standard div element props
 *
 * @example
 * // Basic card footer with buttons
 * ```tsx
 * import {
 *   CardFooter,
 * } from "@ui/web/Card"
 * import { Button } from "@ui/web/Button"
 * <CardFooter>
 *   <Button>Save</Button>
 *   <Button variant="outline">Cancel</Button>
 * </CardFooter>
 * ```
 *
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("[.border-t]:pt-6 flex items-center px-6", className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
