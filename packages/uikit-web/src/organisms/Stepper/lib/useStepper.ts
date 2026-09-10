"use client";

import * as React from "react";

import type { StepperStep } from "@/organisms/Stepper/ui/Stepper";

type UseStepperOptions = {
  /** The same array handed to `Stepper` — it is what bounds and sub-steps read. */
  steps: StepperStep[];
  /** Where to start. Defaults to the first step. */
  defaultStep?: string;
  /** Fires on every step change, including from `nextStep` and `prevStep`. */
  onStepChange?: (id: string) => void;
};

type UseStepperResult = {
  /**
   * `id` of the current step — hand this to `Stepper`. Always an id that is
   * actually in `steps`, or `""` while `steps` is empty, so it can never point
   * the stepper at a step that does not exist.
   */
  activeStep: string;
  /** Filled connector segments of the current step. */
  activeSubStep: number;
  /** Position of the current step in `steps`. */
  index: number;
  isFirst: boolean;
  isLast: boolean;
  /**
   * Advances one screen: the current step's sub-steps first, then the step
   * itself. A no-op on the last screen of the last step.
   */
  nextStep: () => void;
  /** The exact inverse, landing back on the screen you came from. */
  prevStep: () => void;
  /** Jumps to a step by `id`. Unknown ids are ignored. */
  goToStep: (id: string) => void;
  /** Back to `defaultStep`. */
  reset: () => void;
  /** Spread onto `Stepper`. Add `onStepChange={goToStep}` for clickable steps. */
  stepperProps: {
    steps: StepperStep[];
    activeStep: string;
    activeSubStep: number;
  };
};

/**
 * Owns the position in a flow so a form does not have to.
 *
 * Without it, moving forward means reading the array, finding the current id,
 * picking the next one and writing it back — and doing that again for the
 * sub-steps inside a step. This holds that state and exposes `nextStep()`.
 *
 * Sub-steps come first, which is the part worth centralising: a step declaring
 * `subSteps: 2` takes two `nextStep()` calls to leave, filling one connector
 * segment on the way, and only the second call moves to the next step. That is
 * the rule the product's `MultiStepProgressBar` implemented internally.
 *
 * Uncontrolled by design. A flow whose position already lives somewhere else —
 * react-hook-form, a URL param, a state machine — should skip this and drive
 * [Stepper](../ui/Stepper.tsx) directly; it takes `activeStep` either way.
 *
 * @param {StepperStep[]} steps - The steps, in order — the same array `Stepper` gets
 * @param {string} [defaultStep] - Starting step `id`; defaults to the first
 * @param {(id: string) => void} [onStepChange] - Notified on every step change
 *
 * @example
 * ```tsx
 * const steps = [{ id: "email" }, { id: "profile", subSteps: 2 }, { id: "done" }];
 *
 * function SignUp() {
 *   const { stepperProps, nextStep, prevStep, isLast } = useStepper({ steps });
 *
 *   return (
 *     <>
 *       <Stepper {...stepperProps} />
 *       <Button onClick={prevStep}>Back</Button>
 *       <Button onClick={nextStep}>{isLast ? "Finish" : "Continue"}</Button>
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Clickable steps, and the form told about every move
 * const { stepperProps, goToStep } = useStepper({ steps, onStepChange: form.reset });
 *
 * <Stepper {...stepperProps} onStepChange={goToStep} />
 * ```
 */
function useStepper({ steps, defaultStep, onStepChange }: UseStepperOptions): UseStepperResult {
  const [storedStep, setActiveStep] = React.useState(defaultStep);
  const [activeSubStep, setActiveSubStep] = React.useState(0);

  /**
   * `-1` when the stored id is not in `steps` — an id that was never valid, or
   * one from before `steps` arrived. It is deliberately *not* clamped to 0:
   * clamping made an unknown step indistinguishable from the first, so the
   * stepper highlighted step 0 while `nextStep()` moved to step 1 and step 0 was
   * never visited. Every reader below derives from `activeStep` instead, which
   * resolves an unresolvable id to the first step — the same fallback `Stepper`
   * documents, but computed once so the two can never disagree.
   */
  const storedIndex = steps.findIndex((step) => step.id === storedStep);
  const index = storedIndex === -1 ? 0 : storedIndex;
  const activeStep = steps[index]?.id ?? "";
  const isFirst = index === 0;
  // An empty `steps` has no last step to be on, rather than being on it.
  const isLast = steps.length > 0 && index === steps.length - 1;

  const moveTo = (id: string, subStep = 0) => {
    setActiveStep(id);
    setActiveSubStep(subStep);
    onStepChange?.(id);
  };

  const goToStep = (id: string) => {
    // A click on the step you are already on is not a move: re-running it would
    // discard that step's filled segments and fire `onStepChange` again, which
    // for a consumer wiring it to `form.reset` is a destructive no-op.
    if (id !== activeStep && steps.some((step) => step.id === id)) moveTo(id);
  };

  const nextStep = () => {
    const subSteps = steps[index]?.subSteps ?? 0;
    // One segment short of full still leaves a screen inside this step; filling
    // the last one is the same action as leaving, so it never reaches `subSteps`.
    if (activeSubStep < subSteps - 1) {
      // Clamped inside the updater as well as gated outside it: two calls in one
      // handler both read the same `activeSubStep`, and unclamped the pair would
      // take it past the last segment and strand the step as `current` with a
      // full connector.
      setActiveSubStep((filled) => Math.min(filled + 1, subSteps - 1));
      return;
    }
    if (!isLast && steps[index + 1]) moveTo(steps[index + 1].id);
  };

  const prevStep = () => {
    if (activeSubStep > 0) {
      setActiveSubStep((filled) => Math.max(filled - 1, 0));
      return;
    }
    if (isFirst) return;
    const previous = steps[index - 1];
    if (!previous) return;
    // Land on the screen you came from, which for a step with sub-steps is its
    // last one rather than its first.
    moveTo(previous.id, previous.subSteps ? previous.subSteps - 1 : 0);
  };

  const reset = () => moveTo(defaultStep ?? steps[0]?.id ?? "");

  return {
    activeStep,
    activeSubStep,
    index,
    isFirst,
    isLast,
    nextStep,
    prevStep,
    goToStep,
    reset,
    stepperProps: { steps, activeStep, activeSubStep },
  };
}

export { useStepper, type UseStepperOptions, type UseStepperResult };
