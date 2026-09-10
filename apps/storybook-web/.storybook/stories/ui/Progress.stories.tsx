import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@ui/web/Button";
import { Progress } from "@ui/web/Progress";

const meta: Meta<typeof Progress> = {
  title: "Needs Review/Molecules/Progress",
  id: "Progress",
  component: Progress,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Progress between 0 and `max`. A missing value is 0 — an empty bar.",
    },
    max: {
      control: "number",
      description: "The value that counts as complete",
    },
    showLabel: {
      control: "boolean",
      description:
        "Draws the row above the bar. Defaults to on when `label` was given; an explicit " +
        "`false` wins, which is how a bar keeps its name without drawing one. Drawn " +
        "without a `label`, the row holds the percentage alone.",
    },
    label: {
      control: "text",
      description:
        "The text at the left of the row, naming what is progressing. It also becomes the " +
        "bar's accessible name unless you passed one.",
    },
    indicatorClassName: {
      control: "text",
      description: "Classes for the fill, which is otherwise unreachable from outside",
    },
    trackClassName: {
      control: "text",
      description: "Classes for the bar itself — a height other than the 12px default",
    },
    className: {
      control: "text",
      description: "Classes for the root: the column holding the row and the bar. Width goes here",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

/**
 * Drag the `value` control to watch the fill move — every change animates.
 *
 * A bar with no row drawn has nothing that can name it: the root is a
 * `role="progressbar"`, and its percentage says how far along something is, never what.
 * So this one passes `aria-label`, and so should every call site without a `label` —
 * with one, the label names the bar itself and there is nothing to remember.
 */
export const Default: Story = {
  args: { value: 56, className: "w-96", "aria-label": "Upload progress" },
};

/**
 * The one story that moves. Press a value to watch the fill travel to it, or drag the
 * range to steer it.
 *
 * Every change animates, because that is all the component does — one value in, one 300ms
 * sweep. Nothing here schedules frames: a click or a drag has already given the browser
 * the painted frame a transition needs to start from. The only case with no frame to
 * animate from is the very first render, which is why a bar mounted at 100 is simply born
 * full rather than filling in.
 */
const PRESETS = [0, 25, 50, 75, 100];

/**
 * Module scope, not inside `render`. Storybook re-invokes `render()` on every args or
 * globals change, so a component declared in there is a fresh type each time: React
 * unmounts the old tree, mounts a new one, and `useState` re-initialises. Drag this bar to
 * 75, switch the theme in the toolbar, and it would snap back to 0 — in the one story
 * whose entire purpose is to be driven by hand.
 */
function FillingDemo() {
  const [value, setValue] = useState(0);

  return (
    <div className="flex w-96 flex-col gap-5">
      <Progress value={value} label="Upload progress" className="w-96" />
      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            size="sm"
            variant={preset === value ? "default" : "secondary"}
            onClick={() => setValue(preset)}
          >
            {preset}
          </Button>
        ))}
      </div>
      {/* A native range rather than our own `Slider`: that one is still WIP, and the
          shadcn classes it carries have no DS v2 token behind them, so it renders
          invisible under every theme this Storybook ships. */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        aria-label="Progress value"
        className="w-96"
      />
    </div>
  );
}

export const Filling: Story = {
  render: () => <FillingDemo />,
};

/**
 * Figma's own composition (node 717:10590): the label at the left of the row above the bar,
 * the percentage at the right. The row sits above the bar rather than over the fill, so
 * nothing here depends on the bar being taller than its 12px — and the label is what names
 * the bar, so there is no `aria-label` to pass.
 */
export const WithLabel: Story = {
  args: { value: 56, label: "Upload progress", className: "w-96" },
};

/**
 * The row without a label: `justify-between` leaves the percentage at the right edge. This
 * one does need an `aria-label` — a percentage names nothing on its own.
 */
export const PercentageOnly: Story = {
  args: { value: 45, showLabel: true, className: "w-96", "aria-label": "Upload progress" },
};

/**
 * A label long enough to meet the percentage it shares the row with. Figma hardcodes a
 * short one, so this is the case the design does not answer: the label truncates and the
 * percentage never does, because a percentage clipped to `5…` is worse than a name clipped
 * to `Deposit bonus wa…`.
 */
export const LongLabel: Story = {
  args: {
    value: 56,
    label: "Deposit bonus wagering requirement remaining",
    className: "w-96",
  },
};

/**
 * Figma's `Percent=100`. Radix marks the root and the fill `data-state="complete"` here,
 * so a consumer can style completion without a prop for it — the design does not draw a
 * different fill at 100, so this one does not either.
 */
export const Complete: Story = {
  args: { value: 100, className: "w-96", "aria-label": "Upload progress" },
};

/**
 * The combined story, and the only one the visual suite photographs. A state that is not
 * here is covered by nothing.
 *
 * `Filling` is deliberately absent: it is mid-animation by design, so a baseline of it
 * would be a different image on every run.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-4">
      {[0, 25, 30, 50, 60, 75, 100].map((value) => (
        <Progress key={value} value={value} className="w-96" aria-label={`Progress ${value}%`} />
      ))}
      <Progress value={56} label="Upload progress" className="w-96" />
      <Progress value={45} showLabel className="w-96" aria-label="Percentage only" />
      <Progress value={70} className="w-96" trackClassName="h-1" aria-label="Thin bar" />
    </div>
  ),
};
