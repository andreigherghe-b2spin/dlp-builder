"use client";

import * as React from "react";
import type { FieldPath, FieldValues } from "react-hook-form";

import { type FormBinding, FormField } from "@/organisms/Form/ui/Form";
import { acceptMatcher, errorMessage, validationFor } from "@/organisms/Form/lib/utils";
import { TextField, type TextFieldProps } from "@/molecules/TextField";

type FormTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<TextFieldProps, "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "ref"> &
  FormBinding<TFieldValues, TName> & {
    /**
     * Drops keystrokes that would leave the value not matching. Not validation:
     * it says nothing to the user, and an empty value always passes. Keep the
     * rule that produces a message in `rules`.
     */
    allow?: RegExp;
    /**
     * Show the validation glyph once the field has been touched. `validation`
     * still wins, so a field can be forced either way.
     */
    showValidation?: boolean;
  };

/**
 * [TextField](../../textField.tsx) wired to react-hook-form — the `FormField`
 * pattern with the boilerplate collapsed. It composes `FormField`, so reach for
 * the primitives when a field needs something between the form and the input,
 * and for this when it does not. `control` may be omitted inside a `<Form>`.
 *
 * @example
 * ```tsx
 * <FormTextField
 *   control={control}
 *   name="zip"
 *   label="ZIP code"
 *   inputMode="numeric"
 *   allow={/^\d*$/}
 *   showValidation
 *   rules={{ pattern: { value: /^\d{5}$/, message: 'Five digits.' } }}
 * />
 * ```
 */
function FormTextField<
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
  allow,
  showValidation,
  validation,
  ...props
}: FormTextFieldProps<TFieldValues, TName>) {
  const accept = React.useMemo(() => acceptMatcher(allow), [allow]);

  return (
    <FormField<TFieldValues, TName>
      name={name}
      control={control}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          {...field}
          // `undefined` until the field registers, which would start the input
          // uncontrolled and switch it over on the first keystroke.
          value={field.value ?? ""}
          onChange={(event) => {
            const { value } = event.currentTarget;

            if (accept && value !== "" && !accept.test(value)) {
              return;
            }

            field.onChange(event);
          }}
          error={error ?? errorMessage(fieldState)}
          invalid={invalid ?? fieldState.invalid}
          validation={validationFor({ validation, showValidation, fieldState })}
        />
      )}
    />
  );
}

export { FormTextField, type FormTextFieldProps };
