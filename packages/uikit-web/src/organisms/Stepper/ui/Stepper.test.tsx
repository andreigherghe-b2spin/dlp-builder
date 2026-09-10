import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Stepper, type StepperProps, type StepperStep } from "@/organisms/Stepper";

const STEPS: StepperStep[] = [
  { id: "one", title: "Create your account", description: "Email and password" },
  { id: "two", title: "Confirm your details" },
  { id: "three", title: "Claim your bonus" },
];

async function mountStepper({ steps = STEPS, ...props }: Partial<StepperProps> = {}) {
  const view = await render(
    <Stepper
      // The base every part derives its id from, so the names below — `stepper-two`,
      // `stepper-two-icon`, `stepper-two-connector` — are what the DOM carries.
      // Nothing is addressable without it: `createTestIdFor` returns `undefined`
      // for every part when the root was not named.
      data-testid="stepper"
      steps={steps}
      {...props}
    />,
  );
  // Scoped to this render, since `getByTestId` otherwise searches the whole page.
  const within = page.elementLocator(view.container);
  const one = (testId: string) => within.getByTestId(testId).element() as HTMLElement;
  const count = (testId: string | RegExp) => within.getByTestId(testId).elements().length;

  const step = (id: string) => one(`stepper-${id}`);
  const icon = (id: string) => one(`stepper-${id}-icon`);
  const content = (id: string) => one(`stepper-${id}-content`);
  const connector = (id: string) => one(`stepper-${id}-connector`);
  const segment = (id: string, index: number) => one(`stepper-${id}-sub-step-${index}`);
  const segments = (id: string) => count(new RegExp(`^stepper-${id}-sub-step-\\d+$`));

  /**
   * Whether the circle draws a graphic rather than its number.
   *
   * A tick and a caller's icon are both `aria-hidden` SVGs — deliberately, since
   * the step is named by the `sr-only` text beside them — so there is no role and
   * no name to address one by. What separates "shows a glyph" from "shows a
   * number" is whether a graphic is there at all, and that is what this reads.
   */
  const hasGlyph = (id: string) => icon(id).querySelector("svg") != null;

  /** The states of every step in order, which is the whole of "where the flow is". */
  const states = () => steps.map((entry) => step(entry.id).getAttribute("data-state") ?? undefined);

  const currentStep = () =>
    steps.find((entry) => step(entry.id).getAttribute("aria-current") === "step")?.id;

  const buttons = () => within.getByRole("button").elements() as HTMLButtonElement[];
  const button = (id: string) => icon(id) as HTMLButtonElement;

  const boxOf = (id: string) => step(id).getBoundingClientRect();

  return {
    view,
    within,
    button,
    buttons,
    connector,
    content,
    count,
    currentStep,
    hasGlyph,
    icon,
    boxOf,
    segment,
    segments,
    states,
    step,
  };
}

// Everything a step draws follows from its position against `activeStep` — the
// state, the `aria-current` marker, the glyph and the connector fill are four
// readings of the same fact, so each case checks more than one of them: a stepper
// that colours the right circle and fills the wrong line is not working.

describe("where the flow is", () => {
  it("passes the steps behind the active one, marks it current and leaves the rest", async () => {
    const stepper = await mountStepper({ activeStep: "two" });

    expect(stepper.states()).toEqual(["completed", "current", "default"]);
    expect(stepper.currentStep()).toBe("two");
  });

  it("falls back to the first step when `activeStep` names one that is not there", async () => {
    // The same fallback `useStepper` resolves an unknown id to, so a flow whose
    // state has drifted shows the beginning rather than nothing at all.
    const stepper = await mountStepper({ activeStep: "nowhere" });

    expect(stepper.states()).toEqual(["current", "default", "default"]);
    expect(stepper.currentStep()).toBe("one");
  });
});

describe("the line between two steps", () => {
  it("fills the line behind the flow, and draws none after the last step", async () => {
    const stepper = await mountStepper({ activeStep: "two" });

    expect(stepper.connector("one")).toHaveAttribute("data-filled");
    expect(stepper.connector("two")).not.toHaveAttribute("data-filled");
    expect(stepper.count("stepper-three-connector")).toBe(0);
  });
});

describe("a step with progress of its own", () => {
  const steps: StepperStep[] = [{ id: "one" }, { id: "two", subSteps: 3 }, { id: "three" }];

  it("splits the current step's line into segments and fills the ones behind it", async () => {
    const stepper = await mountStepper({ steps, activeStep: "two", activeSubStep: 2 });

    expect(stepper.segments("two")).toBe(3);
    expect(stepper.segment("two", 0)).toHaveAttribute("data-filled");
    expect(stepper.segment("two", 1)).toHaveAttribute("data-filled");
    // The last segment is never filled while the step is still current: filling it
    // is the same action as leaving the step.
    expect(stepper.segment("two", 2)).not.toHaveAttribute("data-filled");
    expect(stepper.connector("two")).not.toHaveAttribute("data-filled");
  });

  it("keeps the segments of a step the flow has not reached empty", async () => {
    // `activeSubStep` belongs to the current step alone — a step further down the
    // flow must not borrow it and show progress that has not happened.
    const stepper = await mountStepper({ steps, activeStep: "one", activeSubStep: 2 });

    expect(stepper.segments("two")).toBe(3);
    expect(stepper.segment("two", 0)).not.toHaveAttribute("data-filled");
    expect(stepper.segment("two", 1)).not.toHaveAttribute("data-filled");
  });

  it("shows one solid line after the step once the flow has passed it", async () => {
    const stepper = await mountStepper({ steps, activeStep: "three", activeSubStep: 1 });

    expect(stepper.segments("two")).toBe(0);
    expect(stepper.connector("two")).toHaveAttribute("data-filled");
  });
});

describe("what a step shows in its circle", () => {
  it("puts a tick on the steps already passed", async () => {
    const stepper = await mountStepper({ activeStep: "three" });

    expect(stepper.hasGlyph("one")).toBe(true);
    expect(stepper.hasGlyph("two")).toBe(true);
    // The current step still counts, which is what tells the user where they are.
    expect(stepper.hasGlyph("three")).toBe(false);
    expect(stepper.icon("three")).toHaveTextContent("3");
  });

  it("puts the number back when the stepper's tick is turned off", async () => {
    const stepper = await mountStepper({ activeStep: "three", completedIcon: null });

    expect(stepper.hasGlyph("one")).toBe(false);
    expect(stepper.icon("one")).toHaveTextContent("1");
  });

  it("keeps a step's own icon once the step is passed", async () => {
    // Figma draws the gift on the positive fill rather than replacing it with a
    // tick: a step that means something goes on meaning it.
    const steps: StepperStep[] = [
      { id: "one" },
      { id: "reward", icon: <span>gift</span> },
      { id: "three" },
    ];
    const stepper = await mountStepper({ steps, activeStep: "three" });

    expect(stepper.icon("reward")).toHaveTextContent("gift");
    expect(stepper.step("reward")).toHaveAttribute("data-state", "completed");
  });

  it("swaps to the passed form of an icon when the step declares one", async () => {
    const steps: StepperStep[] = [
      { id: "one" },
      { id: "reward", icon: <span>gift</span>, completedIcon: <span>gift claimed</span> },
      { id: "three" },
    ];
    const stepper = await mountStepper({ steps, activeStep: "reward" });

    expect(stepper.icon("reward")).toHaveTextContent("gift");

    const passed = await mountStepper({ steps, activeStep: "three" });

    expect(passed.icon("reward")).toHaveTextContent("gift claimed");
  });
});

describe("the label beside a step", () => {
  it("renders no label column at all for a step with neither", async () => {
    // A numbers-only stepper keeps its circles on their own row rather than
    // sitting on top of an empty box.
    const stepper = await mountStepper({ steps: [{ id: "one" }, { id: "two" }] });

    expect(stepper.count("stepper-one-content")).toBe(0);
    expect(stepper.count("stepper-one-title")).toBe(0);
  });
});

describe("a step the flow cannot reach", () => {
  it("disables a step whether the step says so or the stepper does", async () => {
    const steps: StepperStep[] = [{ id: "one" }, { id: "two", disabled: true }, { id: "three" }];
    const stepper = await mountStepper({ steps, disabledSteps: ["three"] });

    expect(stepper.states()).toEqual(["current", "disabled", "disabled"]);
  });

  it("reads as disabled wherever the flow happens to be", async () => {
    const steps: StepperStep[] = [
      { id: "one", disabled: true },
      { id: "two", disabled: true },
      { id: "three" },
    ];
    const stepper = await mountStepper({ steps, activeStep: "two" });

    expect(stepper.states()).toEqual(["disabled", "disabled", "default"]);
    // Position, not state: a current step that is also disabled would otherwise
    // leave the whole stepper with nothing marked current.
    expect(stepper.currentStep()).toBe("two");
  });

  it("keeps the run of progress unbroken behind a passed step that is disabled", async () => {
    const steps: StepperStep[] = [{ id: "one", disabled: true }, { id: "two" }, { id: "three" }];
    const stepper = await mountStepper({ steps, activeStep: "three" });

    // The step happened whether or not it can be gone back to, and un-filling its
    // line would leave a neutral gap in the middle of a completed run.
    expect(stepper.connector("one")).toHaveAttribute("data-filled");
  });
});

describe("picking a step", () => {
  it("stays a read-only indicator with nothing to operate", async () => {
    const stepper = await mountStepper({ activeStep: "two" });

    expect(stepper.buttons()).toHaveLength(0);
  });

  it("makes every circle a button that reports the step it stands for", async () => {
    const onStepChange = vi.fn();
    const stepper = await mountStepper({ activeStep: "one", onStepChange });

    expect(stepper.buttons()).toHaveLength(3);

    await userEvent.click(stepper.button("three"));

    expect(onStepChange).toHaveBeenCalledWith("three");
  });

  it("names each button by its position, title and description", async () => {
    // The label beside the circle is not part of the button's accessible name, so
    // the name is assembled inside it — otherwise every step is called "1".
    const stepper = await mountStepper({ onStepChange: vi.fn() });

    expect(stepper.button("one")).toHaveAccessibleName(
      "1. Create your account, Email and password",
    );
    expect(stepper.button("two")).toHaveAccessibleName("2. Confirm your details");
  });

  it("hides the visible label from a screen reader once the button says it", async () => {
    // Read twice is worse than not styled at all.
    const stepper = await mountStepper({ onStepChange: vi.fn() });

    expect(stepper.content("one")).toHaveAttribute("aria-hidden", "true");
  });

  it("refuses a disabled step, and keeps it out of the tab order", async () => {
    const onStepChange = vi.fn();
    const steps: StepperStep[] = [{ id: "one" }, { id: "two", disabled: true }];
    const stepper = await mountStepper({ steps, onStepChange });

    expect(stepper.button("two")).toBeDisabled();

    // A native click on a disabled button reaches no handler, which is the whole
    // reason the state is on the element rather than only in its styling.
    stepper.button("two").click();

    expect(onStepChange).not.toHaveBeenCalled();
  });

  it("stays controlled — a click moves nothing on its own", async () => {
    const stepper = await mountStepper({ activeStep: "one", onStepChange: vi.fn() });

    await userEvent.click(stepper.button("three"));

    expect(stepper.states()).toEqual(["current", "default", "default"]);
    expect(stepper.currentStep()).toBe("one");
  });
});

describe("which way the steps run", () => {
  it("runs them down the page when it is vertical", async () => {
    const stepper = await mountStepper({ orientation: "vertical" });

    expect(stepper.boxOf("two").top).toBeGreaterThan(stepper.boxOf("one").bottom - 1);
    expect(stepper.boxOf("two").left).toBe(stepper.boxOf("one").left);
  });
});

describe("a stepper nobody named", () => {
  it("puts nothing test-only into the DOM", async () => {
    const view = await render(<Stepper steps={STEPS} activeStep="two" />);

    // Not a fallback name: a consumer who never asked for test ids gets none, which
    // is why every test here names the root itself.
    expect(view.container.querySelector("[data-testid]")).toBeNull();
    // Still a real stepper, so the absence above is about names and nothing else.
    await expect.element(page.elementLocator(view.container).getByRole("list")).toBeVisible();
  });
});
