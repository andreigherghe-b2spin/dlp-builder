import { cva } from "class-variance-authority";

import type { StepperOrientation, StepperProps, StepperStep } from "@/organisms/Stepper/ui/Stepper";
import { TypographyLabel } from "@/atoms/Typography";
import { cn } from "@/lib/utils";

const stepperContentVariants = cva("flex flex-col gap-0.5 whitespace-nowrap", {
  variants: {
    orientation: {
      horizontal: "items-center py-2 text-center",
      vertical: "items-start px-2",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

// The label column — title over an optional muted second line. Renders nothing
// at all for a step with neither, so a numbers-only stepper keeps the circles
// on their own row instead of on top of an empty box.
function StepperContent({
  step,
  orientation,
  interactive,
  classNames,
  testIdFor,
}: {
  step: StepperStep;
  orientation: StepperOrientation;
  interactive: boolean;
  classNames?: StepperProps["classNames"];
  testIdFor: (part: string) => string | undefined;
}) {
  if (step.title == null && step.description == null) return null;

  return (
    <div
      data-testid={testIdFor("content")}
      aria-hidden={interactive || undefined}
      className={cn(stepperContentVariants({ orientation }), classNames?.content)}
    >
      {step.title != null && (
        <TypographyLabel
          size="l"
          weight="medium"
          data-testid={testIdFor("title")}
          className={cn("text-foreground-on-page-default", classNames?.title)}
        >
          {step.title}
        </TypographyLabel>
      )}
      {step.description != null && (
        <TypographyLabel
          size="s"
          weight="regular"
          data-testid={testIdFor("description")}
          className={cn("text-foreground-on-page-muted", classNames?.description)}
        >
          {step.description}
        </TypographyLabel>
      )}
    </div>
  );
}

export { StepperContent };
