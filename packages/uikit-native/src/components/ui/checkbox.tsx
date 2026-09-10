import * as CheckboxPrimitive from "@rn-primitives/checkbox";
import { Check } from "lucide-react-native";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const DEFAULT_HIT_SLOP = 24;

/**
 * A control that allows the user to toggle between checked and unchecked states.
 *
 * @param {string} [className] - Additional CSS classes to apply to the checkbox
 * @param {boolean} checked - Whether the checkbox is checked
 * @param {function} onCheckedChange - Callback when the checked state changes
 * @param {boolean} [disabled] - Whether the checkbox is disabled
 *
 * @example
 * ```tsx
 * import { useState } from 'react';
 * import { View } from 'react-native';
 * import { Checkbox } from '@ui/native/checkbox';
 *
 * const [checked, setChecked] = useState(false);
 *
 * <View className="flex flex-row items-center gap-2">
 *   <Checkbox checked={checked} onCheckedChange={setChecked} />
 * </View>
 * ```
 *
 * @cssVariables
 * - `--checkbox-border-radius`
 * - `--checkbox-border-color`
 * - `--checkbox-background-color`
 * - `--checkbox-checked-border-color`
 * - `--checkbox-checked-background-color`
 * - `--checkbox-checked-color`
 */
function Checkbox({
  className,
  checkedClassName,
  indicatorClassName,
  iconClassName,
  ...props
}: CheckboxPrimitive.RootProps &
  React.RefAttributes<CheckboxPrimitive.RootRef> & {
    checkedClassName?: string;
    indicatorClassName?: string;
    iconClassName?: string;
  }) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "rounded-(--checkbox-border-radius) border-(--checkbox-border-color) bg-(--checkbox-background-color) size-4 shrink-0 border shadow-sm shadow-black/5",
        "overflow-hidden",
        props.checked && cn("border-(--checkbox-checked-border-color)", checkedClassName),
        props.disabled && "opacity-50",
        className,
      )}
      hitSlop={DEFAULT_HIT_SLOP}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "bg-(--checkbox-checked-background-color) h-full w-full items-center justify-center",
          indicatorClassName,
        )}
      >
        <Icon
          as={Check}
          size={14}
          strokeWidth={3.5}
          className={cn("text-(--checkbox-checked-color)", iconClassName)}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
