import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@ui/web/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/web/Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Needs Review/Atoms/Tooltip",
  id: "Tooltip",
  component: Tooltip,
  tags: ["autodocs", "status:needs-review", "level:atoms"],
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

const CAPTION = "Steps 1 of 5";
const TITLE = "Lovely tooltip title";
const DESCRIPTION = "There are a lot of things you can do in space.";

/**
 * The pair Figma draws in the tooltip's `Buttons` frame: `Secondary` then
 * `Default`, both at `sm` — which is the 32px box the node measures.
 *
 * **`outline` is the wrong variant here, and invisibly so.** It resolves to
 * `text-foreground-on-surface-default`, the colour for text on a light page
 * surface, so inside the inverted panel it is dark on dark and the button all but
 * disappears. `secondary` is what the node actually names
 * (`--color/background/brand/secondarycontainer` +
 * `--color/foreground/brand/onsecondarycontainer`), and it is the pairing that
 * stays legible against the inverted container in every theme.
 */
const Actions = () => (
  <>
    <Button size="sm" variant="secondary">
      Button
    </Button>
    <Button size="sm">Button</Button>
  </>
);

/**
 * The per-case stories below open on hover, the way the component does in an
 * app. Only `AllVariants` pins `open`, and only because it is the story the
 * visual suite photographs — see the note on it.
 */
export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover</Button>
      </TooltipTrigger>
      <TooltipContent>Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const WithTitle: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover</Button>
      </TooltipTrigger>
      <TooltipContent className="w-64" title={TITLE}>
        {DESCRIPTION}
      </TooltipContent>
    </Tooltip>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover</Button>
      </TooltipTrigger>
      <TooltipContent className="w-64" caption={CAPTION} title={TITLE} actions={<Actions />}>
        {DESCRIPTION}
      </TooltipContent>
    </Tooltip>
  ),
};

/** Figma's `position: None` — the panel with no arrow pointing back at the trigger. */
export const WithoutArrow: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover</Button>
      </TooltipTrigger>
      <TooltipContent className="w-64" title={TITLE} showArrow={false}>
        {DESCRIPTION}
      </TooltipContent>
    </Tooltip>
  ),
};

/**
 * The photographed story, and the only one in `Tooltip.tag.visual.ts`.
 *
 * One tooltip, in the fullest shape the design draws: caption, title,
 * description, the buttons row and the arrow. Every part the component can put on
 * screen is in this single panel, so one shot covers the container, all three
 * type styles, the actions row and the arrow's geometry at once — the things that
 * actually move when a token moves.
 *
 * What that deliberately leaves uncovered is placement: `showArrow={false}` and
 * the `side` rotations other than `bottom` have no baseline. They are Radix's
 * popper doing arithmetic and a CSS transform, not our styling, so a diff there
 * would report on Floating UI rather than on this component.
 *
 * Two details are load-bearing rather than stylistic:
 *
 * - **`open` is pinned.** The suite takes one shot per story and a tooltip is
 *   only on screen while its trigger is hovered, so the state is drawn rather
 *   than performed — which also means the spec needs no `interaction`.
 * - **`w-80` rather than a width that depends on text.** Under
 *   `layout: "centered"` the story root shrink-wraps, so a `w-full` would resolve
 *   to max-content, be measured in the host platform's font metrics, and come out
 *   a different size on Linux than on macOS — and Playwright refuses to compare
 *   pixels at all once the sizes disagree. 20rem is also the nearest scale step to
 *   Figma's 310px frame.
 */
export const AllVariants: Story = {
  render: () => (
    // The reserve is what puts the trigger above centre and gives the panel the
    // room it hangs into: the panel is portalled to `document.body` and positioned
    // absolutely, so it contributes nothing to the height `layout: "centered"`
    // centres. Without it the trigger sits dead centre and the panel runs towards
    // the bottom edge, close enough that Floating UI would flip it to `top`.
    <div className="flex h-64 w-80 justify-center">
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="w-80"
          caption={CAPTION}
          title={TITLE}
          actions={<Actions />}
        >
          {DESCRIPTION}
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};
