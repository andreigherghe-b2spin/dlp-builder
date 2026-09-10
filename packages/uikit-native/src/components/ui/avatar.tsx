import * as AvatarPrimitive from "@rn-primitives/avatar";

import { cn } from "@/lib/utils";

/**
 * An image element with a fallback for representing the user.
 *
 * @param {string} [className] - Additional CSS classes to apply to the avatar
 * @param {string} alt - Accessibility label for the avatar
 *
 * @example
 * ```tsx
 * import { Avatar, AvatarImage, AvatarFallback } from '@ui/native/avatar';
 * import { TypographySmall } from '@ui/native/typography';
 *
 * <Avatar alt="User avatar">
 *   <AvatarImage source={require('@/assets/icon.png')} />
 *   <AvatarFallback>
 *     <TypographySmall>CN</TypographySmall>
 *   </AvatarFallback>
 * </Avatar>
 * ```
 *
 * @cssVariables
 * - `--avatar-border-radius`
 * - `--avatar-border-width`
 * - `--avatar-border-color`
 * - `--avatar-size`
 */
function Avatar({
  className,
  ...props
}: AvatarPrimitive.RootProps & React.RefAttributes<AvatarPrimitive.RootRef>) {
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
 * @param {string} [className] - Additional CSS classes to apply to the image
 * @param {ImageSourcePropType} source - The image source
 *
 * @example
 * ```tsx
 * import { AvatarImage } from '@ui/native/avatar';
 *
 * <AvatarImage source={require('@/assets/icon.png')} />
 * ```
 */
function AvatarImage({
  className,
  ...props
}: AvatarPrimitive.ImageProps & React.RefAttributes<AvatarPrimitive.ImageRef>) {
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
 * @param {string} [className] - Additional CSS classes to apply to the fallback
 *
 * @example
 * ```tsx
 * import { AvatarFallback } from '@ui/native/avatar';
 * import { TypographySmall } from '@ui/native/typography';
 *
 * <AvatarFallback>
 *   <TypographySmall>CN</TypographySmall>
 * </AvatarFallback>
 * ```
 *
 * @cssVariables
 * - `--avatar-fallback-background-color`
 * - `--avatar-fallback-color`
 */
function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.FallbackProps & React.RefAttributes<AvatarPrimitive.FallbackRef>) {
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
