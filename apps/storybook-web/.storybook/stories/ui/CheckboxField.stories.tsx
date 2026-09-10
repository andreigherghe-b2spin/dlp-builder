import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { useForm } from "react-hook-form";
import { within } from "storybook/test";

import { Button } from "@ui/web/Button";
import { CheckboxField } from "@ui/web/CheckboxField";
import { Form, FormCheckbox } from "@ui/web/Form";

const meta: Meta<typeof CheckboxField> = {
  title: "Verified/Molecules/CheckboxField",
  id: "CheckboxField",
  component: CheckboxField,
  tags: ["autodocs", "status:verified", "level:molecules"],
  argTypes: {
    label: { control: "text", description: "Text beside the box" },
    description: {
      control: "text",
      description: "Helper text under the label",
    },
    error: {
      control: "text",
      description: "Replaces the helper text and marks the field invalid",
    },
    invalid: {
      control: "boolean",
      description: "Error styling without a message",
    },
    checked: {
      control: "select",
      options: [false, true, "indeterminate"],
      description: "Checked, unchecked, or partially selected",
    },
    disabled: { control: "boolean", description: "Whether the field is disabled" },
  },
  decorators: [
    (Story) => (
      <div className="w-50">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof CheckboxField>;

/** The full anatomy: box, label, description. */
export const Default: Story = {
  args: {
    name: "field",
    label: "Checkbox Text",
    description: "This is a checkbox description.",
    checked: true,
  },
};

/** Figma's `showDescription=false` — label only. */
export const WithoutDescription: Story = {
  args: {
    name: "field",
    label: "Checkbox Text",
    checked: true,
  },
};

export const Unchecked: Story = {
  args: {
    name: "field",
    label: "Checkbox Text",
    description: "This is a checkbox description.",
    checked: false,
  },
};

/** Figma "Status=Indeterminate" — the parent of a partially selected list. */
export const Indeterminate: Story = {
  args: {
    name: "field",
    label: "Checkbox Text",
    description: "This is a checkbox description.",
    checked: "indeterminate",
  },
};

/**
 * Figma "Status=Error" as the design draws it: negative border, negative label,
 * and the description left on `OnPage/Muted`. `invalid` is the status on its
 * own, with nothing to say about it.
 */
export const Invalid: Story = {
  args: {
    name: "terms",
    label: "Accept terms and conditions",
    description: "This is a checkbox description.",
    invalid: true,
    checked: false,
  },
};

/**
 * The same status carrying a message — the shape the registration form needs.
 * The line is styled exactly like the description it replaces: the design marks
 * the error on the label and the border, so the text below reads as plain
 * helper copy. It is still announced as an alert.
 */
export const WithError: Story = {
  args: {
    name: "terms",
    label: "Accept terms and conditions",
    error: "Please accept to continue.",
    checked: false,
  },
};

/** Figma "State=Disabled" — both text lines drop to `Foreground/State/Disabled`. */
export const Disabled: Story = {
  args: {
    name: "field",
    label: "Checkbox Text",
    description: "This is a checkbox description.",
    checked: true,
    disabled: true,
  },
};

export const Focused: Story = {
  args: {
    name: "field",
    label: "Checkbox Text",
    description: "This is a checkbox description.",
    checked: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("checkbox").focus();
  },
};

/**
 * The box stays on the first line — `items-start`, not `items-center` — which
 * is what keeps a wrapping label from dragging it down the block.
 */
export const LongLabel: Story = {
  args: {
    name: "marketing",
    label: "Send me offers, bonus drops and tournament reminders by email",
    description: "We send at most one message a week and you can unsubscribe from any of them.",
    checked: true,
  },
};

/** A list with a parent that reports the partial selection. */
export const Interactive: Story = {
  decorators: [],
  render: () => {
    const options = ["Email", "SMS", "Push"] as const;
    const [selected, setSelected] = React.useState<string[]>(["Email"]);

    const all = selected.length === options.length;
    const some = selected.length > 0 && !all;

    return (
      <div className="w-50 flex flex-col gap-3">
        <CheckboxField
          name="all"
          label="All channels"
          checked={some ? "indeterminate" : all}
          onCheckedChange={(checked) => setSelected(checked === true ? [...options] : [])}
        />
        <div className="flex flex-col gap-3 pl-8">
          {options.map((option) => (
            <CheckboxField
              key={option}
              name={option.toLowerCase()}
              label={option}
              checked={selected.includes(option)}
              onCheckedChange={(checked) =>
                setSelected((current) =>
                  checked === true
                    ? [...current, option]
                    : current.filter((item) => item !== option),
                )
              }
            />
          ))}
        </div>
      </div>
    );
  },
};

/** Every resting state in one frame. */
export const AllStates: Story = {
  decorators: [],
  render: () => (
    <div className="w-50 flex flex-col gap-6">
      <CheckboxField
        name="unchecked"
        label="Unchecked"
        description="This is a checkbox description."
      />
      <CheckboxField
        name="checked"
        label="Checked"
        description="This is a checkbox description."
        checked
      />
      <CheckboxField
        name="indeterminate"
        label="Indeterminate"
        description="This is a checkbox description."
        checked="indeterminate"
      />
      <CheckboxField
        name="invalid"
        label="Error"
        description="This is a checkbox description."
        invalid
      />
      <CheckboxField name="error" label="Error with message" error="Please accept to continue." />
      <CheckboxField
        name="disabled"
        label="Disabled"
        description="This is a checkbox description."
        checked
        disabled
      />
      <CheckboxField name="noDescription" label="No description" checked />
    </div>
  ),
};

/**
 * `FormCheckbox` binds one box to react-hook-form. A checkbox is boolean, so it
 * forwards `checked`/`onCheckedChange` rather than `value`/`onChange`, and turns
 * the validation error into the message under the label. Submit without ticking
 * to see it fail.
 */
export const WithReactHookForm: Story = {
  decorators: [],
  render: () => {
    const form = useForm<{ terms: boolean; marketing: boolean }>({
      defaultValues: { terms: false, marketing: false },
      mode: "onSubmit",
    });

    return (
      <Form {...form}>
        <form className="w-70 flex flex-col gap-6" onSubmit={form.handleSubmit(() => undefined)}>
          <FormCheckbox
            control={form.control}
            name="terms"
            label="Accept terms and conditions"
            description="You can withdraw consent at any time."
            rules={{ required: "Please accept to continue." }}
          />
          <FormCheckbox control={form.control} name="marketing" label="Send me offers by email" />
          <Button type="submit">Create account</Button>
        </form>
      </Form>
    );
  },
};

/** The same form after a failed submit, so the error state is captured. */
export const ReactHookFormErrors: Story = {
  ...WithReactHookForm,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("button", { name: "Create account" }).click();
  },
};
