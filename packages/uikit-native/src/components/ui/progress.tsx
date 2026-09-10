import * as ProgressPrimitive from "@rn-primitives/progress";
import { Platform, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";

import { cn } from "@/lib/utils";

/**
 * Displays an indicator showing the completion progress of a task.
 *
 * @param {number} value - The progress value (0-100)
 * @param {string} [className] - Additional CSS classes to apply to the progress bar
 * @param {string} [indicatorClassName] - Additional CSS classes to apply to the indicator
 *
 * @example
 * ```tsx
 * import { Progress } from '@ui/native/progress';
 *
 * <Progress value={13} />
 * <Progress value={50} />
 * <Progress value={100} />
 * ```
 *
 * @cssVariables
 * - `--progress-outline-width`
 * - `--progress-outline-color`
 * - `--progress-background-color`
 * - `--progress-indicator-background-color`
 */
function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: ProgressPrimitive.RootProps &
  React.RefAttributes<ProgressPrimitive.RootRef> & {
    indicatorClassName?: string;
  }) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "border-(length:--progress-outline-width) border-(--progress-outline-color) bg-(--progress-background-color) relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <Indicator value={value} className={indicatorClassName} />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

const Indicator = Platform.select({
  web: WebIndicator,
  native: NativeIndicator,
  default: NullIndicator,
});

type IndicatorProps = {
  value: number | undefined | null;
  className?: string;
};

function WebIndicator({ value, className }: IndicatorProps) {
  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <View
      className={cn(
        "bg-(--progress-indicator-background-color) h-full w-full flex-1 transition-all",
        className,
      )}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    >
      <ProgressPrimitive.Indicator className={cn("h-full w-full", className)} />
    </View>
  );
}

function NativeIndicator({ value, className }: IndicatorProps) {
  const progress = useDerivedValue(() => value ?? 0);

  const indicator = useAnimatedStyle(() => {
    return {
      width: withSpring(
        `${interpolate(progress.value, [0, 100], [1, 100], Extrapolation.CLAMP)}%`,
        { overshootClamping: true },
      ),
    };
  }, [value]);

  if (Platform.OS === "web") {
    return null;
  }

  return (
    <ProgressPrimitive.Indicator asChild>
      <Animated.View
        style={indicator}
        className={cn("bg-(--progress-indicator-background-color) h-full", className)}
      />
    </ProgressPrimitive.Indicator>
  );
}

function NullIndicator(_props: IndicatorProps) {
  return null;
}
