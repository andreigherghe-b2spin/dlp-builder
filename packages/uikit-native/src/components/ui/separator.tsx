import * as SeparatorPrimitive from "@rn-primitives/separator";

import { cn } from "@/lib/utils";

/**
 * A visual or semantic separator between content.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {'horizontal' | 'vertical'} [orientation='horizontal'] - The orientation of the separator
 * @param {boolean} [decorative=true] - Whether the separator is purely decorative
 *
 * @example
 * ```tsx
 * import { Separator } from '@ui/native/separator';
 *
 * <Separator />
 * <Separator orientation="vertical" className="h-4" />
 * ```
 *
 * @cssVariables
 * - `--separator-color`
 * - `--separator-width`
 * - `--separator-height`
 */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-(--separator-color) shrink-0",
        orientation === "horizontal"
          ? "h-(--separator-height) w-full"
          : "w-(--separator-width) h-full",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
