import * as RadioGroupPrimitive from "@rn-primitives/radio-group";

import { cn } from "@/lib/utils";

/**
 * A set of checkable buttons where only one can be checked at a time.
 *
 * @param {string} value - The controlled value of the radio item to check
 * @param {function} onValueChange - Callback when the value changes
 * @param {string} [className] - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * import { useState } from 'react';
 * import { View } from 'react-native';
 * import { RadioGroup, RadioGroupItem } from '@ui/native/radio-group';
 *
 * const [value, setValue] = useState('default');
 *
 * <RadioGroup value={value} onValueChange={setValue}>
 *   <View className="flex flex-row items-center gap-3">
 *     <RadioGroupItem value="default" id="r1" />
 *   </View>
 * </RadioGroup>
 * ```
 *
 * @cssVariables
 * - `--radio-group-border-color`
 * - `--radio-group-background-color`
 * - `--radio-group-checked-border-color`
 * - `--radio-group-checked-background-color`
 * - `--radio-group-checked-color`
 */
function RadioGroup({
  className,
  ...props
}: RadioGroupPrimitive.RootProps & React.RefAttributes<RadioGroupPrimitive.RootRef>) {
  return <RadioGroupPrimitive.Root className={cn("gap-3", className)} {...props} />;
}

function RadioGroupItem({
  className,
  ...props
}: RadioGroupPrimitive.ItemProps & React.RefAttributes<RadioGroupPrimitive.ItemRef>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "border-(--radio-group-border-color) bg-(--radio-group-background-color) data-[state=checked]:border-(--radio-group-checked-border-color) data-[state=checked]:bg-(--radio-group-checked-background-color) aspect-square size-4 shrink-0 items-center justify-center rounded-full border shadow-sm shadow-black/5",
        props.disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="bg-(--radio-group-checked-color) size-2 rounded-full" />
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
