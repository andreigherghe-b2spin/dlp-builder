import { describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { useStepper } from "@/organisms/Stepper/lib/useStepper";
import type { StepperStep } from "@/organisms/Stepper/ui/Stepper";

// The middle step has sub-steps, which is the part of the hook worth centralising:
// leaving it takes two `nextStep()` calls, and the first only fills a connector.
const steps: StepperStep[] = [{ id: "email" }, { id: "profile", subSteps: 2 }, { id: "done" }];

const mount = (options: Partial<Parameters<typeof useStepper>[0]> = {}) =>
  renderHook(() => useStepper({ steps, ...options }));

describe("where the flow opens", () => {
  it("opens on the first step", async () => {
    const { result } = await mount();

    expect(result.current.activeStep).toBe("email");
    expect(result.current.index).toBe(0);
    expect(result.current.activeSubStep).toBe(0);
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);
  });

  it("opens on the step `defaultStep` names", async () => {
    const { result } = await mount({ defaultStep: "profile" });

    expect(result.current.activeStep).toBe("profile");
    expect(result.current.index).toBe(1);
    expect(result.current.isFirst).toBe(false);
  });

  it("resolves an id that is not in `steps` to the first step", async () => {
    const { result } = await mount({ defaultStep: "nowhere" });

    // Both readings agree, which is the point: clamping the index alone once made
    // an unknown step indistinguishable from the first, so the stepper highlighted
    // step 0 while `nextStep()` moved to step 1 and step 0 was never visited.
    expect(result.current.activeStep).toBe("email");
    expect(result.current.index).toBe(0);
  });

  it("is on no step at all when there are none yet", async () => {
    const { result, rerender } = await renderHook(
      (props?: { steps: StepperStep[] }) => useStepper({ steps: props?.steps ?? [] }),
      { initialProps: { steps: [] as StepperStep[] } },
    );

    expect(result.current.activeStep).toBe("");
    // Not on the last step — there is no last step to be on.
    expect(result.current.isLast).toBe(false);

    await rerender({ steps });

    expect(result.current.activeStep).toBe("email");
  });
});

describe("moving forward", () => {
  it("advances to the next step", async () => {
    const { result, act } = await mount();

    await act(() => result.current.nextStep());

    expect(result.current.activeStep).toBe("profile");
    expect(result.current.activeSubStep).toBe(0);
  });

  it("fills a step's sub-steps before it leaves the step", async () => {
    const { result, act } = await mount({ defaultStep: "profile" });

    await act(() => result.current.nextStep());

    // Still inside `profile`, one connector segment filled.
    expect(result.current.activeStep).toBe("profile");
    expect(result.current.activeSubStep).toBe(1);

    await act(() => result.current.nextStep());

    expect(result.current.activeStep).toBe("done");
    expect(result.current.activeSubStep).toBe(0);
  });

  it("never fills the last segment, because filling it is the same act as leaving", async () => {
    const { result, act } = await mount({ defaultStep: "profile" });

    // Two calls in one handler both read the same `activeSubStep`, so the clamp has
    // to be inside the updater too — unclamped, the pair strands the step as
    // `current` with a full connector.
    await act(() => {
      result.current.nextStep();
      result.current.nextStep();
    });

    expect(result.current.activeSubStep).toBe(1);
  });

  it("stops at the last step", async () => {
    const { result, act } = await mount({ defaultStep: "done" });

    expect(result.current.isLast).toBe(true);

    await act(() => result.current.nextStep());

    expect(result.current.activeStep).toBe("done");
  });
});

describe("moving back", () => {
  it("lands on the screen you came from, not on the step's first one", async () => {
    const { result, act } = await mount({ defaultStep: "done" });

    await act(() => result.current.prevStep());

    expect(result.current.activeStep).toBe("profile");
    expect(result.current.activeSubStep).toBe(1);

    await act(() => result.current.prevStep());

    // Back through `profile`'s own screens before leaving it.
    expect(result.current.activeStep).toBe("profile");
    expect(result.current.activeSubStep).toBe(0);

    await act(() => result.current.prevStep());

    expect(result.current.activeStep).toBe("email");
  });

  it("stops at the first step", async () => {
    const { result, act } = await mount();

    await act(() => result.current.prevStep());

    expect(result.current.activeStep).toBe("email");
    expect(result.current.isFirst).toBe(true);
  });
});

describe("jumping to a step", () => {
  it("goes to the step the id names", async () => {
    const { result, act } = await mount();

    await act(() => result.current.goToStep("done"));

    expect(result.current.activeStep).toBe("done");
  });

  it("ignores an id that is not a step", async () => {
    const onStepChange = vi.fn();
    const { result, act } = await mount({ onStepChange });

    await act(() => result.current.goToStep("nowhere"));

    expect(result.current.activeStep).toBe("email");
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it("treats a jump to the current step as no move at all", async () => {
    const onStepChange = vi.fn();
    const { result, act } = await mount({ defaultStep: "profile", onStepChange });

    await act(() => result.current.nextStep());
    expect(result.current.activeSubStep).toBe(1);

    await act(() => result.current.goToStep("profile"));

    // Re-running it would discard the filled segments and fire `onStepChange`
    // again — for a consumer wiring that to `form.reset`, a destructive no-op.
    expect(result.current.activeSubStep).toBe(1);
    expect(onStepChange).not.toHaveBeenCalled();
  });
});

describe("starting over", () => {
  it("returns to `defaultStep`", async () => {
    const { result, act } = await mount({ defaultStep: "profile" });

    await act(() => result.current.goToStep("done"));
    await act(() => result.current.reset());

    expect(result.current.activeStep).toBe("profile");
    expect(result.current.activeSubStep).toBe(0);
  });

  it("returns to the first step when there was no `defaultStep`", async () => {
    const { result, act } = await mount();

    await act(() => result.current.goToStep("done"));
    await act(() => result.current.reset());

    expect(result.current.activeStep).toBe("email");
  });
});

describe("telling the consumer about a move", () => {
  it("fires on every step change, whichever control caused it", async () => {
    const onStepChange = vi.fn();
    const { result, act } = await mount({ onStepChange });

    await act(() => result.current.nextStep());
    expect(onStepChange).toHaveBeenLastCalledWith("profile");

    await act(() => result.current.goToStep("done"));
    expect(onStepChange).toHaveBeenLastCalledWith("done");

    await act(() => result.current.prevStep());
    expect(onStepChange).toHaveBeenLastCalledWith("profile");

    expect(onStepChange).toHaveBeenCalledTimes(3);
  });

  it("does not fire for a sub-step, which is a move inside one step", async () => {
    const onStepChange = vi.fn();
    const { result, act } = await mount({ defaultStep: "profile", onStepChange });

    await act(() => result.current.nextStep());

    expect(onStepChange).not.toHaveBeenCalled();
  });
});

describe("what it hands to `Stepper`", () => {
  it("spreads the same array and position the stepper draws from", async () => {
    const { result, act } = await mount({ defaultStep: "profile" });

    await act(() => result.current.nextStep());

    expect(result.current.stepperProps).toEqual({
      steps,
      activeStep: "profile",
      activeSubStep: 1,
    });
  });
});
