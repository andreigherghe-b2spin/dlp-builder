import type * as React from "react";

import type { StepperState, StepperStep } from "@/organisms/Stepper/ui/Stepper";

/**
 * An unknown or absent `activeStep` means the flow has not started, which is the
 * first step rather than nothing at all — hence the floor at 0.
 */
function getActiveStepIndex(steps: StepperStep[], activeStep?: string) {
  return Math.max(
    0,
    steps.findIndex((step) => step.id === activeStep),
  );
}

/**
 * `||`, not `??`: an explicit `disabled: false` must not suppress
 * `disabledSteps`, which is the runtime-state half of the same switch.
 */
function isStepDisabled(step: StepperStep, disabledSteps?: string[]) {
  return Boolean(step.disabled || disabledSteps?.includes(step.id));
}

/**
 * Disabled outranks position: a step that is out of bounds reads as disabled
 * wherever the flow happens to be. Everything else is position alone, which is
 * why the caller resolves `isPast`/`isCurrent` first.
 */
function getStepState({
  disabled,
  isPast,
  isCurrent,
}: {
  disabled: boolean;
  isPast: boolean;
  isCurrent: boolean;
}): StepperState {
  if (disabled) return "disabled";
  if (isPast) return "completed";
  if (isCurrent) return "current";
  return "default";
}

/**
 * Most specific first: the step's own passed form, then its plain glyph (which
 * it keeps once passed, as Figma's gift does), then the stepper-wide tick. All
 * three absent — or `completedIcon={null}` — falls through to the number.
 */
function resolveStepGlyph(step: StepperStep, state: StepperState, completedIcon: React.ReactNode) {
  if (state !== "completed") return step.icon;
  return step.completedIcon ?? step.icon ?? completedIcon;
}

export { getActiveStepIndex, getStepState, isStepDisabled, resolveStepGlyph };
