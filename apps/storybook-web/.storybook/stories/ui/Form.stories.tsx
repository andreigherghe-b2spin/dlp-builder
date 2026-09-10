import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "storybook/test";
import * as z from "zod";

import { Button } from "@ui/web/Button";
import {
  Form,
  FormCheckbox,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSwitch,
} from "@ui/web/Form";
import { Input } from "@ui/web/Input";

const meta: Meta<typeof Form> = {
  title: "Verified/Organisms/Form",
  id: "Form",
  component: Form,
  tags: ["autodocs", "status:verified", "level:organisms"],
};

export default meta;

type Story = StoryObj<typeof Form>;

// Schema for the form
const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  marketing: z.boolean(),
  terms: z.boolean(),
});

type Values = z.infer<typeof formSchema>;

/**
 * The three stories differ only in their markup and their starting values, so the
 * wiring lives here once rather than in three copies free to drift apart.
 */
function useDemoForm(
  defaultValues: Values = { username: "", email: "", marketing: false, terms: false },
) {
  return useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
}

function onSubmit(values: Values) {
  console.log(values);
}

const StackedForm = () => {
  const form = useDemoForm();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-96 space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* One text field, not two. The second was the same composition again —
            label, control, description, message — and `Invalid` and `CustomLayout`
            both photograph `email` anyway. What is left here is one of each part
            the form has: a text field, a switch and a checkbox. */}
        <FormSwitch
          control={form.control}
          name="marketing"
          label="Marketing emails"
          description="Occasional offers and product news."
        />
        <FormCheckbox
          control={form.control}
          name="terms"
          label="Accept terms and conditions"
          description="You can withdraw consent at any time."
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

const GridForm = () => {
  const form = useDemoForm();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-md">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
};

/**
 * The state `FormMessage` exists for. Seeded with values the schema rejects — one
 * character where two are required, and a string that is not an email — and
 * submitted by the story's `play`, because a message only appears once the
 * resolver has run.
 *
 * `aria-invalid` and the `aria-describedby` link to the message are wired by
 * `FormField`, so the shot is also the check that the error is announced and not
 * merely coloured.
 */
const InvalidForm = () => {
  const form = useDemoForm({
    username: "a",
    email: "not-an-email",
    marketing: false,
    terms: false,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-96 space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Validate</Button>
      </form>
    </Form>
  );
};

export const Default: Story = { render: () => <StackedForm /> };

export const Invalid: Story = {
  render: () => <InvalidForm />,
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole("button", { name: "Validate" }).click();
  },
};

export const CustomLayout: Story = {
  render: () => <GridForm />,
};
