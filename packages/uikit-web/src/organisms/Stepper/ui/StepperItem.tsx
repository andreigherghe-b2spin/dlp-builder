import type * as React from "react";
import { cva } from "class-variance-authority";

import { getStepState, isStepDisabled } from "@/organisms/Stepper/lib/utils";
import type { StepperOrientation, StepperProps, StepperStep } from "@/organisms/Stepper/ui/Stepper";
import { StepperConnector } from "@/organisms/Stepper/ui/StepperConnector";
import { StepperContent } from "@/organisms/Stepper/ui/StepperContent";
import { StepperIcon, type StepperState } from "@/organisms/Stepper/ui/StepperIcon";
import { cn } from "@/lib/utils";

const stepperItemVariants = cva("flex flex-1 last:flex-none", {
  variants: {
    orientation: {
      horizontal: "items-start",
      vertical: "flex-col items-start",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

const stepperGroupVariants = cva("flex", {
  variants: {
    orientation: {
      horizontal: "w-10 shrink-0 flex-col items-center",
      vertical: "items-center",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

// One step — its circle, its label column and the connector that follows it.
//
// Everything here derives from position (`index` against `activeIndex`) rather
// than from `activeStep`, so the state, the `aria-current` marker and the
// connector fill can never disagree about where the flow is.
//
// Internal, and deliberately commented rather than JSDoc'd: `codegen:docs`
// scrapes JSDoc blocks and would publish this as a component nobody can import.
// The same goes for every other part in this folder.
type StepperItemProps = {
  step: StepperStep;
  index: number;
  activeIndex: number;
  isLast: boolean;
  activeSubStep: number;
  disabledSteps?: string[];
  completedIcon: React.ReactNode;
  orientation: StepperOrientation;
  onStepChange?: (id: string) => void;
  classNames?: StepperProps["classNames"];
  testIdFor: (part: string) => string | undefined;
};

function StepperItem({
  step,
  index,
  activeIndex,
  isLast,
  activeSubStep,
  disabledSteps,
  completedIcon,
  orientation,
  onStepChange,
  classNames,
  testIdFor,
}: StepperItemProps) {
  // Position first, because these two drive the connector and `aria-current`
  // regardless of whether the step is disabled.
  const isPast = index < activeIndex;
  const isCurrent = index === activeIndex;

  const disabled = isStepDisabled(step, disabledSteps);
  const state: StepperState = getStepState({ disabled, isPast, isCurrent });

  return (
    <li
      data-state={state}
      data-testid={testIdFor(step.id)}
      role="listitem"
      // Follows position, not state: a current step that is also disabled would
      // otherwise leave the whole stepper with no current marker.
      aria-current={isCurrent ? "step" : undefined}
      className={cn(stepperItemVariants({ orientation }), classNames?.step)}
    >
      <div className={stepperGroupVariants({ orientation })}>
        <StepperIcon
          step={step}
          index={index}
          state={state}
          completedIcon={completedIcon}
          onStepChange={onStepChange}
          className={classNames?.icon}
          testId={testIdFor(`${step.id}-icon`)}
        />

        <StepperContent
          step={step}
          orientation={orientation}
          interactive={onStepChange != null}
          classNames={classNames}
          testIdFor={(part) => testIdFor(`${step.id}-${part}`)}
        />
      </div>

      {!isLast && (
        <StepperConnector
          orientation={orientation}
          // Position, not state: a passed step that is disabled still happened,
          // and un-filling its connector would leave a neutral gap in the middle
          // of a completed run.
          filled={isPast}
          // A passed step has no progress left to break up.
          subSteps={isPast ? undefined : step.subSteps}
          // Only the current step's connector shows partial progress; a step the
          // flow has not reached keeps its segments empty.
          activeSubStep={isCurrent ? activeSubStep : 0}
          className={classNames?.connector}
          trackClassName={classNames?.connectorTrack}
          subStepClassName={classNames?.subStep}
          testIdFor={(part) => testIdFor(`${step.id}-${part}`)}
        />
      )}
    </li>
  );
}

export { StepperItem };
