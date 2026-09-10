import { TextInput, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";

/**
 * A multi-line text input component.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {number} [numberOfLines=2] - Number of visible lines
 * @param {TextInputProps} props - Props for the TextInput element
 *
 * @example
 * ```tsx
 * import { Textarea } from '@ui/native/textarea';
 *
 * <Textarea placeholder="Enter your message" />
 * <Textarea numberOfLines={6} placeholder="More space..." />
 * ```
 *
 * @cssVariables
 * - `--textarea-background-color`
 * - `--textarea-border-bottom-width`
 * - `--textarea-border-color`
 * - `--textarea-border-radius`
 * - `--textarea-border-width`
 * - `--textarea-box-shadow-color`
 * - `--textarea-color`
 * - `--textarea-focus-border-color`
 * - `--textarea-hover-border-color`
 * - `--textarea-padding-inline`
 * - `--textarea-placeholder-color`
 */
function Textarea({ className, numberOfLines = 2, ...props }: TextInputProps) {
  return (
    <TextInput
      data-slot="textarea"
      className={cn(
        "field-sizing-content px-(--textarea-padding-inline) shadow-xs flex min-h-16 w-full py-2 text-base outline-none md:text-sm",
        "rounded-(--textarea-border-radius) border-(length:--textarea-border-width) border-b-(length:--textarea-border-bottom-width) border-(--textarea-border-color) bg-(--textarea-background-color) text-(--textarea-color) placeholder:text-(--textarea-placeholder-color) focus-visible:border-(--textarea-focus-border-color)",
        "aria-invalid:text-destructive aria-invalid:placeholder:text-destructive aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "shadow-[inset_0_4px_4px_var(--textarea-box-shadow-color)]",
        className,
      )}
      multiline
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      scrollEnabled
      {...props}
    />
  );
}

export { Textarea };
