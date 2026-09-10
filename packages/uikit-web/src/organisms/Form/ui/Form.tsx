"use client";

import * as React from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
} from "react-hook-form";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";

import { FormFieldContext, FormItemContext, useFormField } from "@/organisms/Form/lib/useFormField";
import { Label } from "@/atoms/Label";
import { bodyVariants } from "@/atoms/Typography";
import { cn } from "@/lib/utils";

// What a bound field takes from react-hook-form. Every `Form*` field is the
// `FormField` pattern with the boilerplate collapsed, so they all accept the
// same controller props and supply `render` themselves — spelling that out once
// is what keeps the three of them from drifting.
//
// Plain `//` rather than a JSDoc block on purpose: `codegen:docs` pairs the most
// recent `/** */` with the next declaration, so a documented type here would
// hand its text to `Form` below.
type FormBinding<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<ControllerProps<TFieldValues, TName>, "render">;

/**
 * A wrapper around react-hook-form that provides composable form components.
 * Provides form validation, accessibility, and error handling out of the box.
 *
 * @see [Reference](https://react-hook-form.com)
 * @see [Documentation](https://ui.shadcn.com/docs/components/form)
 */
const Form = FormProvider;

/**
 * A controlled form field component that integrates with react-hook-form.
 *
 * @template TFieldValues - Type of form values
 * @template TName - Type of field name
 * @param {ControllerProps<TFieldValues, TName>} props - Props for the form field controller
 *
 * @example
 * <FormField
 *   control={form.control}
 *   name="email"
 *   render={({ field }) => (
 *     <FormItem>
 *       <FormLabel>Email</FormLabel>
 *       <FormControl>
 *         <Input {...field} />
 *       </FormControl>
 *       <FormDescription>Enter your email address</FormDescription>
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

/**
 * Container component for form field elements.
 * Provides context for form field components.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {string} [data-testid] - Names the field; its parts become `<base>-label`,
 * `<base>-control`, `<base>-description` and `<base>-message`
 * @param {React.ComponentProps<'div'>} props - Props for the div element
 */
function FormItem({
  className,
  ...props
}: React.ComponentProps<"div"> & { "data-testid"?: string }) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id, testId: props["data-testid"] }}>
      <div className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

/**
 * Label component for form fields.
 * Integrates with FormField for error states.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ComponentProps<typeof LabelPrimitive.Root>} props - Props for the label element
 */
function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId, testIdFor } = useFormField();

  return (
    <Label
      data-error={!!error}
      data-testid={testIdFor("label")}
      className={cn("data-[error=true]:text-foreground-feedback-negative", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

/**
 * Control component that provides proper aria attributes and form state to form inputs.
 *
 * @param {React.ComponentProps<typeof Slot>} props - Props for the control element
 */
function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId, testIdFor } = useFormField();

  return (
    // On the `Slot`, so it reaches whatever control was composed in. Radix gives
    // the child's own props precedence, so a control that already has a
    // `data-testid` keeps it.
    <Slot
      data-testid={testIdFor("control")}
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
}

/**
 * Description component for form fields.
 * Provides additional context or instructions for the form field.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ComponentProps<'p'>} props - Props for the paragraph element
 */
function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId, testIdFor } = useFormField();

  return (
    <p
      data-testid={testIdFor("description")}
      id={formDescriptionId}
      // `Body/Small/Regular` — Figma gives the helper text under Input
      // (`56:705`) and under Select (`531:1917`) the same style, and its line
      // height of 1.46 lives only inside the composite, so it has to come from
      // `bodyVariants` rather than be written out. The colour follows the
      // design's `foreground/onpage/muted`.
      className={cn(
        bodyVariants({ size: "s", weight: "regular" }),
        "text-foreground-on-page-muted",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Message component for displaying form field errors.
 * Automatically displays error messages from form validation.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ComponentProps<'p'>} props - Props for the paragraph element
 */
function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId, testIdFor } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-testid={testIdFor("message")}
      id={formMessageId}
      // The same `Body/Small/Regular`; Figma swaps only the colour for the error
      // state of the field (`492:11976` on Input, `531:1928` on Select), which
      // is `foreground/feedback/negative`.
      className={cn(
        bodyVariants({ size: "s", weight: "regular" }),
        "text-foreground-feedback-negative",
        className,
      )}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  Form,
  type FormBinding,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
};
