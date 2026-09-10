"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import { SwitchField, type SwitchFieldProps } from "@/molecules/SwitchField";
import { type FormBinding, FormField } from "@/organisms/Form/ui/Form";
import { errorMessage } from "@/organisms/Form/lib/utils";

type FormSwitchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<
  SwitchFieldProps,
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
 * [SwitchField](../../../molecules/SwitchField.tsx) wired to react-hook-form,
 * the counterpart to [FormCheckbox](#formcheckbox). `control` may be omitted
 * inside a `<Form>`.
 *
 * A switch is boolean, so the binding is `checked`/`onCheckedChange` rather than
 * `value`/`onChange`. Radix reports a plain boolean here — there is no
 * indeterminate state to coerce, unlike a checkbox.
 *
 * @example
 * ```tsx
 * <FormSwitch
 *   control={control}
 *   name="marketing"
 *   label="Marketing emails"
 *   description="Occasional offers and product news."
 * />
 * ```
 */
function FormSwitch<
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
}: FormSwitchProps<TFieldValues, TName>) {
  return (
    <FormField<TFieldValues, TName>
      name={name}
      control={control}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <SwitchField
          {...props}
          name={field.name}
          ref={field.ref}
          disabled={field.disabled}
          onBlur={field.onBlur}
          // `undefined` until the field registers, which would start the track
          // uncontrolled and switch it over on the first toggle.
          checked={field.value ?? false}
          onCheckedChange={field.onChange}
          error={error ?? errorMessage(fieldState)}
          invalid={invalid ?? fieldState.invalid}
        />
      )}
    />
  );
}

export { FormSwitch, type FormSwitchProps };
