import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Info } from "lucide-react";
import { userEvent, within } from "storybook/test";

import { Button } from "@ui/web/Button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/web/Dialog";
import { SelectField } from "@ui/web/SelectField";
import { TypographyBody } from "@ui/web/Typography";

const meta: Meta<typeof Dialog> = {
  title: "Verified/Organisms/Dialog",
  id: "Dialog",
  component: Dialog,
  tags: ["autodocs", "status:verified", "level:organisms"],
  parameters: {
    // Every story opens itself, so the docs page would otherwise render all of
    // them at once: eighteen panels stacked on the same centred position, and
    // `body { pointer-events: none }` from eighteen modal layers, which leaves the
    // page unscrollable. An iframe per story is what keeps them apart.
    docs: { story: { inline: false, height: "440px" } },
  },
  argTypes: {
    open: { control: "boolean", description: "Controlled open state" },
    defaultOpen: { control: "boolean", description: "Initial open state when uncontrolled" },
    modal: { control: "boolean", description: "Whether the content below is made inert" },
    onClose: { control: false, description: "Called whenever the dialog asks to be closed" },
    onOpenChange: { control: false, description: "Notified on every open and close" },
  },
};

export default meta;

type Story = StoryObj<typeof Dialog>;

function BrandMark() {
  return (
    <svg viewBox="0 0 72 16" role="img" aria-label="Brand" className="w-18 h-4">
      <rect width="72" height="16" rx="8" fill="currentColor" opacity="0.2" />
      <circle cx="8" cy="8" r="4" fill="currentColor" />
      <rect x="18" y="6" width="46" height="4" rx="2" fill="currentColor" />
    </svg>
  );
}

// Spreads `props`, which is what makes it usable as `info`: the header dresses
// that slot through `Slot`, so the styling, `data-slot` and `data-testid` arrive
// as props on whatever element is passed. A component that swallows them renders
// an unstyled bare button.
function InfoButton(props: React.ComponentProps<"button">) {
  return (
    <button type="button" aria-label="About this offer" {...props}>
      <Info aria-hidden />
    </button>
  );
}

const paragraph =
  "Deposit today and your first purchase is matched in full. Coins land in your balance the moment the payment clears.";

const secondParagraph =
  "The match applies once per account and expires seven days after it is claimed.";

export const Default: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader onBack={() => {}} info={<InfoButton />} logo={<BrandMark />}>
          <DialogTitle>Claim your bonus</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>{paragraph}</DialogDescription>
          <TypographyBody size="s">{secondParagraph}</TypographyBody>
        </DialogBody>
        <DialogFooter
          link={<a href="#terms">Terms apply</a>}
          caption="You can opt out at any time."
        >
          <Button size="lg">Claim bonus</Button>
          <DialogClose asChild>
            <Button size="lg" variant="outline">
              Not now
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// -------------------------------------------------------------------- size

export const SizeDefault: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open default</Button>
      </DialogTrigger>
      <DialogContent size="default">
        <DialogHeader>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>{paragraph}</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <Button size="lg">Button</Button>
          <DialogClose asChild>
            <Button size="lg" variant="outline">
              Button
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const SizeSm: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open small</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>{paragraph}</DialogDescription>
        </DialogBody>
        <DialogFooter orientation="vertical">
          <Button size="lg">Button</Button>
          <DialogClose asChild>
            <Button size="lg" variant="outline">
              Button
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ------------------------------------------------------------------- header
export const HeaderDefault: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader onBack={() => {}} info={<InfoButton />} logo={<BrandMark />}>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Content</DialogDescription>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
};

export const HeaderAlignCenter: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open centred</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader align="center" info={<InfoButton />}>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Content</DialogDescription>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
};

export const HeaderAlignCenterWithoutInfo: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open centred</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader align="center">
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Content</DialogDescription>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
};

export const HeaderNoText: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open without a title</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader info={<InfoButton />} />
        <DialogBody>
          <DialogTitle className="sr-only">Offer details</DialogTitle>
          <TypographyBody size="s">{paragraph}</TypographyBody>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
};

/** Nothing but the title and the close button. */
export const HeaderMinimal: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Content</DialogDescription>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
};

/** A title long enough to need the ellipsis the left-aligned header applies. */
export const HeaderLongTitle: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader logo={<BrandMark />}>
          <DialogTitle>
            A title long enough that it has nowhere left to go but the ellipsis
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Content</DialogDescription>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
};

// ------------------------------------------------------------------- footer

export const FooterHorizontal: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Content</DialogDescription>
        </DialogBody>
        <DialogFooter link={<a href="#link">Link</a>} caption="Caption text">
          <Button size="lg">Button</Button>
          <DialogClose asChild>
            <Button size="lg" variant="outline">
              Button
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const FooterVertical: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Content</DialogDescription>
        </DialogBody>
        <DialogFooter orientation="vertical" link={<a href="#link">Link</a>} caption="Caption text">
          <Button size="lg">Button</Button>
          <DialogClose asChild>
            <Button size="lg" variant="outline">
              Button
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/** One action, which `horizontal` stretches to the full width of the row. */
export const FooterSingleAction: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Content</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="lg">Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/** Figma's `showFooter=false` — the body runs to the bottom of the panel. */
export const WithoutFooter: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>{paragraph}</DialogDescription>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
};

// -------------------------------------------------------------------- content

/**
 * More content than screen. `DialogBody` is what gives way — the header rule and
 * the footer buttons stay where they are and the middle scrolls, rather than the
 * panel growing past the viewport.
 */
export const LongContent: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Terms of service</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of service</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Please read these terms carefully.</DialogDescription>
          {Array.from({ length: 12 }, (_, index) => (
            <TypographyBody key={index} size="s">
              {index + 1}. {paragraph}
            </TypographyBody>
          ))}
        </DialogBody>
        <DialogFooter>
          <Button size="lg">Accept</Button>
          <DialogClose asChild>
            <Button size="lg" variant="outline">
              Decline
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// --------------------------------------------------------------------- control

/** Driven from outside, for a dialog whose open state lives in the product. */
export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);

    return (
      <div className="flex flex-col items-center gap-4">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open from state
        </Button>
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Header</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <DialogDescription>open: {String(open)}</DialogDescription>
            </DialogBody>
            <DialogFooter>
              <Button size="lg" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  },
};

/**
 * `disableOverlayClose` stops a press outside from dismissing the dialog, for a
 * step the user has to answer. Escape and the close button still work, and
 * `onClose` still reports whichever of them was used.
 */
export const OverlayCloseDisabled: Story = {
  render: () => {
    const [closedBy, setClosedBy] = React.useState<string>("—");

    return (
      <div className="flex w-96 flex-col items-center gap-4">
        <Dialog defaultOpen onClose={() => setClosedBy("onClose fired")}>
          <DialogTrigger asChild>
            <Button variant="outline">Open</Button>
          </DialogTrigger>
          <DialogContent size="sm" disableOverlayClose>
            <DialogHeader>
              <DialogTitle>Confirm first</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <DialogDescription>
                Pressing the overlay does nothing. Escape and the close button still close this.
              </DialogDescription>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button size="lg">Got it</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <TypographyBody size="s">Last close: {closedBy}</TypographyBody>
      </div>
    );
  },
};

/**
 * `portal={false}` keeps the panel in the trigger's DOM position instead of
 * portalling it to the document root — for a nested context, or when the portal
 * lands the dialog in the wrong stacking context. The overlay comes along either
 * way.
 */
export const WithoutPortal: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open in place</Button>
      </DialogTrigger>
      <DialogContent portal={false} size="sm">
        <DialogHeader>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Rendered without a portal.</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="lg">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

const countries = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "de", label: "Germany" },
  { value: "jp", label: "Japan" },
];

/**
 * A `SelectField` opened from inside the panel, and the story that proves the
 * menu still lands on top of it.
 *
 * The panel is raised to `z-[1000]` on purpose — the shape a host application's
 * own modal layer has — because that is the case this exists to catch. A menu
 * portalled to `document.body` is a *sibling* of the panel rather than a child,
 * so its `z-50` lost to anything stacked above it and the list drew behind the
 * dialog. Left at the kit's own `z-50` the two tie and DOM order hides the bug,
 * which is why a plain dialog here would demonstrate nothing.
 *
 * `DialogContent` publishes its panel as the portal container for the floating
 * parts inside it, so the menu is a child of the panel and stacks within it
 * whatever z-index the dialog carries in the page. The menu opening over the
 * panel is the pass; the menu vanishing behind it means that context has come
 * undone.
 */
export const WithSelectField: Story = {
  parameters: { docs: { story: { inline: false, height: "560px" } } },
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent className="z-[1000]">
        <DialogHeader>
          <DialogTitle>Where are you playing from?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>
            We use this to show the right payment methods and currency.
          </DialogDescription>
          <SelectField name="country" label="Country" placeholder="Pick one" options={countries} />
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="lg">Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  // Opens the menu on load, so what the story is for is visible without a click.
  // The panel is portalled out of `canvasElement`, so the trigger is looked for in
  // the document rather than in the story root. `country-trigger` is the field's
  // own derived id — a form control names its parts after `name`.
  play: async ({ canvasElement }) => {
    const document = within(canvasElement.ownerDocument.body);

    await userEvent.click(document.getByTestId("country-trigger"));
  },
};
