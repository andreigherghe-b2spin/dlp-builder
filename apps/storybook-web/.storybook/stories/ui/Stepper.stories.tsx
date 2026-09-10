import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { within } from "storybook/test";
import { Gift, Star } from "lucide-react";

import { Stepper, useStepper, type StepperStep } from "@ui/web/Stepper";
import { Button } from "@ui/web/Button";

const meta: Meta<typeof Stepper> = {
  title: "Verified/Organisms/Stepper",
  id: "Stepper",
  component: Stepper,
  tags: ["autodocs", "status:verified", "level:organisms"],
  /**
   * A horizontal stepper takes the width it is given and spends the surplus on
   * its connectors, so in a canvas narrower than the labels every story reads as
   * a cramped, overlapping one. A floor keeps them legible; a story with more
   * steps to fit raises it with `parameters.container`.
   */
  decorators: [
    (Story, context) => (
      <div className={(context.parameters.container as string) ?? "min-w-125"}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    steps: {
      control: false,
      description:
        "The steps, in order — { id, title?, description?, icon?, completedIcon?, subSteps?, disabled? }",
    },
    activeStep: {
      control: "text",
      description: "`id` of the current step; defaults to the first",
    },
    activeSubStep: {
      control: "number",
      description: "Filled segments of the current step's connector",
    },
    disabledSteps: {
      control: "object",
      description:
        "`id`s to render disabled — for when the set is runtime state. A step can also say `disabled` itself.",
    },
    completedIcon: {
      control: false,
      description:
        "Fallback glyph for passed steps; defaults to a tick, `null` restores the number. A step's own `icon` and `completedIcon` outrank it.",
    },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Which way the steps run",
    },
    onStepChange: {
      control: false,
      description: "Makes the circles buttons and reports the picked `id`",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the list",
    },
    classNames: {
      control: false,
      description: "Classes for the parts inside",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Stepper>;

const captionClass = "text-foreground-on-page-muted text-(length:--typography-font-size-body-s)";

/** Bare circles "Show Title=False". */
const plain: StepperStep[] = [{ id: "one" }, { id: "two" }, { id: "three" }];

/** Figma's "Show Title=True": a title and the muted "Optional" line. */
const titled: StepperStep[] = [
  { id: "one", title: "Step title", description: "Optional" },
  { id: "two", title: "Step title", description: "Optional" },
  { id: "three", title: "Step title", description: "Optional" },
];

/**
 * The product's registration flow, as `authProgressBarStepConfig.ts` declares
 * it: three steps, the middle one with internal progress, a reward at the end.
 */
const registration: StepperStep[] = [
  { id: "email" },
  { id: "profile", subSteps: 2 },
  { id: "reward", icon: <Gift /> },
];

// ---------------------------------------------------------------- orientation

/** "Show Title=False, Orientation=Horizontal". */
export const Default: Story = {
  args: {
    steps: plain,
    activeStep: "two",
  },
};

/** "Show Title=False, Orientation=Vertical". */
export const Vertical: Story = {
  args: {
    steps: plain,
    activeStep: "two",
    orientation: "vertical",
  },
};

/**
 * Connectors are `flex-1` w, so giving the list a height
 * stretches them instead of leaving the column bunched at the top.
 */
export const VerticalStretched: Story = {
  args: {
    steps: plain,
    activeStep: "two",
    orientation: "vertical",
    className: "h-96",
  },
};

// -------------------------------------------------------------------- content

/** "Show Title=True, Orientation=Horizontal". */
export const WithTitles: Story = {
  args: {
    steps: titled.map(({ id, title }) => ({ id, title })),
    activeStep: "two",
  },
};

export const WithTitlesAndDescriptions: Story = {
  args: {
    steps: titled,
    activeStep: "two",
  },
};

/** "Show Title=True, Orientation=Vertical". */
export const VerticalWithTitles: Story = {
  args: {
    steps: titled,
    activeStep: "two",
    orientation: "vertical",
  },
};

/**
 * The designed trade-off: a step stays 40px wide and its label overflows past
 * both edges, so the connectors always meet the circles. Long labels therefore
 * grow towards each other and can collide — exactly as Figma's own 6-step frame
 * shows. Give `classNames.content` a width to make them wrap instead.
 */
export const LongTitles: Story = {
  args: {
    steps: [
      { id: "one", title: "Create your account", description: "Email and password" },
      { id: "two", title: "Confirm your details", description: "Name, address, date of birth" },
      { id: "three", title: "Claim your welcome bonus" },
    ],
    activeStep: "two",
  },
};

/**
 * The opt-out: giving the content column a width makes the labels wrap inside
 * it instead of running on, and the circles stay 40px so the connectors still
 * meet them. One override, because `whitespace-nowrap` sits on the column.
 *
 * Wrapping alone does not guarantee they clear each other — the columns are only
 * as far apart as the stepper is wide, so the width has to leave more room per
 * step than the label claims. Hence the explicit width here.
 */
export const WrappingTitles: Story = {
  args: {
    steps: [
      { id: "one", title: "Create your account", description: "Email and password" },
      { id: "two", title: "Confirm your details", description: "Name and address" },
      { id: "three", title: "Claim your welcome bonus" },
    ],
    activeStep: "two",
    classNames: { content: "w-28 whitespace-normal" },
  },
  parameters: { container: "min-w-160" },
};

// ---------------------------------------------------------------------- icons

/** A step's `icon` replaces its number `Type=Gift`. */
export const CustomStepIcon: Story = {
  args: {
    steps: [{ id: "one" }, { id: "two" }, { id: "three", icon: <Gift /> }],
    activeStep: "two",
  },
};

/**
 * gift on the positive fill. A step's `icon` therefore outranks `completedIcon`.
 */
export const IconOnCompletedStep: Story = {
  args: {
    steps: [{ id: "one", icon: <Gift /> }, { id: "two" }, { id: "three" }],
    activeStep: "three",
  },
};

const reward: StepperStep[] = [
  { id: "one", title: "Sign up" },
  {
    id: "two",
    title: "Reward",
    icon: <Gift />,
    completedIcon: <Gift fill="currentColor" />,
  },
  { id: "three", title: "Play" },
];

/**
 * A step's own `completedIcon` is a second form of its glyph for once it has
 * been passed — an outline gift while the reward is out of reach, a filled one
 * after. This is how Figma ships it: one asset for Default and Current, another
 * for Completed. It outranks the stepper-wide `completedIcon`, so this step
 * never shows the tick.
 */
export const StepCompletedIcon: Story = {
  args: { steps: reward, activeStep: "three" },
};

/** The same step before it is reached — the outline gift. */
export const StepCompletedIconPending: Story = {
  args: { steps: reward, activeStep: "one" },
};

/** One prop re-glyphs every passed step. */
export const CustomCompletedIcon: Story = {
  args: {
    steps: plain,
    activeStep: "three",
    completedIcon: <Star aria-hidden />,
  },
};

/** `completedIcon={null}` keeps the numbers on the steps already passed. */
export const NumbersWhenCompleted: Story = {
  args: {
    steps: plain,
    activeStep: "three",
    completedIcon: null,
  },
};

// ------------------------------------------------------------------- subSteps

/** The middle step's connector splits in two, the first segment filled. */
export const SubSteps: Story = {
  args: {
    steps: [{ id: "one" }, { id: "two", subSteps: 2 }, { id: "three" }],
    activeStep: "two",
    activeSubStep: 1,
  },
};

export const SubStepsAllFilled: Story = {
  args: {
    steps: [{ id: "one" }, { id: "two", subSteps: 4 }, { id: "three" }],
    activeStep: "two",
    activeSubStep: 4,
  },
};

/** Once the step is passed there is no progress left to break up — solid again. */
export const SubStepsOnCompletedStep: Story = {
  args: {
    steps: [{ id: "one", subSteps: 3 }, { id: "two" }, { id: "three" }],
    activeStep: "two",
    activeSubStep: 1,
  },
};

export const SubStepsVertical: Story = {
  args: {
    steps: [{ id: "one" }, { id: "two", subSteps: 3 }, { id: "three" }],
    activeStep: "two",
    activeSubStep: 2,
    orientation: "vertical",
    className: "h-80",
  },
};

// ---------------------------------------------------------------- interaction

/**
 * `disabledSteps` takes ids, which suits a set that is runtime state while
 * `steps` stays a shared constant — the product reads its from sessionStorage.
 * `disabled` wins over position, so even a passed step can be locked out.
 */
export const DisabledSteps: Story = {
  args: {
    steps: titled,
    activeStep: "two",
    disabledSteps: ["three"],
  },
};

/**
 * The two combinations that have no business working by accident.
 *
 * `one` is behind the cursor *and* locked: it reads disabled, but its connector
 * stays positive, because the progress happened whether or not the step can be
 * revisited — otherwise a neutral gap opens in the middle of a completed run.
 *
 * `two` says `disabled: false` and is also listed in `disabledSteps`: the list
 * still wins. The two sources are a union, so the explicit `false` is "I am not
 * declaring this here", not "nothing else may declare it".
 */
export const DisabledEdgeCases: Story = {
  args: {
    steps: [
      { id: "one", title: "Passed, locked" },
      { id: "two", title: "disabled: false", disabled: false },
      { id: "three", title: "Current" },
    ],
    activeStep: "three",
    disabledSteps: ["one", "two"],
  },
};

/**
 * The same result declared on the step, which reads better when the step is
 * always out of bounds. Either source disables it.
 */
export const DisabledOnStep: Story = {
  args: {
    steps: [
      { id: "one", title: "Step title", description: "Optional" },
      { id: "two", title: "Step title", description: "Optional" },
      { id: "three", title: "Not for you", disabled: true },
    ],
    activeStep: "two",
  },
};

/** Without `onStepChange` the circles are plain `<div>`s — nothing to focus. */
export const NonInteractive: Story = {
  args: {
    steps: plain,
    activeStep: "two",
  },
};

/** With it they are real `<button>`s, so Enter and Space work for free. */
export const Interactive: Story = {
  render: (args) => {
    const [step, setStep] = React.useState("two");

    return <Stepper {...args} activeStep={step} onStepChange={setStep} />;
  },
  args: {
    steps: titled,
    disabledSteps: ["three"],
  },
};

/**
 * The focus ring on the step after the current one. Hover and pressed need a
 * real pointer, so they are driven from `playwright/specs/Stepper.tag.visual.ts`
 * against `Interactive` rather than from a `play` function here.
 */
export const Focused: Story = {
  args: {
    steps: plain,
    activeStep: "two",
    onStepChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getAllByRole("button")[2].focus();
  },
};

// ----------------------------------------------------------- edges and volume

export const FirstStepActive: Story = {
  args: {
    steps: titled,
    activeStep: "one",
  },
};

export const LastStepActive: Story = {
  args: {
    steps: titled,
    activeStep: "three",
  },
};

export const TwoSteps: Story = {
  args: {
    steps: titled.slice(0, 2),
    activeStep: "two",
  },
};

/** Six is as many as Figma draws, and needs the room to show it. */
export const SixSteps: Story = {
  parameters: { container: "min-w-200" },
  args: {
    steps: Array.from({ length: 6 }, (_, index) => ({
      id: `step-${index}`,
      title: "Step title",
      description: "Optional",
    })),
    activeStep: "step-1",
  },
};

// ----------------------------------------------------------------- useStepper

/**
 * `useStepper` owns the position so a form does not have to hunt for the next
 * id. `nextStep()` fills the middle step's two connector segments one call at a
 * time before moving on, and `prevStep()` walks back through them.
 */
export const WithUseStepper: Story = {
  render: () => {
    const { stepperProps, nextStep, prevStep, goToStep, isFirst, isLast } = useStepper({
      steps: registration,
    });

    return (
      <div className="flex flex-col gap-6">
        <Stepper {...stepperProps} onStepChange={goToStep} />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={prevStep} disabled={isFirst}>
            Back
          </Button>
          <Button onClick={nextStep} disabled={isLast}>
            {isLast ? "Finish" : "Continue"}
          </Button>
        </div>
        <p className={captionClass}>
          activeStep: {stepperProps.activeStep} · activeSubStep: {stepperProps.activeSubStep}
        </p>
      </div>
    );
  },
};

// ------------------------------------------------------------ the product

/**
 * What `MultiStepProgressBar` renders today in every brand app's RegisterPage —
 * here for a side-by-side against the live registration bar.
 */
export const ProductRegistrationFlow: Story = {
  render: (args) => {
    const [step, setStep] = React.useState("profile");
    const [subStep, setSubStep] = React.useState(1);

    return (
      <div className="flex flex-col gap-4">
        <Stepper
          {...args}
          activeStep={step}
          activeSubStep={subStep}
          onStepChange={(id) => {
            setStep(id);
            setSubStep(0);
          }}
        />
        <p className={captionClass}>
          activeStep: {step} · activeSubStep: {subStep}
        </p>
        <button
          type="button"
          className={captionClass}
          onClick={() => setSubStep((value) => (value === 2 ? 0 : value + 1))}
        >
          advance sub-step
        </button>
      </div>
    );
  },
  args: {
    steps: registration,
  },
};

// ----------------------------------------------------------------- the matrix

/**
 * All four circle states in one run — the cell grid of Figma node 153:927, plus
 * the Disabled state the design does not draw. Position gives the first three
 * and `disabledSteps` the fourth, so each is produced the way a product would.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(
        [
          ["Number", undefined],
          ["Icon", <Gift key="gift" />],
        ] as const
      ).map(([type, icon]) => (
        <div key={type} className="flex flex-col gap-2">
          <p className={captionClass}>{type}</p>
          <Stepper
            activeStep="current"
            disabledSteps={["disabled"]}
            steps={[
              { id: "completed", title: "Completed", icon },
              { id: "current", title: "Current", icon },
              { id: "default", title: "Default", icon },
              { id: "disabled", title: "Disabled", icon },
            ]}
          />
        </div>
      ))}
    </div>
  ),
};

/** One frame with every orientation × content combination, for the snapshot. */
export const AllVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      {(["horizontal", "vertical"] as const).map((orientation) => (
        <div key={orientation} className="flex flex-col gap-4">
          <p className={captionClass}>{orientation}</p>
          <div
            className={
              orientation === "horizontal" ? "flex flex-col gap-8" : "flex items-start gap-16"
            }
          >
            {(
              [
                ["bare", plain, undefined],
                ["titled", titled, undefined],
                ["sub-steps", registration, 1],
              ] as const
            ).map(([label, steps, activeSubStep]) => (
              <div key={label} className="flex flex-col gap-2">
                <p className={captionClass}>{label}</p>
                <Stepper
                  steps={steps}
                  activeStep={steps[1].id}
                  activeSubStep={activeSubStep}
                  orientation={orientation}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
