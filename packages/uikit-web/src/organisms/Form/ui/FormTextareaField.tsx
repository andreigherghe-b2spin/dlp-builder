"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import { type FormBinding, FormField } from "@/organisms/Form/ui/Form";
import { errorMessage } from "@/organisms/Form/lib/utils";
import { TextareaField, type TextareaFieldProps } from "@/molecules/TextareaField";

type FormTextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<TextareaFieldProps, "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "ref"> &
  FormBinding<TFieldValues, TName>;

/**
 * [TextareaField](../../../molecules/TextareaField.tsx) wired to
 * react-hook-form — the `FormField` pattern with the boilerplate collapsed. It
 * composes `FormField`, so reach for the primitives when a field needs something
 * between the form and the box, and for this when it does not. `control` may be
 * omitted inside a `<Form>`.
 *
 * There is no `allow` or `showValidation` here, unlike
 * [FormTextField](./FormTextField.tsx): the design draws no validation glyph on
 * a textarea, and a keystroke filter over prose is a rule looking for a field it
 * does not have. `maxLength` is native and works as it always did.
 *
 * @example
 * ```tsx
 * <FormTextareaField
 *   control={control}
 *   name="message"
 *   label="Message"
 *   rows={5}
 *   placeholder="Type your message here."
 *   rules={{ required: 'A message is required.' }}
 * />
 * ```
 */
function FormTextareaField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  error,
  invalid,
  ...props
}: FormTextareaFieldProps<TFieldValues, TName>) {
  return (
    <FormField<TFieldValues, TName>
      name={name}
      control={control}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <TextareaField
          {...props}
          {...field}
          // `undefined` until the field registers, which would start the box
          // uncontrolled and switch it over on the first keystroke.
          value={field.value ?? ""}
          error={error ?? errorMessage(fieldState)}
          invalid={invalid ?? fieldState.invalid}
        />
      )}
    />
  );
}

export { FormTextareaField, type FormTextareaFieldProps };
