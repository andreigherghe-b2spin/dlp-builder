"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import { CheckboxField, type CheckboxFieldProps } from "@/molecules/CheckboxField";
import { type FormBinding, FormField } from "@/organisms/Form/ui/Form";
import { errorMessage } from "@/organisms/Form/lib/utils";

type FormCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<
  CheckboxFieldProps,
  | "name"
  | "checked"
  | "defaultChecked"
  | "value"
  | "defaultValue"
  | "onCheckedChange"
  | "onBlur"
  | "ref"
> &
  FormBinding<TFieldValues, TName>;

/**
 * [CheckboxField](../../checkboxField.tsx) wired to react-hook-form, the
 * counterpart to [FormTextField](#formtextfield). `control` may be omitted
 * inside a `<Form>`.
 *
 * A checkbox is boolean, so the binding is `checked`/`onCheckedChange` rather
 * than `value`/`onChange`. Radix reports `"indeterminate"` too, which is not a
 * form value — it is coerced to `false` on the way into the field so the form
 * never holds a string where a boolean belongs.
 *
 * @example
 * ```tsx
 * <FormCheckbox
 *   control={control}
 *   name="terms"
 *   label="Accept terms and conditions"
 *   description="You can withdraw consent at any time."
 *   rules={{ required: 'Please accept to continue.' }}
 * />
 * ```
 */
function FormCheckbox<
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
}: FormCheckboxProps<TFieldValues, TName>) {
  return (
    <FormField<TFieldValues, TName>
      name={name}
      control={control}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <CheckboxField
          {...props}
          name={field.name}
          ref={field.ref}
          disabled={field.disabled}
          onBlur={field.onBlur}
          // `undefined` until the field registers, which would start the box
          // uncontrolled and switch it over on the first click.
          checked={field.value ?? false}
          onCheckedChange={(checked) => field.onChange(checked === true)}
          error={error ?? errorMessage(fieldState)}
          invalid={invalid ?? fieldState.invalid}
        />
      )}
    />
  );
}

export { FormCheckbox, type FormCheckboxProps };
