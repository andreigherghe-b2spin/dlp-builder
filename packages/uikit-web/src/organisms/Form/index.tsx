"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the ones on the files behind
// this barrel are dropped on the way into dist/. So the boundary is declared
// here, where the built consumer actually sees it. Every export below is
// client-only anyway: they render Radix primitives and read React context.

/**
 * The public surface of `@ui/web/Form`.
 *
 * Two layers live behind it. `ui/Form.tsx` holds the composable primitives —
 * `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`,
 * `FormDescription`, `FormMessage` — for a field that needs something between
 * the form and the control. The `Form*Field` files are those primitives already
 * assembled around one of the design system's fields, which is what most forms
 * want.
 *
 * `lib/` is internal: the contexts behind `useFormField`, and the pure helpers
 * the bound fields share. Nothing outside this directory imports deeper than
 * `@ui/web/Form`.
 */
export { FormCheckbox, type FormCheckboxProps } from "@/organisms/Form/ui/FormCheckbox";
export { FormSelectField, type FormSelectFieldProps } from "@/organisms/Form/ui/FormSelectField";
export { FormSwitch, type FormSwitchProps } from "@/organisms/Form/ui/FormSwitch";
export { FormTextField, type FormTextFieldProps } from "@/organisms/Form/ui/FormTextField";
export {
  FormTextareaField,
  type FormTextareaFieldProps,
} from "@/organisms/Form/ui/FormTextareaField";
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/organisms/Form/ui/Form";
export { useFormField } from "@/organisms/Form/lib/useFormField";
