import type * as React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { renderHook } from "vitest-browser-react";

import { FormFieldContext, FormItemContext, useFormField } from "@/organisms/Form/lib/useFormField";

type Values = { email: string };

/**
 * The two contexts and the form the hook reads, wired the way `FormField` and
 * `FormItem` wire them.
 *
 * A real `useForm`, not a stubbed one: the whole hook is a read of
 * react-hook-form's field state, so a fake form would leave it asserting that it
 * returns whatever the fake was told to return.
 */
function providers({
  name = "email" as const,
  id = "field",
  testId,
}: {
  name?: "email";
  id?: string;
  testId?: string;
} = {}) {
  return function Providers({ children }: { children: React.ReactNode }) {
    const form = useForm<Values>({ defaultValues: { email: "" } });

    return (
      <FormProvider {...form}>
        <FormFieldContext.Provider value={{ name }}>
          <FormItemContext.Provider value={{ id, testId }}>{children}</FormItemContext.Provider>
        </FormFieldContext.Provider>
      </FormProvider>
    );
  };
}

/**
 * The form comes back out through the hook rather than through a variable the
 * wrapper assigns while rendering. Writing to a closure during render is the one
 * thing a component must not do, and a harness that did it would be the first
 * thing to break the day this file is run under StrictMode.
 */
const mount = (options?: Parameters<typeof providers>[0]) =>
  renderHook(() => ({ field: useFormField(), form: useFormContext<Values>() }), {
    wrapper: providers(options),
  });

describe("the ids a field wires its parts together with", () => {
  it("derives all three from the item's id", async () => {
    const { result } = await mount();

    expect(result.current.field.id).toBe("field");
    expect(result.current.field.formItemId).toBe("field-form-item");
    expect(result.current.field.formDescriptionId).toBe("field-form-item-description");
    expect(result.current.field.formMessageId).toBe("field-form-item-message");
  });

  it("gives two fields on one page different ids", async () => {
    // These end up in `htmlFor` and `aria-describedby`, so a collision points a
    // label at the wrong input — visible to a screen reader and to nobody else.
    const first = await mount({ id: "email-field" });
    const second = await mount({ id: "password-field" });

    expect(first.result.current.field.formItemId).not.toBe(second.result.current.field.formItemId);
  });

  it("reports the field's name, so a message can address it", async () => {
    const { result } = await mount();

    expect(result.current.field.name).toBe("email");
  });
});

describe("the test ids its parts derive", () => {
  it("names each part after the base `FormItem` was given", async () => {
    const { result } = await mount({ testId: "email-field" });

    expect(result.current.field.testId).toBe("email-field");
    expect(result.current.field.testIdFor("label")).toBe("email-field-label");
    expect(result.current.field.testIdFor("message")).toBe("email-field-message");
  });

  it("names nothing when the field was not named", async () => {
    const { result } = await mount();

    expect(result.current.field.testId).toBeUndefined();
    expect(result.current.field.testIdFor("label")).toBeUndefined();
  });
});

describe("the validation state it reads off the form", () => {
  it("starts clean", async () => {
    const { result } = await mount();

    expect(result.current.field.invalid).toBe(false);
    expect(result.current.field.isTouched).toBe(false);
    expect(result.current.field.isDirty).toBe(false);
    expect(result.current.field.error).toBeUndefined();
  });

  it("picks up an error the form set", async () => {
    const { result, act } = await mount();

    await act(() =>
      result.current.form.setError("email", { type: "required", message: "Required" }),
    );

    expect(result.current.field.invalid).toBe(true);
    expect(result.current.field.error?.message).toBe("Required");
  });

  it("picks up that the field has been touched and changed", async () => {
    const { result, act } = await mount();

    await act(() =>
      result.current.form.setValue("email", "player@example.com", {
        shouldTouch: true,
        shouldDirty: true,
      }),
    );

    expect(result.current.field.isTouched).toBe(true);
    expect(result.current.field.isDirty).toBe(true);
  });

  it("goes clean again once the error is cleared", async () => {
    const { result, act } = await mount();

    await act(() => result.current.form.setError("email", { message: "Required" }));
    await act(() => result.current.form.clearErrors("email"));

    expect(result.current.field.invalid).toBe(false);
    expect(result.current.field.error).toBeUndefined();
  });
});
