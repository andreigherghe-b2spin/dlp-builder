import * as SwitchPrimitives from "@rn-primitives/switch";
import { Platform } from "react-native";

import { cn } from "@/lib/utils";

/**
 * A control that allows the user to toggle between on and off states.
 *
 * @param {boolean} checked - Whether the switch is checked (on)
 * @param {function} onCheckedChange - Callback when the checked state changes
 * @param {boolean} [disabled] - Whether the switch is disabled
 * @param {string} [className] - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * import { useState } from 'react';
 * import { View } from 'react-native';
 * import { Switch } from '@ui/native/switch';
 *
 * const [enabled, setEnabled] = useState(false);
 *
 * <View className="flex-row items-center gap-2">
 *   <Switch checked={enabled} onCheckedChange={setEnabled} id="airplane-mode" />
 * </View>
 * ```
 *
 * @cssVariables
 * - `--switch-background-color`
 * - `--switch-color`
 * - `--switch-checked-background-color`
 * - `--switch-checked-color`
 */
function Switch({
  className,
  ...props
}: SwitchPrimitives.RootProps & React.RefAttributes<SwitchPrimitives.RootRef>) {
  return (
    <SwitchPrimitives.Root
      className={cn(
        "flex h-[1.15rem] w-8 shrink-0 flex-row items-center rounded-full border border-transparent shadow-sm shadow-black/5",
        props.checked ? "bg-(--switch-checked-background-color)" : "bg-(--switch-background-color)",
        props.disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "size-4 rounded-full transition-transform",
          Platform.select({
            web: "pointer-events-none block ring-0",
          }),
          props.checked
            ? "bg-(--switch-checked-color) translate-x-3.5"
            : "bg-(--switch-color) translate-x-0",
        )}
      />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
