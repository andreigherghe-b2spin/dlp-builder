"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

/**
 * An image element with a fallback for representing the user.
 * Built on top of Radix UI's Avatar primitive.
 *
 * @param {string} [className] - Additional CSS classes to apply to the avatar
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Avatar>
 *   <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
 *   <AvatarFallback>CN</AvatarFallback>
 * </Avatar>
 * ```
 *
 * @cssVariables
 * - `--avatar-border-radius`
 * - `--avatar-border-width`
 * - `--avatar-border-color`
 * - `--avatar-size`
 *
 * @see [API Reference](https://www.radix-ui.com/primitives/docs/components/avatar#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/avatar)
 */
function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "size-(--avatar-size) rounded-(--avatar-border-radius) border-(length:--avatar-border-width) border-(--avatar-border-color) relative flex shrink-0 overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The image component of the Avatar.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the image
 * - @param {string} src - The source URL of the image
 * - @param {string} alt - The alt text for the image
 */
function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

/**
 * The fallback component shown when the avatar image fails to load.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the fallback
 *
 * @cssVariables
 * - `--avatar-fallback-background-color`
 * - `--avatar-fallback-color`
 */
function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-(--avatar-fallback-background-color) text-(--avatar-fallback-color) flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
