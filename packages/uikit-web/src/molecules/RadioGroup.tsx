"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A set of radio buttons where only one can be selected at a time.
 * Built on top of Radix UI's Radio Group primitive.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ComponentProps<typeof RadioGroupPrimitive.Root>} props - Props for the radio group root element
 *
 * @example
 * ```tsx
 * <RadioGroup defaultValue="option-1">
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option-1" id="option-1" />
 *     <Label htmlFor="option-1">Option 1</Label>
 *   </div>
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option-2" id="option-2" />
 *     <Label htmlFor="option-2">Option 2</Label>
 *   </div>
 * </RadioGroup>
 * ```
 *
 * @cssVariables
 * - `--radio-group-background-color` - Background color of unchecked radio buttons
 * - `--radio-group-border-color` - Border color of unchecked radio buttons
 * - `--radio-group-checked-background-color` - Background color of checked radio button
 * - `--radio-group-checked-border-color` - Border color of checked radio button
 * - `--radio-group-checked-color` - Color of the check indicator
 *
 * @see [Reference](https://www.radix-ui.com/primitives/docs/components/radio-group#api-reference)
 * @see [Documentation](https://ui.shadcn.com/docs/components/radio-group)
 */
function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

/**
 * Individual radio button item within a radio group.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} value - The value of the radio button
 * @param {boolean} [disabled] - Whether the radio button is disabled
 * @param {React.ComponentProps<typeof RadioGroupPrimitive.Item>} props - Props for the radio button element
 *
 * @example
 * <RadioGroupItem value="option" id="option">
 *   <RadioGroupIndicator />
 * </RadioGroupItem>
 */
function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive border-(--radio-group-border-color) bg-(--radio-group-background-color) text-(--radio-group-checked-color) shadow-xs data-[state=checked]:border-(--radio-group-checked-border-color) data-[state=checked]:bg-(--radio-group-checked-background-color) aspect-square size-4 shrink-0 rounded-full border outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-(--radio-group-checked-color) absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
