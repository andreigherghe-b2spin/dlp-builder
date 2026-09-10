import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@ui/web/Button";
import { Timer } from "@ui/web/Timer";

const meta: Meta<typeof Timer> = {
  title: "Needs Review/Molecules/Timer",
  id: "Timer",
  component: Timer,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  argTypes: {
    durationInSeconds: {
      control: { type: "number", min: 0 },
      description:
        "Seconds to count down from. Changing it to a **different** value restarts the " +
        "countdown; handing it the value it is already counting does nothing.",
    },
    variant: {
      control: "inline-radio",
      options: ["neutral", "accent1", "accent2"],
      description: "The colourway. The three instances in Figma differ in nothing else.",
    },
    running: {
      control: "boolean",
      description:
        "Whether the countdown is running. `false` pauses it where it is; mounting at " +
        "`false` is how a timer waits for an event before it starts.",
    },
    runId: {
      control: "text",
      description:
        "Changing this restarts the countdown — including at the duration it is " +
        "already counting, which `durationInSeconds` alone deliberately does not do.",
    },
    onEnd: { action: "ended", description: "Called once when a countdown that ran hits zero" },
    className: { control: "text", description: "Classes for the pill" },
  },
};

export default meta;
type Story = StoryObj<typeof Timer>;

/**
 * Watch it tick. The pill has no accessible name of its own — only the page knows what
 * is ending — so every call site passes an `aria-label`, and so does this one.
 */
export const Default: Story = {
  args: {
    durationInSeconds: 3661,
    "aria-label": "Time left in this promotion",
  },
};

/** The two brand accents. */
export const Accent1: Story = {
  args: { durationInSeconds: 90, variant: "accent1", "aria-label": "Bonus expires in" },
};

export const Accent2: Story = {
  args: { durationInSeconds: 90, variant: "accent2", "aria-label": "Bonus expires in" },
};

/**
 * Nearly done. Give it a few seconds and it will reach `00:00:00`, call `onEnd` once —
 * check the Actions panel — and hold there.
 */
export const AboutToEnd: Story = {
  args: { durationInSeconds: 5, "aria-label": "Round ends in" },
};

/**
 * A countdown started at `0` never ran, so it never ends and `onEnd` is not called.
 * That is the state a call site is in before its data arrives.
 */
export const Zero: Story = {
  args: { durationInSeconds: 0, "aria-label": "Round ends in" },
};

/**
 * A working control panel — start it, pause it, run it again, put it back to the top.
 *
 * Two props do all four. **`running`** is one prop with two jobs: mounted at `false`
 * the pill sits at its full duration until something starts it, which is the delayed
 * start; flipped to `false` mid-count it holds exactly where it is, which is the pause.
 * Resuming carries on from the remainder rather than the top of the second the pause
 * landed in, so pausing repeatedly does not slowly hand seconds back.
 *
 * **`runId`** is what starts a countdown over. It is separate from `durationInSeconds`
 * because handing the timer the same duration is deliberately *not* a restart — a
 * parent that re-renders every second would otherwise freeze the countdown at its
 * start. Change `runId` and the same 45 seconds runs again; change it with
 * `running={false}` and the pill goes back to `00:00:45` and waits.
 *
 * The pill is on screen the whole time in every one of those states, which is the point
 * of pausing rather than unmounting: nothing in the layout moves.
 */
export const Controls: Story = {
  render: function Controls() {
    const [running, setRunning] = useState(false);
    const [run, setRun] = useState(1);
    const [ended, setEnded] = useState(false);

    // One place that starts a countdown over, since "restart" and "back to the top" are
    // the same move and differ only in whether it runs afterwards.
    const restart = (thenRun: boolean) => {
      setRun((n) => n + 1);
      setEnded(false);
      setRunning(thenRun);
    };

    return (
      <div className="flex w-96 flex-col items-start gap-4">
        <div className="flex items-center gap-3">
          <Timer
            aria-label="Round ends in"
            durationInSeconds={45}
            onEnd={() => setEnded(true)}
            runId={run}
            running={running}
          />
          <span className="text-foreground-on-page-muted text-(length:--typography-font-size-body-s)">
            {ended ? "ended" : running ? "running" : "paused"} · run {run}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={ended}
            onClick={() => setRunning((was) => !was)}
            size="sm"
            variant={running ? "outline" : "default"}
          >
            {running ? "Pause" : "Start"}
          </Button>
          <Button onClick={() => restart(true)} size="sm" variant="secondary">
            Restart
          </Button>
          <Button onClick={() => restart(false)} size="sm" variant="ghost">
            Back to the top
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * Every colourway at once — and the only story
 * `playwright/specs/Timer.tag.visual.ts` photographs.
 *
 * **Every timer here is stopped at zero, deliberately.** A running countdown cannot be
 * a baseline: the digits depend on how long the page took to settle before the shutter,
 * so the same shot differs between two runs on the same machine. Held at `0` it is the
 * same picture every time.
 *
 * Nothing is lost by that. What a baseline is for here is the pill — its background,
 * border, radius, padding and type, in three themes — and all of it is drawn at
 * `00:00:00`. What the digits *say* is `formatCountdown`'s contract, and it is pinned
 * where it can be pinned exactly, in `lib/formatCountdown.test.ts`. The stories above
 * are the ones that actually run.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      {(["neutral", "accent1", "accent2"] as const).map((variant) => (
        <div className="flex items-center gap-3" key={variant}>
          <span className="text-foreground-on-page-muted text-(length:--typography-font-size-body-s) w-20">
            {variant}
          </span>
          <Timer aria-label={`${variant} timer`} durationInSeconds={0} variant={variant} />
        </div>
      ))}
    </div>
  ),
};
