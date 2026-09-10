import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@ui/web/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/web/Popover";

const meta: Meta<typeof Popover> = {
  title: "WIP/Molecules/Popover",
  id: "Popover",
  component: Popover,
  tags: ["autodocs", "status:wip", "level:molecules"],
};

export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4 p-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Popover Content</h4>
            <p className="text-muted-foreground text-sm">
              This is a simple popover with some basic content.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const DifferentAlignments: Story = {
  render: (args) => (
    <div className="flex gap-2">
      <Popover {...args}>
        <PopoverTrigger asChild>
          <Button variant="outline">Start</Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <p className="text-muted-foreground p-2 text-sm">Aligned to start</p>
        </PopoverContent>
      </Popover>
      <Popover {...args}>
        <PopoverTrigger asChild>
          <Button variant="outline">Center</Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-80">
          <p className="text-muted-foreground p-2 text-sm">Aligned to center</p>
        </PopoverContent>
      </Popover>
      <Popover {...args}>
        <PopoverTrigger asChild>
          <Button variant="outline">End</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <p className="text-muted-foreground p-2 text-sm">Aligned to end</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
  name: "Different Alignments",
};

export const CustomSideOffset: Story = {
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button variant="outline">Open with Offset</Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={12} className="w-72">
        <div className="grid gap-4 p-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Larger Offset</h4>
            <p className="text-muted-foreground text-sm">
              This popover has a larger side offset of 12px.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  name: "Custom Side Offset",
};
