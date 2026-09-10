"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker";

import { cn } from "@/lib/utils";
import { type ButtonProps, buttonVariants } from "@/atoms/Button";

/**
 * A date field component that allows users to enter and edit date.
 * Built on top of react-day-picker.
 *
 * - @param {string} [className] - Additional CSS classes to apply to the calendar container
 * - @param {object} [classNames] - Custom CSS class names for various calendar elements
 * - @param {boolean} [showOutsideDays=true] - Whether to show days from previous/next months
 * - @param {string} [captionLayout='label'] - Layout style for the month/year caption ('label' | 'dropdown' | 'dropdown-months' | 'dropdown-years')
 * - @param {('default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'custom')} [buttonVariant='custom'] - Visual variant for navigation buttons
 * - @param {object} [formatters] - Custom formatter functions for calendar labels and text
 * - @param {object} [components] - Custom component overrides for internal calendar elements
 *
 * @example
 * import { Calendar } from '@ui/web/Calendar'
 * ```tsx
 * // Basic usage
 * <Calendar />
 *
 * // With selected date
 * <Calendar
 *   mode="single"
 *   selected={date}
 *   onSelect={setDate}
 * />
 *
 * // With date range
 * <Calendar
 *   mode="range"
 *   selected={dateRange}
 *   onSelect={setDateRange}
 * />
 * ```
 *
 * @cssVariables
 * - `--calendar-border-radius` - Border radius for the calendar
 * - `--calendar-nav-button-background-color` - Background color for the calendar navigation buttons
 * - `--calendar-nav-button-hover-color` - Color for the hover navigation button
 * - `--calendar-day-hover-color` - Color for the hover day
 * - `--calendar-day-selected-background-color` - Background color for the selected day
 * - `--calendar-day-selected-color` - Color for the selected day
 * - `--calendar-day-today-background-color` - Background color for the today's day
 * - `--calendar-day-today-color` - Color for the today's day
 * - `--calendar-day-outside-selected-color` - Color for the selected day outside the calendar
 * - `--calendar-day-outside-hover-color` - Color for the hover day outside the calendar
 *
 * @see [API Reference](https://daypicker.dev)
 * @see [Documentation](https://ui.shadcn.com/docs/components/calendar)
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "custom",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: ButtonProps["variant"] | "custom";
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar p-3 [--cell-size:--spacing(8)] [[data-card-content]_&]:bg-transparent [[data-popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        "bg-card rounded-(--calendar-border-radius)",
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariant === "custom"
            ? "border-input text-foreground hover:bg-accent rounded-(--calendar-border-radius) bg-(--calendar-nav-button-background-color) hover:text-(--calendar-nav-button-hover-color) flex items-center justify-center border opacity-50 shadow-sm hover:opacity-100"
            : buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariant === "custom"
            ? "border-input text-foreground hover:bg-accent rounded-(--calendar-border-radius) bg-(--calendar-nav-button-background-color) hover:text-(--calendar-nav-button-hover-color) flex items-center justify-center border opacity-50 shadow-sm hover:opacity-100"
            : buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "h-(--cell-size) px-(--cell-size) flex w-full items-center justify-center",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "h-(--cell-size) flex w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input has-focus:ring-ring/50 rounded-(--calendar-border-radius) shadow-xs has-focus:ring-[3px] relative border",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("bg-card absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-(--calendar-border-radius) flex-1 select-none text-[0.8rem] font-normal",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day [&:last-child[data-selected=true]_button]:rounded-r-(--calendar-border-radius) relative aspect-square h-full w-full select-none p-0 text-center",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--calendar-border-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--calendar-border-radius)",
          defaultClassNames.day,
        ),
        range_start: cn(
          "bg-accent rounded-l-(--calendar-border-radius)",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "bg-accent rounded-r-(--calendar-border-radius)",
          defaultClassNames.range_end,
        ),
        today: cn(
          "bg-(--calendar-day-today-background-color) text-(--calendar-day-today-color) rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground hover:bg-accent hover:text-(--calendar-day-outside-hover-color) aria-selected:text-(--calendar-day-outside-selected-color) rounded-md opacity-50",
          defaultClassNames.outside,
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
          }

          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
          }

          return <ChevronDownIcon className={cn("size-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="size-(--cell-size) flex items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 min-w-(--cell-size) data-[selected-single=true]:bg-(--calendar-day-selected-background-color) data-[selected-single=true]:text-(--calendar-day-selected-color) flex aspect-square size-auto w-full flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-start=true]:rounded-l-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
        "flex items-center justify-center",
        "[&:has([aria-selected])]:bg-(--calendar-day-selected-background-color) [&:has([aria-selected].day-range-end)]:rounded-r-(--calendar-border-radius) relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        "text-foreground hover:bg-accent rounded-(--calendar-border-radius) hover:text-(--calendar-day-hover-color) aria-selected:bg-(--calendar-day-selected-background-color) aria-selected:text-(--calendar-day-selected-color) size-8 p-0 font-normal aria-selected:opacity-100",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
