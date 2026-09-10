import type * as React from "react";
import { cva } from "class-variance-authority";
import { Check } from "lucide-react";

import { getActiveStepIndex } from "@/organisms/Stepper/lib/utils";
import { StepperItem } from "@/organisms/Stepper/ui/StepperItem";
// `StepperState` is derived from the circle's own variants, so it lives with
// them and is re-exported from here — the barrel and `lib/` take the stepper's
// whole vocabulary from this file.
import type { StepperState } from "@/organisms/Stepper/ui/StepperIcon";
import { cn, createTestIdFor } from "@/lib/utils";

const base = "flex";

const config = {
  variants: {
    orientation: {
      horizontal: "w-full items-start",
      vertical: "flex-col items-start",
    },
  },
  defaultVariants: { orientation: "horizontal" } as const,
};

const stepperVariants = cva(base, config);

type StepperOrientation = "horizontal" | "vertical";

type StepperStep = {
  /** Stable identifier — what `activeStep` and `disabledSteps` address. */
  id: string;
  /**
   * Splits the connector that follows this step into that many segments, of
   * which `activeSubStep` are filled while this is the current step. A step the
   * flow has already passed shows a solid connector instead, since there is no
   * progress left to break up.
   */
  subSteps?: number;
  /**
   * Replaces the step number. Survives every state, `completed` included —
   * Figma draws `Type=Gift × State=Completed` as its own cell, a gift on the
   * positive fill, so a step that means something keeps meaning it once passed.
   */
  icon?: React.ReactNode;
  /**
   * What `icon` becomes once the step is passed, for a glyph that has a second
   * form rather than just a new background. Figma's gift is exactly this: it
   * ships one asset for Default and Current and a different one for Completed.
   *
   * Only needed to *change* the glyph — a step with just `icon` already keeps it
   * when completed, and a step with neither falls back to the stepper's
   * `completedIcon`.
   */
  completedIcon?: React.ReactNode;
  title?: React.ReactNode;
  /** Figma's "Optional" — the muted second line under the title. */
  description?: React.ReactNode;
  /**
   * Renders the step disabled and, when interactive, unpickable — whatever its
   * position in the flow. Say it here for a step that is always out of bounds;
   * use the stepper's `disabledSteps` when the set is runtime state and `steps`
   * is a shared constant. Either one disables a step.
   */
  disabled?: boolean;
};

type StepperProps = Omit<React.ComponentProps<"ol">, "children"> & {
  steps: StepperStep[];
  /** `id` of the current step. Falls back to the first step. */
  activeStep?: string;
  /** How many of the current step's connector segments are filled. */
  activeSubStep?: number;
  /** `id`s that render as disabled and, when interactive, cannot be picked. */
  disabledSteps?: string[];
  /**
   * The glyph a passed step shows. Defaults to a tick; `null` puts the step
   * number back, and a step's own `icon` still wins over it.
   */
  completedIcon?: React.ReactNode;
  orientation?: StepperOrientation;
  /**
   * Passing this makes the circles real buttons. The component stays
   * controlled — it never moves `activeStep` itself.
   */
  onStepChange?: (id: string) => void;
  /**
   * Names the whole stepper; every part derives its own from it, so one id is
   * enough to reach any step (`<testid>-<step id>`), its connector or a
   * connector segment.
   */
  "data-testid"?: string;
  /** Classes for the parts inside. `className` styles the list itself. */
  classNames?: {
    /** One step — its circle, content and trailing connector. */
    step?: string;
    icon?: string;
    content?: string;
    title?: string;
    description?: string;
    /** The visible 2px line — the element named `<testId>-<stepId>-connector`. */
    connector?: string;
    /** The transparent box the line is centred in, sized to the circle. */
    connectorTrack?: string;
    /** One segment of a segmented connector. */
    subStep?: string;
  };
};

/**
 * A progress indicator for a flow of numbered steps, horizontal or vertical.
 *
 * Steps derive their look from `activeStep`: everything before it is
 * `completed`, it is `current`, everything after is `default`, and anything
 * disabled is `disabled` whatever its position. The connector after a step the
 * flow has passed turns positive, so the filled run reads as progress —
 * including behind a passed step that is also disabled, since the progress
 * happened either way.
 *
 * A step shows its number unless something better is available. Once passed it
 * takes the first of its own `completedIcon`, its own `icon` or the stepper's
 * `completedIcon`; before that, its own `icon`. So a reward step drawn as a gift
 * keeps the gift when passed, and can swap to a *different* gift by giving the
 * step a `completedIcon` — which is how Figma ships it, with one asset for
 * Default and Current and another for Completed.
 *
 * The connector after the current step splits into `subSteps` segments,
 * `activeSubStep` of them filled, for a flow whose steps have internal progress
 * of their own. Steps the flow has not reached keep their connector empty.
 *
 * Fully controlled and free of side effects: `onStepChange` reports a click and
 * nothing else moves. There is no back button, no scroll handling and no
 * imperative "next" — those belong to whatever owns the flow's state. For a flow
 * with nowhere to keep that state, see [useStepper](../lib/useStepper.ts).
 *
 * No `"use client"`: with no `onStepChange` this renders on the server, which is
 * the common case for a read-only progress bar. That is also why the interactive
 * step's accessible name is built from `sr-only` text rather than
 * `aria-labelledby` — ids would need `useId`, and a hook would make the whole
 * module client-only.
 *
 * @param {StepperStep[]} steps - The steps, in order
 * @param {string} [activeStep] - `id` of the current step; defaults to the first
 * @param {number} [activeSubStep=0] - Filled segments of the current step's connector
 * @param {string[]} [disabledSteps] - `id`s to render disabled, for when the set is runtime state; a step can also declare `disabled` itself
 * @param {React.ReactNode} [completedIcon] - Fallback glyph for passed steps; defaults to a tick, `null` restores the number. A step's own `icon` and `completedIcon` both outrank it.
 * @param {('horizontal' | 'vertical')} [orientation='horizontal'] - Which way the steps run
 * @param {(id: string) => void} [onStepChange] - Makes the circles buttons and reports the picked `id`
 * @param {string} [className] - Additional CSS classes for the list
 * @param {object} [classNames] - Classes for the parts inside
 * @param {string} [data-testid] - Base test id; the parts derive theirs from it
 *
 * @example
 * ```tsx
 * // Read-only progress
 * <Stepper
 *   activeStep="details"
 *   steps={[
 *     { id: "account", title: "Account" },
 *     { id: "details", title: "Details", description: "Optional" },
 *     { id: "done", title: "Done" },
 *   ]}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // A registration flow: the middle step has progress of its own, and the last
 * // is a reward rather than a number — an outline gift while it is out of
 * // reach, a filled one once it has been claimed.
 * <Stepper
 *   activeStep={step}
 *   activeSubStep={subStep}
 *   onStepChange={setStep}
 *   steps={[
 *     { id: "email" },
 *     { id: "profile", subSteps: 2 },
 *     { id: "reward", icon: <Gift />, completedIcon: <GiftFilled /> },
 *   ]}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Vertical, and numbers kept on the steps already passed
 * <Stepper orientation="vertical" completedIcon={null} activeStep="two" steps={steps} />
 * ```
 *
 * @cssVariables
 * Component and typography:
 * - `--components-border-icon`
 * - `--radius-base`
 * - `--typography-font-family`
 * - `--typography-font-size-label-l`
 * - `--typography-font-size-label-m`
 * - `--typography-font-size-label-s`
 * - `--typography-font-weight-medium`
 * - `--typography-font-weight-regular`
 * - `--typography-font-weight-semibold`
 *
 * Semantic colors:
 * - `--color-background-feedback-positive-container`
 * - `--color-background-layout-surface`
 * - `--color-background-layout-surface-variant1`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-background-state-pressed`
 * - `--color-background-state-selected`
 * - `--color-border-feedback-positive`
 * - `--color-border-neutral-default`
 * - `--color-border-state-active`
 * - `--color-border-state-focus`
 * - `--color-foreground-feedback-on-positive-container`
 * - `--color-foreground-on-page-default`
 * - `--color-foreground-on-page-muted`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-on-surface-muted`
 * - `--color-foreground-state-disabled`
 *
 * @see [Documentation](https://mui.com/components/steppers)
 */
function Stepper({
  steps,
  activeStep,
  activeSubStep = 0,
  disabledSteps,
  completedIcon = <Check aria-hidden />,
  orientation = "horizontal",
  onStepChange,
  className,
  classNames,
  ...props
}: StepperProps) {
  const activeIndex = getActiveStepIndex(steps, activeStep);
  const testIdFor = createTestIdFor(props["data-testid"]);

  return (
    <ol
      data-orientation={orientation}
      role="list"
      className={cn(stepperVariants({ orientation }), className)}
      {...props}
    >
      {steps.map((step, index) => (
        <StepperItem
          key={step.id}
          step={step}
          index={index}
          activeIndex={activeIndex}
          isLast={index === steps.length - 1}
          activeSubStep={activeSubStep}
          disabledSteps={disabledSteps}
          completedIcon={completedIcon}
          orientation={orientation}
          onStepChange={onStepChange}
          classNames={classNames}
          testIdFor={testIdFor}
        />
      ))}
    </ol>
  );
}

// Every `*Variants` in this folder stays module-local: `classNames` already
// exposes every one of the parts they style, and a derived `data-testid` marks
// each of them for a test. Exporting them would be a second way to say the
// same thing — one that also freezes the internal layout as public API.
export { Stepper, type StepperProps, type StepperStep, type StepperState, type StepperOrientation };
