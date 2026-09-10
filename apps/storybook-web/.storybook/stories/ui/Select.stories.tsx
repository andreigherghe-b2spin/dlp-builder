import type { Meta, StoryObj } from "@storybook/react-vite";
import { Globe, X } from "lucide-react";

import { Label } from "@ui/web/Label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@ui/web/Select";

/**
 * The bare select: the box that opens the menu, and the menu itself. Figma
 * draws one size only, so the trigger is 48px tall like every other field box
 * and there is no `size` prop.
 *
 * For a labelled field with helper or error text — and choices passed as data
 * rather than children — reach for `SelectField`, which composes this.
 *
 * The stories whose point is the open menu are photographed open by the visual
 * spec, which clicks the trigger itself; they render closed here.
 */
const meta: Meta<typeof Select> = {
  title: "Verified/Atoms/Select",
  id: "Select",
  component: Select,
  tags: ["autodocs", "status:verified", "level:atoms"],
  argTypes: {
    disabled: { control: "boolean", description: "Whether the select is disabled" },
    required: { control: "boolean", description: "Whether a choice is required" },
    defaultValue: { control: "text", description: "Initially selected value" },
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

type Story = StoryObj<typeof Select>;

const FRUITS = ["Apple", "Banana", "Blueberry", "Grapes", "Pineapple"];

/** The anatomy: trigger, placeholder, and a flat list of items. */
export const Default: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        {FRUITS.map((fruit) => (
          <SelectItem key={fruit} value={fruit.toLowerCase()}>
            {fruit}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

/**
 * Figma's `Variant=Selected value`. The chosen row goes semibold and grows a
 * check, which is the only thing marking it once the highlight has moved on.
 */
export const WithSelectedValue: Story = {
  ...Default,
  args: { defaultValue: "blueberry" },
};

/** A leading icon inside the box, on `onSurface/Muted`. */
export const WithStartAdornment: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger startAdornment={<Globe />}>
        <SelectValue placeholder="Select a region" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="emea">EMEA</SelectItem>
        <SelectItem value="apac">APAC</SelectItem>
        <SelectItem value="amer">Americas</SelectItem>
      </SelectContent>
    </Select>
  ),
};

/** Captioned groups, separated by a rule. */
export const WithGroups: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">GMT</SelectItem>
          <SelectItem value="cet">CET</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Americas</SelectLabel>
          <SelectItem value="est">EST</SelectItem>
          <SelectItem value="pst">PST</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

/** A row that cannot be chosen keeps its place and drops to `State/Disabled`. */
export const WithDisabledItems: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select a plan" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="free">Free</SelectItem>
        <SelectItem value="pro">Pro</SelectItem>
        <SelectItem value="enterprise" disabled>
          Enterprise — contact sales
        </SelectItem>
      </SelectContent>
    </Select>
  ),
};

/**
 * More rows than fit: the panel is capped at the available height and scrolls,
 * with the scroll buttons appearing at its edges.
 */
export const ManyOptions: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select a number" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 40 }, (_, index) => (
          <SelectItem key={index} value={`item-${index}`}>
            Item {index + 1}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  ...Default,
  args: { disabled: true, defaultValue: "apple" },
};

/**
 * `aria-invalid` on the trigger recolours the border to `Feedback/Negative`.
 *
 * The glyph is passed in, exactly as on `Input`: the bare trigger has no
 * `validation` prop, because Figma models the icon as its own toggle rather than
 * something the error state grows by itself. `SelectField` turns
 * `validation="negative"` into this same `endAdornment`.
 */
export const Invalid: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger
        aria-invalid
        endAdornment={<X aria-hidden className="text-foreground-feedback-negative" />}
      >
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        {FRUITS.map((fruit) => (
          <SelectItem key={fruit} value={fruit.toLowerCase()}>
            {fruit}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

/** Every statically representable state of the closed box. */
export const AllStates: Story = {
  parameters: { ownWidth: true },
  render: () => (
    <div className="w-90 flex flex-col gap-6">
      {(
        [
          { caption: "Empty", props: {}, invalid: false },
          { caption: "Selected value", props: { defaultValue: "apple" }, invalid: false },
          { caption: "Invalid", props: {}, invalid: true },
          { caption: "Disabled", props: { defaultValue: "apple", disabled: true }, invalid: false },
        ] as const
      ).map(({ caption, props, invalid }) => (
        <div key={caption} className="flex flex-col gap-1">
          <Label className="text-foreground-on-page-muted">{caption}</Label>
          <Select {...props}>
            <SelectTrigger
              aria-invalid={invalid || undefined}
              startAdornment={<Globe />}
              endAdornment={
                invalid ? (
                  <X aria-hidden className="text-foreground-feedback-negative" />
                ) : undefined
              }
            >
              <SelectValue placeholder="Placeholder" />
            </SelectTrigger>
            <SelectContent>
              {FRUITS.map((fruit) => (
                <SelectItem key={fruit} value={fruit.toLowerCase()}>
                  {fruit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  ),
};
