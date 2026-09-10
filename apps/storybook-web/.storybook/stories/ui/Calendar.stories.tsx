import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { addDays, format } from "date-fns";

import { Calendar } from "@ui/web/Calendar";

const meta: Meta<typeof Calendar> = {
  title: "WIP/Organisms/Calendar",
  id: "Calendar",
  component: Calendar,
  tags: ["autodocs", "status:wip", "level:organisms"],
  argTypes: {
    mode: {
      control: { type: "select" },
      options: ["single", "multiple", "range", "default"],
      description: "Selection mode of the calendar",
    },
    showOutsideDays: {
      control: "boolean",
      description: "Whether to show days from the previous/next months",
    },
    disabled: {
      control: "boolean",
      description: "Disable the calendar",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
  args: {
    mode: "single",
    showOutsideDays: true,
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: (args) => {
    const DefaultCalendar = () => {
      const [date, setDate] = useState<Date | undefined>(new Date(2024, 2, 15));

      return (
        <Calendar
          {...args}
          mode="single"
          selected={date}
          onSelect={setDate}
          className="w-fit border shadow"
        />
      );
    };

    return <DefaultCalendar />;
  },
};

export const Multiple: Story = {
  render: () => {
    const MultipleCalendar = () => {
      const [dates, setDates] = useState<Date[] | undefined>([
        new Date(2024, 2, 15),
        addDays(new Date(2024, 2, 15), 2),
        addDays(new Date(2024, 2, 15), 5),
      ]);

      return (
        <div className="w-fit space-y-4">
          <Calendar
            mode="multiple"
            selected={dates}
            onSelect={setDates}
            className="border shadow"
          />
          <div className="text-sm">
            <p>Selected dates:</p>
            <ul className="list-disc pl-4">
              {dates?.map((date) => (
                <li key={date.toString()}>{format(date, "PPP")}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    };

    return <MultipleCalendar />;
  },
};

export const Range: Story = {
  render: () => {
    const RangeCalendar = () => {
      const today = new Date(2024, 2, 15);
      const [range, setRange] = useState<{
        from: Date;
        to: Date;
      }>({
        from: today,
        to: addDays(today, 7),
      });

      return (
        <div className="w-fit space-y-4">
          <Calendar
            mode="range"
            selected={range}
            // @ts-expect-error - Expected error from react-day-picker
            onSelect={setRange}
            className="border shadow"
          />
          <div className="text-sm">
            <p>Selected range:</p>
            <p>
              {range.from && format(range.from, "PPP")}
              {range.to && ` - ${format(range.to, "PPP")}`}
            </p>
          </div>
        </div>
      );
    };

    return <RangeCalendar />;
  },
};

export const Disabled: Story = {
  render: () => <Calendar mode="single" disabled className="w-fit border shadow" />,
};

export const DisabledDates: Story = {
  render: () => {
    const DisabledDatesCalendar = () => {
      const today = new Date(2024, 2, 15);
      const [date, setDate] = useState<Date | undefined>(today);
      const disabledDays = [{ before: today }, { dayOfWeek: [0, 6] }];

      return (
        <div className="w-fit space-y-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={disabledDays}
            className="border shadow"
          />
          <p className="text-sm">Weekends and past dates are disabled</p>
        </div>
      );
    };

    return <DisabledDatesCalendar />;
  },
};

export const MultipleMonths: Story = {
  render: () => {
    const MultipleMonthsCalendar = () => {
      const [date, setDate] = useState<Date | undefined>(new Date(2024, 2, 15));

      return (
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
          className="w-fit border shadow"
        />
      );
    };

    return <MultipleMonthsCalendar />;
  },
};
