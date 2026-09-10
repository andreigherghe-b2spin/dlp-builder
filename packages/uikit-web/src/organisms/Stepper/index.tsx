"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the ones on the files behind
// this barrel are dropped on the way into dist/. So the boundary is declared
// here, where the built consumer actually sees it. Every export below is
// client-only anyway: they render Radix primitives and read React context.

// The stepper's single entry point: `@ui/web/Stepper` resolves here, and
// nothing outside this directory imports any deeper.
//
// What is not re-exported is internal on purpose — the parts in `ui/` that
// `Stepper` composes, the derivations in `lib/utils.ts` and the `*Variants`
// behind every part. A consumer restyles the stepper through `classNames` and
// the `data-testid` each part derives from the root's, which name the same parts
// without pinning the layout that produces them.

export {
  Stepper,
  type StepperProps,
  type StepperStep,
  type StepperState,
  type StepperOrientation,
} from "@/organisms/Stepper/ui/Stepper";

export {
  useStepper,
  type UseStepperOptions,
  type UseStepperResult,
} from "@/organisms/Stepper/lib/useStepper";
