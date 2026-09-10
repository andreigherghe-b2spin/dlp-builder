import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { within } from "storybook/test";
import * as z from "zod";

import { Button } from "@ui/web/Button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/web/Dialog";
import { Form, FormSelectField } from "@ui/web/Form";
import { SelectField } from "@ui/web/SelectField";

/**
 * The full field from the design: label row with an optional link, the box with
 * its adornment slots, and one line of helper or error text below it. The box
 * and the menu are `Select`; everything around them lives here.
 *
 * Choices come from `options` rather than children, so a field stays one line in
 * a form. An entry carrying its own `options` renders as a captioned group.
 */
const meta: Meta<typeof SelectField> = {
  title: "Verified/Molecules/SelectField",
  id: "SelectField",
  component: SelectField,
  tags: ["autodocs", "status:verified", "level:molecules"],
  argTypes: {
    label: { control: "text", description: "Label above the field" },
    placeholder: { control: "text", description: "Shown until something is chosen" },
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
      description: "Label above the box, or beside it",
    },
    description: { control: "text", description: "Helper text below the field" },
    error: {
      control: "text",
      description: "Replaces the helper text and marks the field invalid",
    },
    invalid: { control: "boolean", description: "Error styling without a message" },
    validation: {
      control: "select",
      options: [undefined, "positive", "negative"],
      description: "Validation glyph before the chevron",
    },
    disabled: { control: "boolean", description: "Whether the field is disabled" },
  },
  // A story's own `decorators` do not replace these — Storybook composes the
  // two — so a story that brings its own wrapper opts out through
  // `parameters.ownWidth` instead of an empty array that does nothing.
  decorators: [
    (Story, { parameters }) =>
      parameters.ownWidth ? (
        <Story />
      ) : (
        <div className="w-90">
          <Story />
        </div>
      ),
  ],
};

export default meta;

type Story = StoryObj<typeof SelectField>;

const COUNTRIES = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "mx", label: "Mexico" },
  { value: "br", label: "Brazil" },
  { value: "ar", label: "Argentina" },
];

/**
 * Longer than any menu can show at once, so the panel is the thing that has to
 * scroll — the case a five-row list never exercises.
 */
const CURRENCIES = [
  "AUD",
  "BRL",
  "CAD",
  "CHF",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HUF",
  "INR",
  "JPY",
  "MXN",
  "NOK",
  "NZD",
  "PLN",
  "SEK",
  "TRY",
  "USD",
  "ZAR",
].map((code) => ({ value: code.toLowerCase(), label: code }));

const TIMEZONES = [
  {
    label: "Europe",
    options: [
      { value: "gmt", label: "GMT" },
      { value: "cet", label: "CET" },
      { value: "eet", label: "EET" },
    ],
  },
  {
    label: "Americas",
    options: [
      { value: "est", label: "EST" },
      { value: "cst", label: "CST" },
      { value: "pst", label: "PST" },
    ],
  },
];

/** Label, box and helper text — the anatomy without any optional part. */
export const Default: Story = {
  args: {
    name: "country",
    label: "Country",
    placeholder: "Select a country",
    options: COUNTRIES,
    description: "This is an input description.",
  },
};

/** Figma's `Variant=Selected value`. */
export const WithSelectedValue: Story = {
  args: {
    ...Default.args,
    defaultValue: "ca",
  },
};

/**
 * Figma's "Link" in the label row. You pass the element that navigates and the
 * field dresses it, so a router's `Link` drops in the same way an `<a>` does.
 */
export const WithAction: Story = {
  args: {
    ...Default.args,
    action: <a href="#help">Need help?</a>,
  },
};

/** A decorative icon on `onSurface/Muted`, inside the box. */
export const WithStartAdornment: Story = {
  args: {
    ...Default.args,
    startAdornment: <Globe />,
  },
};

/** Validation glyph — `Icon / Check` on `Feedback/Positive`, before the chevron. */
export const ValidationPositive: Story = {
  args: {
    ...Default.args,
    defaultValue: "us",
    startAdornment: <Globe />,
    validation: "positive",
    description: "Country confirmed.",
  },
};

/**
 * `error` replaces the helper line rather than joining it — Figma has no
 * separate error node, the same line recolours to `Feedback/Negative`.
 */
export const WithError: Story = {
  args: {
    ...Default.args,
    startAdornment: <Globe />,
    validation: "negative",
    error: "Pick a country to continue.",
  },
};

/** An entry carrying its own `options` becomes a captioned group. */
export const Grouped: Story = {
  args: {
    name: "timezone",
    label: "Timezone",
    placeholder: "Select a timezone",
    options: [
      {
        label: "Europe",
        options: [
          { value: "gmt", label: "GMT" },
          { value: "cet", label: "CET" },
        ],
      },
      {
        label: "Americas",
        options: [
          { value: "est", label: "EST" },
          { value: "pst", label: "PST" },
        ],
      },
    ],
    description: "Used for scheduled reports.",
  },
};

/** A row that cannot be chosen keeps its place and drops to `State/Disabled`. */
export const WithDisabledOption: Story = {
  args: {
    name: "plan",
    label: "Plan",
    placeholder: "Select a plan",
    options: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
      { value: "enterprise", label: "Enterprise — contact sales", disabled: true },
    ],
  },
};

/** Figma frame "Focus" — the border goes `State/Active` over the same fill. */
export const Focused: Story = {
  args: Default.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("combobox").focus();
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    defaultValue: "us",
    action: <a href="#help">Need help?</a>,
    startAdornment: <Globe />,
    disabled: true,
  },
};

/**
 * The label beside the box instead of above it. The column is
 * `--selectfield-label-width`, so it is the field that decides how wide it is,
 * not the length of the word in it.
 */
export const Horizontal: Story = {
  args: {
    ...Default.args,
    orientation: "horizontal",
    description: undefined,
  },
};

/**
 * What the orientation is for: a dialog form, where every label lines up because
 * one ancestor sets the column width for all of them. The last field shows where
 * the error line goes — under the box, not under the label.
 */
export const HorizontalForm: Story = {
  parameters: { ownWidth: true },
  render: () => (
    <div className="bg-background-layout-page w-110 flex flex-col gap-4 rounded-lg p-6 [--selectfield-label-width:6rem]">
      <SelectField
        name="country"
        orientation="horizontal"
        label="Country"
        placeholder="Select"
        options={COUNTRIES}
      />
      <SelectField
        name="currency"
        orientation="horizontal"
        label="Currency"
        placeholder="Select"
        options={[
          { value: "usd", label: "USD" },
          { value: "eur", label: "EUR" },
        ]}
      />
      <SelectField
        name="plan"
        orientation="horizontal"
        label="Plan"
        placeholder="Select"
        options={[
          { value: "free", label: "Free" },
          { value: "pro", label: "Pro" },
        ]}
        validation="negative"
        error="Pick a plan to continue."
      />
    </div>
  ),
};

/**
 * The field inside a modal, which is where it most often breaks. Open the dialog
 * and work through the menus — what each one is there to prove:
 *
 * - **The menu draws over the panel, not behind it.** The panel is raised to
 *   `z-[1000]` on purpose, the shape a host app's own modal layer has. A menu
 *   portalled to `document.body` is a *sibling* of the panel, so its `z-50` loses
 *   to anything stacked above it. `DialogContent` publishes its panel as the
 *   portal container, so the menu is a child of it and stacks inside it instead.
 *   Left at the kit's own `z-50` the two tie and DOM order hides the bug — which
 *   is why a plain dialog here would demonstrate nothing.
 * - **The menu is as wide as its own box**, not as wide as the dialog, and sits
 *   4px under the box it belongs to.
 * - **A long list scrolls inside the menu.** "Currency" has twenty rows: the menu
 *   is capped at the space left under the trigger and its own viewport scrolls,
 *   with the scroll buttons at the edges, rather than the menu growing to fit.
 * - **Choosing a row closes the menu and nothing else.** The dialog stays open,
 *   and the chosen value appears in the box.
 * - **Escape closes one layer at a time**: the first press closes the menu, the
 *   second closes the dialog.
 * - **Clicking a row is not an outside press.** The menu lives in the panel, so
 *   the dialog's dismiss-on-outside-press never sees it.
 */
export const InDialog: Story = {
  parameters: { ownWidth: true, docs: { story: { inline: false, height: "560px" } } },
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent className="z-[1000]">
        <DialogHeader>
          <DialogTitle>Where are you playing from?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <SelectField
            name="country"
            label="Country"
            placeholder="Select a country"
            options={COUNTRIES}
            description="Sets the payment methods you are offered."
          />
          <SelectField
            name="currency"
            label="Currency"
            placeholder="Select a currency"
            options={CURRENCIES}
            description="Twenty rows — the menu scrolls rather than growing."
          />
          <SelectField
            name="timezone"
            label="Timezone"
            placeholder="Select a timezone"
            options={TIMEZONES}
            description="Captioned groups, inside a dialog."
          />
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="lg">Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * The same thing once the dialog body is the scrolling part. The panel is capped
 * short (`max-h-100`) so the body scrolls at any viewport height rather than only
 * on a laptop, and the last field sits at the bottom of that scroll.
 *
 * What to check, on top of everything in [InDialog](#indialog):
 *
 * - **The menu is not clipped by the body.** `DialogBody` is `overflow-y-auto`,
 *   but the menu portals into the *panel*, one level up, so the scroll container
 *   never crops it.
 * - **Nor by the panel.** Open "Language", the last field: the menu is measured
 *   against the viewport rather than the dialog, so it draws straight past the
 *   panel's bottom edge and stays whole. A panel that clipped it would be
 *   `overflow-hidden` somewhere it should not be.
 * - **Scroll the body with a menu open.** The menu tracks its trigger, staying
 *   4px under it; it does not stay pinned where it opened, and it does not
 *   detach and float.
 */
export const InScrollingDialog: Story = {
  parameters: { ownWidth: true, docs: { story: { inline: false, height: "560px" } } },
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open scrolling dialog</Button>
      </DialogTrigger>
      <DialogContent className="max-h-100 z-[1000]">
        <DialogHeader>
          <DialogTitle>Account preferences</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <SelectField
            name="country"
            label="Country"
            placeholder="Select a country"
            options={COUNTRIES}
            description="This is an input description."
          />
          <SelectField
            name="currency"
            label="Currency"
            placeholder="Select a currency"
            options={CURRENCIES}
            description="This is an input description."
          />
          <SelectField
            name="timezone"
            label="Timezone"
            placeholder="Select a timezone"
            options={TIMEZONES}
            description="This is an input description."
          />
          <SelectField
            name="plan"
            label="Plan"
            placeholder="Select a plan"
            options={[
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro" },
              { value: "enterprise", label: "Enterprise — contact sales", disabled: true },
            ]}
            description="This is an input description."
          />
          <SelectField
            name="language"
            label="Language"
            placeholder="Select a language"
            options={[
              { value: "en", label: "English" },
              { value: "de", label: "Deutsch" },
              { value: "pt", label: "Português" },
              { value: "es", label: "Español" },
            ]}
            description="Last row — its menu has to open upwards."
          />
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="lg">Save</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/** Every statically representable state of the composed field. */
export const AllStates: Story = {
  parameters: { ownWidth: true },
  render: () => (
    <div className="w-90 flex flex-col gap-6">
      <SelectField
        name="empty"
        label="Empty"
        placeholder="Placeholder"
        options={COUNTRIES}
        description="This is an input description."
      />
      <SelectField
        name="selected"
        label="Selected value"
        defaultValue="us"
        options={COUNTRIES}
        description="This is an input description."
      />
      <SelectField
        name="withLink"
        label="With link"
        action={<a href="#">Link</a>}
        defaultValue="ca"
        options={COUNTRIES}
        description="This is an input description."
      />
      <SelectField
        name="adornments"
        label="Adornments"
        startAdornment={<Globe />}
        validation="positive"
        defaultValue="mx"
        options={COUNTRIES}
        description="This is an input description."
      />
      <SelectField
        name="error"
        label="Error"
        startAdornment={<Globe />}
        validation="negative"
        placeholder="Placeholder"
        options={COUNTRIES}
        error="Pick a country to continue."
      />
      <SelectField
        name="disabled"
        label="Disabled"
        startAdornment={<Globe />}
        defaultValue="br"
        options={COUNTRIES}
        description="This is an input description."
        disabled
      />
    </div>
  ),
};

const schema = z.object({
  country: z.string().min(1, "Pick a country."),
  currency: z.string().min(1, "Pick a currency."),
});

/**
 * `FormSelectField` binds one field to react-hook-form. A select has no
 * `onChange` — Radix reports the choice through `onValueChange` — so the
 * binding is spelled out rather than spread, and `ref` lands on the trigger so
 * a failed submit can focus it. Submit while empty to see both fields fail.
 */
export const WithReactHookForm: Story = {
  parameters: { ownWidth: true },
  render: () => {
    const form = useForm<z.infer<typeof schema>>({
      resolver: zodResolver(schema),
      defaultValues: { country: "", currency: "" },
      mode: "onSubmit",
    });

    return (
      <Form {...form}>
        <form className="w-90 flex flex-col gap-6" onSubmit={form.handleSubmit(() => undefined)}>
          <FormSelectField
            control={form.control}
            name="country"
            label="Country"
            placeholder="Select a country"
            startAdornment={<Globe />}
            options={COUNTRIES}
            description="Where your account is billed."
          />
          <FormSelectField
            control={form.control}
            name="currency"
            label="Currency"
            placeholder="Select a currency"
            options={[
              { value: "usd", label: "USD" },
              { value: "eur", label: "EUR" },
            ]}
          />
          <Button type="submit">Continue</Button>
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
    canvas.getByRole("button", { name: "Continue" }).click();
  },
};
