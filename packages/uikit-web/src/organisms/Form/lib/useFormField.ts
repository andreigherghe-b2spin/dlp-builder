"use client";

import * as React from "react";
import { type FieldPath, type FieldValues, useFormContext, useFormState } from "react-hook-form";

import { createTestIdFor } from "@/lib/utils";

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

type FormItemContextValue = {
  id: string;
  /** Base the field's parts derive their `data-testid` from. Set by `FormItem`. */
  testId?: string;
};

// Both contexts live here rather than beside the components that provide them,
// because `useFormField` reads both: keeping `FormItemContext` next to
// `FormItem` would make the hook and `ui/Form.tsx` import each other.
const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

/**
 * Reads the field's name, its generated ids and its validation state. Must be
 * used inside a `FormField`.
 *
 * @returns {Object} The field's id set, its `data-testid` deriver and its react-hook-form state
 * @throws {Error} If used outside of a FormField component
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id, testId } = itemContext;

  return {
    id,
    testId,
    // The parts are `<base>-label`, `<base>-control`, `<base>-message`; every one
    // of them already calls this hook, so none has to be handed the base.
    testIdFor: createTestIdFor(testId),
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

export {
  FormFieldContext,
  type FormFieldContextValue,
  FormItemContext,
  type FormItemContextValue,
  useFormField,
};
