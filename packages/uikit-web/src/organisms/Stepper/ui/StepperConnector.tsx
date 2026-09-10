import { cva } from "class-variance-authority";

import type { StepperOrientation } from "@/organisms/Stepper/ui/Stepper";
import { cn } from "@/lib/utils";

const stepperConnectorTrackVariants = cva("flex flex-1", {
  variants: {
    orientation: {
      horizontal: "h-10 min-w-6 items-center",
      vertical: "min-h-6 w-10 flex-col items-center",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

const stepperConnectorVariants = cva("flex", {
  variants: {
    orientation: {
      horizontal: "h-0.5 w-full",
      vertical: "w-0.5 flex-1 flex-col",
    },
    filled: {
      true: "bg-border-feedback-positive",
      false: "bg-border-neutral-default",
    },
  },
  defaultVariants: { orientation: "horizontal", filled: false },
});

const stepperSubStepVariants = cva("flex-1", {
  variants: {
    filled: {
      true: "bg-border-feedback-positive",
      false: "",
    },
  },
  defaultVariants: { filled: false },
});

// The line between two steps, and the segments a step's own progress splits it
// into. Told what to draw rather than working it out: `StepperItem` resolves
// `filled` and how many segments are lit from position, so the two cannot
// disagree.
function StepperConnector({
  orientation,
  filled,
  subSteps,
  activeSubStep,
  className,
  trackClassName,
  subStepClassName,
  testIdFor,
}: {
  orientation: StepperOrientation;
  filled: boolean;
  subSteps?: number;
  activeSubStep: number;
  className?: string;
  trackClassName?: string;
  subStepClassName?: string;
  testIdFor: (part: string) => string | undefined;
}) {
  const segmented = subSteps != null && subSteps > 0;

  return (
    <div
      data-testid={testIdFor("connector-track")}
      className={cn(stepperConnectorTrackVariants({ orientation }), trackClassName)}
    >
      <div
        data-filled={filled || undefined}
        data-testid={testIdFor("connector")}
        className={cn(stepperConnectorVariants({ orientation, filled }), className)}
      >
        {segmented &&
          // A fixed-length run of identical, stateless cells: nothing to
          // reorder, so the index is the identity.
          Array.from({ length: subSteps }, (_, segment) => (
            <span
              key={segment}
              data-filled={segment < activeSubStep || undefined}
              data-testid={testIdFor(`sub-step-${segment}`)}
              className={cn(
                stepperSubStepVariants({ filled: segment < activeSubStep }),
                subStepClassName,
              )}
            />
          ))}
      </div>
    </div>
  );
}

export { StepperConnector };
