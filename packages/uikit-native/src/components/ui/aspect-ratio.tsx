import * as AspectRatioPrimitive from "@rn-primitives/aspect-ratio";

import { cn } from "@/lib/utils";

/**
 * A component that maintains a specific aspect ratio for its content.
 *
 * @param {number} [ratio] - The desired ratio of width to height (e.g., 16/9, 4/3, 1)
 * @param {string} [className] - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * import { Image } from 'react-native';
 * import { AspectRatio } from '@ui/native/aspect-ratio';
 *
 * <AspectRatio ratio={16 / 9}>
 *   <Image
 *     source={require('@/assets/mock-image.jpg')}
 *     className="size-full"
 *     resizeMode="cover"
 *   />
 * </AspectRatio>
 * ```
 */
function AspectRatio({ className, ...props }: AspectRatioPrimitive.RootProps) {
  return <AspectRatioPrimitive.Root className={cn("overflow-hidden", className)} {...props} />;
}

export { AspectRatio };
