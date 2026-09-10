"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import { type FormBinding, FormField } from "@/organisms/Form/ui/Form";
import { errorMessage, validationFor } from "@/organisms/Form/lib/utils";
import { SelectField, type SelectFieldProps } from "@/molecules/SelectField";

type FormSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<SelectFieldProps, "name" | "value" | "defaultValue" | "onValueChange" | "onBlur" | "ref"> &
  FormBinding<TFieldValues, TName> & {
    /**
     * Show the validation glyph once the field has been touched. `validation`
     * still wins, so a field can be forced either way.
     */
    showValidation?: boolean;
  };

/**
 * [SelectField](../../selectField.tsx) wired to react-hook-form, the counterpart
 * to [FormTextField](#formtextfield). `control` may be omitted inside a
 * `<Form>`.
 *
 * A select has no `onChange` — Radix reports the choice through
 * `onValueChange`, and there is no event to forward — so the binding is spelled
 * out rather than spread. `ref` lands on the trigger, which is the focusable
 * element, so a failed submit can focus the field.
 *
 * @example
 * ```tsx
 * <FormSelectField
 *   control={control}
 *   name="country"
 *   label="Country"
 *   placeholder="Select a country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'ca', label: 'Canada' },
 *   ]}
 *   rules={{ required: 'Pick a country.' }}
 * />
 * ```
 */
function FormSelectField<
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
  showValidation,
  validation,
  ...props
}: FormSelectFieldProps<TFieldValues, TName>) {
  return (
    <FormField<TFieldValues, TName>
      name={name}
      control={control}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <SelectField
          {...props}
          name={field.name}
          ref={field.ref}
          disabled={field.disabled}
          onBlur={field.onBlur}
          // `undefined` until the field registers, which would start the select
          // uncontrolled and switch it over on the first choice. No item can
          // carry `""`, so an empty string reads as "nothing chosen" and the
          // placeholder stays.
          value={field.value ?? ""}
          onValueChange={field.onChange}
          error={error ?? errorMessage(fieldState)}
          invalid={invalid ?? fieldState.invalid}
          validation={validationFor({ validation, showValidation, fieldState })}
        />
      )}
    />
  );
}

export { FormSelectField, type FormSelectFieldProps };
