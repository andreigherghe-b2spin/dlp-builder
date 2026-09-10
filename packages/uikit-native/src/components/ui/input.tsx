import { TextInput, type TextInputProps } from "react-native";

/**
 * A form input component with support for various input types and states.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [placeholder] - Placeholder text
 * @param {TextInputProps} props - Props for the TextInput element
 *
 * @example
 * ```tsx
 * import { Input } from '@ui/native/input';
 *
 * <Input placeholder="Enter your email" />
 * ```
 *
 * @cssVariables
 * - `--input-border-radius`
 * - `--input-border-width`
 * - `--input-border-bottom-width`
 * - `--input-border-color`
 * - `--input-background-color`
 * - `--input-padding-inline`
 * - `--input-color`
 * - `--input-placeholder-color`
 * - `--input-focus-border-color`
 * - `--input-box-shadow-color`
 */
function Input({ className, ...props }: TextInputProps) {
  return <TextInput className={`${styles} ${className ?? ""}`} {...props} />;
}

const styles = [
  "flex h-9 w-full min-w-0 text-(--input-color) shadow-[inset_0_4px_4px_var(--input-box-shadow-color)]",
  "rounded-(--input-border-radius) border-(length:--input-border-width) border-b-(length:--input-border-bottom-width) border-(--input-border-color) bg-(--input-background-color) px-(--input-padding-inline) placeholder:text-(--input-placeholder-color) focus-visible:border-(--input-focus-border-color)",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:text-destructive aria-invalid:placeholder:text-destructive",
].join(" ");

export { Input };
