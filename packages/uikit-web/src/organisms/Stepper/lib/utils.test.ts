import { describe, expect, it } from "vitest";

import {
  getActiveStepIndex,
  getStepState,
  isStepDisabled,
  resolveStepGlyph,
} from "@/organisms/Stepper/lib/utils";
import type { StepperStep } from "@/organisms/Stepper/ui/Stepper";

const steps: StepperStep[] = [{ id: "one" }, { id: "two" }, { id: "three" }];

describe("locating the active step", () => {
  it("finds the step the id names", () => {
    expect(getActiveStepIndex(steps, "two")).toBe(1);
  });

  it("falls back to the first step for an absent or unknown id", () => {
    // A flow that has not started is on its first step, not on no step at all.
    expect(getActiveStepIndex(steps, undefined)).toBe(0);
    expect(getActiveStepIndex(steps, "nowhere")).toBe(0);
  });

  it("still answers with the first position when there are no steps", () => {
    expect(getActiveStepIndex([], "one")).toBe(0);
  });
});

describe("deciding whether a step is disabled", () => {
  it("disables a step that says so itself", () => {
    expect(isStepDisabled({ id: "one", disabled: true })).toBe(true);
  });

  it("disables a step that runtime state names", () => {
    expect(isStepDisabled({ id: "one" }, ["one"])).toBe(true);
    expect(isStepDisabled({ id: "one" }, ["two"])).toBe(false);
  });

  it("does not let an explicit `disabled: false` cancel `disabledSteps`", () => {
    // The two are halves of the same switch — the prop is the static half and
    // `disabledSteps` the runtime one, so neither vetoes the other.
    expect(isStepDisabled({ id: "one", disabled: false }, ["one"])).toBe(true);
  });

  it("is enabled when neither half says anything", () => {
    expect(isStepDisabled({ id: "one" })).toBe(false);
    expect(isStepDisabled({ id: "one" }, [])).toBe(false);
  });
});

describe("the state a step draws itself in", () => {
  it("reads as disabled wherever the flow happens to be", () => {
    expect(getStepState({ disabled: true, isPast: true, isCurrent: false })).toBe("disabled");
    expect(getStepState({ disabled: true, isPast: false, isCurrent: true })).toBe("disabled");
  });

  it("is otherwise position alone", () => {
    expect(getStepState({ disabled: false, isPast: true, isCurrent: false })).toBe("completed");
    expect(getStepState({ disabled: false, isPast: false, isCurrent: true })).toBe("current");
    expect(getStepState({ disabled: false, isPast: false, isCurrent: false })).toBe("default");
  });
});

describe("which glyph a step shows", () => {
  const tick = "stepper-tick";

  it("shows the step's own icon while it is not yet passed", () => {
    expect(resolveStepGlyph({ id: "one", icon: "gift" }, "current", tick)).toBe("gift");
    expect(resolveStepGlyph({ id: "one", icon: "gift" }, "default", tick)).toBe("gift");
  });

  it("has no glyph of its own when the step brought none", () => {
    // Falling through to the step number, which the component draws instead.
    expect(resolveStepGlyph({ id: "one" }, "default", tick)).toBeUndefined();
  });

  it("prefers the step's passed form once completed", () => {
    expect(
      resolveStepGlyph(
        { id: "one", icon: "gift", completedIcon: "opened-gift" },
        "completed",
        tick,
      ),
    ).toBe("opened-gift");
  });

  it("keeps a step's plain glyph once passed, rather than replacing it with the tick", () => {
    // Figma draws `Type=Gift × State=Completed` as its own cell: a step that
    // means something keeps meaning it after it is passed.
    expect(resolveStepGlyph({ id: "one", icon: "gift" }, "completed", tick)).toBe("gift");
  });

  it("falls back to the stepper-wide tick for a completed step with no glyph", () => {
    expect(resolveStepGlyph({ id: "one" }, "completed", tick)).toBe(tick);
  });

  it("shows nothing when the stepper's tick was explicitly removed", () => {
    expect(resolveStepGlyph({ id: "one" }, "completed", null)).toBeNull();
  });
});
