import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "@ui/web/Input";
import { Label } from "@ui/web/Label";
import { Slider } from "@ui/web/Slider";

const meta: Meta<typeof Slider> = {
  title: "WIP/Atoms/Slider",
  id: "Slider",
  component: Slider,
  tags: ["autodocs", "status:wip", "level:atoms"],
  argTypes: {
    defaultValue: {
      control: "object",
      description: "The default value of the slider",
    },
    value: {
      control: "object",
      description: "The controlled value of the slider",
    },
    min: {
      control: "number",
      description: "The minimum value of the slider",
      defaultValue: 0,
    },
    max: {
      control: "number",
      description: "The maximum value of the slider",
      defaultValue: 100,
    },
    step: {
      control: "number",
      description: "The step value of the slider",
      defaultValue: 1,
    },
    disabled: {
      control: "boolean",
      description: "Whether the slider is disabled",
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "The orientation of the slider",
    },
    onValueChange: {
      action: "onValueChange",
      description: "Event handler called when the value changes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
    className: "w-75",
  },
};

export const Range: Story = {
  args: {
    defaultValue: [25, 75],
    max: 100,
    step: 1,
    className: "w-75",
  },
};

export const WithSteps: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Label htmlFor="steps-slider" className="mb-2 block">
          Steps: 10
        </Label>
        <Slider id="steps-slider" defaultValue={[50]} max={100} step={10} className="w-75" />
      </div>
      <div>
        <Label htmlFor="small-steps-slider" className="mb-2 block">
          Steps: 1
        </Label>
        <Slider id="small-steps-slider" defaultValue={[50]} max={100} step={1} className="w-75" />
      </div>
    </div>
  ),
};

export const MinMax: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Label htmlFor="minmax-slider-1" className="mb-2 block">
          Range: 0 to 100
        </Label>
        <Slider
          id="minmax-slider-1"
          defaultValue={[50]}
          min={0}
          max={100}
          step={1}
          className="w-75"
        />
      </div>
      <div>
        <Label htmlFor="minmax-slider-2" className="mb-2 block">
          Range: -50 to 50
        </Label>
        <Slider
          id="minmax-slider-2"
          defaultValue={[0]}
          min={-50}
          max={50}
          step={1}
          className="w-75"
        />
      </div>
      <div>
        <Label htmlFor="minmax-slider-3" className="mb-2 block">
          Range: 1000 to 10000
        </Label>
        <Slider
          id="minmax-slider-3"
          defaultValue={[5000]}
          min={1000}
          max={10000}
          step={100}
          className="w-75"
        />
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
    disabled: true,
    className: "w-75",
  },
};

export const Vertical: Story = {
  render: () => (
    <div className="h-50 flex items-center justify-center">
      <Slider defaultValue={[50]} max={100} step={1} orientation="vertical" className="h-50" />
    </div>
  ),
};

export const ControlledExample: Story = {
  render: () => {
    // We need to use a function component here for state
    const ControlledSlider = () => {
      const [value, setValue] = useState<number[]>([50]);

      return (
        <div className="space-y-8">
          <Slider value={value} onValueChange={setValue} max={100} step={1} className="w-75" />
          <div className="flex items-center gap-4">
            <Label htmlFor="slider-value">Value:</Label>
            <Input
              id="slider-value"
              type="number"
              value={value[0]}
              onChange={(e) => setValue([Number(e.target.value)])}
              className="w-24"
            />
          </div>
        </div>
      );
    };

    return <ControlledSlider />;
  },
};

export const ManyThumbs: Story = {
  args: {
    defaultValue: [10, 30, 50, 80],
    max: 100,
    step: 1,
    className: "w-75",
  },
};

export const CustomStyles: Story = {
  render: () => (
    <div className="space-y-8">
      <Slider defaultValue={[50]} max={100} step={1} className="w-75" />
      <Slider
        defaultValue={[50]}
        max={100}
        step={1}
        className="w-75 [&_[data-slider-range]]:bg-green-500"
      />
      <Slider
        defaultValue={[50]}
        max={100}
        step={1}
        className="w-75 [&_[data-slider-range]]:bg-red-500"
      />
      <Slider
        defaultValue={[50]}
        max={100}
        step={1}
        className="w-75 [&_[data-slider-range]]:bg-yellow-500 [&_[data-slider-thumb]]:bg-yellow-500"
      />
    </div>
  ),
};
