import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { resolveStepGlyph } from "@/organisms/Stepper/lib/utils";
import type { StepperStep } from "@/organisms/Stepper/ui/Stepper";
import { labelVariants } from "@/atoms/Typography";
import { cn } from "@/lib/utils";

const base = `
  relative inline-flex shrink-0 items-center justify-center
  size-10
  border-solid
  rounded-(--radius-base)

  transition-all
  outline-none

  [&_svg]:pointer-events-none
  [&_svg]:shrink-0
  [&_svg:not([class*='size-'])]:size-5
`;

const config = {
  variants: {
    state: {
      default: `
        bg-background-layout-surface
        text-foreground-on-surface-muted
      `,
      current: `
        bg-background-layout-surface-variant1
        bg-linear-[0deg,var(--color-background-state-selected)_0%,var(--color-background-state-selected)_100%]
        border-(length:--components-border-icon)
        border-border-state-active
        text-foreground-on-surface-default
      `,
      completed: `
        bg-background-feedback-positive-container
        text-foreground-feedback-on-positive-container
      `,
      disabled: `
        bg-background-state-disabled
        text-foreground-state-disabled
      `,
    },
    interactive: {
      true: `
        cursor-pointer

        hover:bg-linear-[0deg,var(--color-background-state-hover)_0%,var(--color-background-state-hover)_100%]
        focus-visible:bg-linear-[0deg,var(--color-background-state-hover)_0%,var(--color-background-state-hover)_100%]
        active:bg-linear-[0deg,var(--color-background-state-pressed)_0%,var(--color-background-state-pressed)_100%]

        focus-visible:after:pointer-events-none
        focus-visible:after:absolute
        focus-visible:after:-inset-1.25
        focus-visible:after:border-4
        focus-visible:after:border-solid
        focus-visible:after:border-border-state-focus
        focus-visible:after:content-['']

        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:after:hidden
      `,
      false: "",
    },
  },
  defaultVariants: {
    state: "default",
    interactive: false,
  } as const,
};

const stepIconVariants = cva(base, config);

// The states of a step, read off the cells Figma draws the circle in — so a
// state cannot exist without a style for it. Part of the stepper's public
// vocabulary, and re-exported from `Stepper.tsx` with the rest of it.
type StepperState = NonNullable<VariantProps<typeof stepIconVariants>["state"]>;

// The circle, and the only part of a step that can be operated. It becomes a
// real `<button>` exactly when the stepper is given an `onStepChange` — a
// read-only progress indicator has nothing to activate, and shipping a disabled
// button for it would put it in the tab order's way for no reason.
function StepperIcon({
  step,
  index,
  state,
  completedIcon,
  onStepChange,
  className,
  testId,
}: {
  step: StepperStep;
  index: number;
  state: StepperState;
  completedIcon: React.ReactNode;
  onStepChange?: (id: string) => void;
  className?: string;
  testId?: string;
}) {
  const glyph = resolveStepGlyph(step, state, completedIcon);
  const interactive = onStepChange != null;

  const iconClassName = cn(
    labelVariants({ size: "m", weight: "semibold" }),
    stepIconVariants({ state, interactive }),
    className,
  );

  const circle = (
    <>
      {glyph != null ? (
        // Consumers pass their own icons, so the component marks them hidden
        // rather than trusting every caller to remember. `contents` keeps the
        // wrapper from adding a box.
        <span aria-hidden className="contents">
          {glyph}
        </span>
      ) : (
        // Figma's 28×20 number box. It centres its own text: the circle's
        // `items-center` only places this box, and `leading-none` makes the line
        // shorter than the box, so a `text-center` block would sit against the
        // top edge.
        <span
          aria-hidden={interactive || undefined}
          className="flex h-5 w-7 items-center justify-center"
        >
          {index + 1}
        </span>
      )}
      <StepperAccessibleName
        step={step}
        index={index}
        interactive={interactive}
        hasGlyph={glyph != null}
      />
    </>
  );

  if (!interactive) {
    return (
      <div data-testid={testId} className={iconClassName}>
        {circle}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-testid={testId}
      disabled={state === "disabled"}
      onClick={() => onStepChange(step.id)}
      className={iconClassName}
    >
      {circle}
    </button>
  );
}

// The circle's accessible name. A glyph leaves the step with nothing to be
// called by, and when the circle is a button the label beside it is not part of
// the button's name either — so the name is assembled here.
//
// Interactive steppers then hide the visible copy from assistive tech, because
// the button already says it and reading it twice is worse than not styling it
// at all.
//
// Stays in this file rather than getting one of its own: it exists only because
// of how the circle is rendered, and reading the two together is the point.
function StepperAccessibleName({
  step,
  index,
  interactive,
  hasGlyph,
}: {
  step: StepperStep;
  index: number;
  interactive: boolean;
  hasGlyph: boolean;
}) {
  if (interactive) {
    // The number goes in here too, rather than being left to the visible box:
    // whether the accessible name computation puts a space between two adjacent
    // nodes depends on their layout, and "2Step title" is what that gamble
    // sounds like when it loses.
    return (
      <span className="sr-only">
        {index + 1}. {step.title}
        {step.description != null && <>, {step.description}</>}
      </span>
    );
  }

  if (hasGlyph) return <span className="sr-only">{index + 1}</span>;

  return null;
}

export { StepperIcon, type StepperState };
