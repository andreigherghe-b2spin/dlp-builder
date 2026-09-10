import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { XIcon } from "lucide-react";

import { Button } from "@ui/web/Button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@ui/web/Drawer";
import { headingVariants, TypographyBody, TypographyLabel } from "@ui/web/Typography";

const meta: Meta<typeof Drawer> = {
  title: "Verified/Organisms/Drawer",
  id: "Drawer",
  component: Drawer,
  tags: ["autodocs", "status:verified", "level:organisms"],
  parameters: {
    // Every story opens itself, so the docs page would otherwise render all of
    // them at once: a stack of panels on the same edge, and
    // `body { pointer-events: none }` from a stack of modal layers, which leaves
    // the page unscrollable. An iframe per story is what keeps them apart.
    docs: { story: { inline: false, height: "520px" } },
  },
  argTypes: {
    direction: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
      description: "Which edge the panel slides in from",
    },
    open: { control: "boolean", description: "Controlled open state" },
    defaultOpen: { control: "boolean", description: "Initial open state when uncontrolled" },
    modal: { control: "boolean", description: "Whether the content below is made inert" },
    dismissible: {
      control: "boolean",
      description: "When false, nothing but your own `open` closes it",
    },
    onClose: { control: false, description: "Called when the drawer closes" },
    onOpenChange: { control: false, description: "Notified on every open and close" },
  },
};

export default meta;

type Story = StoryObj<typeof Drawer>;

const paragraph =
  "Pick the providers you want to see. The lobby updates as soon as you apply, and the choice is remembered on this device.";

/**
 * `DrawerHeader` carries the scroll contract and nothing else, so every class
 * below is the *caller's*: the padding, the row, the title's type, the rule.
 * That is what makes the same panel contents liftable into a `Dialog` or onto a
 * page without their chrome changing.
 *
 * In a real app this lives in the feature component the drawer is merely showing.
 */
function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <DrawerHeader className="border-border-neutral-subtle flex items-center gap-2 border-b p-4">
      <DrawerTitle
        className={`${headingVariants({ size: "s", weight: "bold" })} text-foreground-on-surface-default min-w-0 flex-1 truncate`}
      >
        {children}
      </DrawerTitle>
      <DrawerClose asChild>
        <Button variant="ghost" size="sm" aria-label="Close">
          <XIcon aria-hidden />
        </Button>
      </DrawerClose>
    </DrawerHeader>
  );
}

/** Same story for the footer: the direction and the gap are decided here. */
function PanelActions({ children }: { children: React.ReactNode }) {
  return <DrawerFooter className="flex flex-col gap-2 p-4">{children}</DrawerFooter>;
}

/** The one story the visual suite photographs for the default panel shape. */
export const Default: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <PanelHeader>Filter games</PanelHeader>
        <DrawerBody className="p-4">
          <DrawerDescription className="text-foreground-on-surface-muted">
            {paragraph}
          </DrawerDescription>
        </DrawerBody>
        <PanelActions>
          <Button size="lg">Apply</Button>
          <DrawerClose asChild>
            <Button size="lg" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </PanelActions>
      </DrawerContent>
    </Drawer>
  ),
};

const NAV_GROUPS = [
  ["Home", "Recommended", "Social Casino", "Social Live Casino", "Game Providers"],
  ["Get App", "Latest Promos", "Player Safety", "Need Help?"],
];

/**
 * Stand-in for the product's navigation. It is a separate component that does not
 * exist yet — the drawer supplies the geometry and the scrim, and the page
 * background, the brand mark and the nav itself are all passed in from here.
 */
function SiteNav() {
  return (
    <nav className="flex flex-col gap-2 p-2">
      {NAV_GROUPS.map((group, index) => (
        <div
          key={index}
          className="bg-background-layout-surface rounded-offset8 flex flex-col gap-1 p-2"
        >
          {group.map((item) => (
            <a
              key={item}
              href="#nav"
              className="text-foreground-on-surface-muted hover:bg-background-state-hover rounded-base px-3 py-2"
            >
              <TypographyLabel size="m">{item}</TypographyLabel>
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}

/**
 * `size="full"` — edge to edge, no radius, geometry and nothing else. The second
 * story the visual suite photographs, and the one that shows the division of
 * labour most plainly: even the background is the caller's.
 */
export const FullScreen: Story = {
  args: { defaultOpen: true, direction: "left" },
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </DrawerTrigger>
      <DrawerContent size="full" className="bg-background-layout-page">
        <DrawerHeader className="flex items-center justify-between p-4">
          <DrawerTitle className="sr-only">Menu</DrawerTitle>
          <svg viewBox="0 0 72 16" role="img" aria-label="Brand" className="w-18 h-4">
            <rect width="72" height="16" rx="8" fill="currentColor" opacity="0.2" />
            <circle cx="8" cy="8" r="4" fill="currentColor" />
            <rect x="18" y="6" width="46" height="4" rx="2" fill="currentColor" />
          </svg>
          <DrawerClose asChild>
            <Button variant="ghost" size="sm" aria-label="Close">
              <XIcon aria-hidden />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <DrawerBody>
          <SiteNav />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  ),
};

/** `bottom` is the default and `left` is above, so these two cover the other edges. */
export const FromTop: Story = {
  args: { defaultOpen: true, direction: "top" },
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open from top</Button>
      </DrawerTrigger>
      <DrawerContent>
        <PanelHeader>From the top</PanelHeader>
        <DrawerBody className="p-4">
          <DrawerDescription className="text-foreground-on-surface-muted">
            {paragraph}
          </DrawerDescription>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  ),
};

export const FromRight: Story = {
  args: { defaultOpen: true, direction: "right" },
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open from right</Button>
      </DrawerTrigger>
      <DrawerContent>
        <PanelHeader>From the right</PanelHeader>
        <DrawerBody className="p-4">
          <DrawerDescription className="text-foreground-on-surface-muted">
            {paragraph}
          </DrawerDescription>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  ),
};

/** Name and game count, so the rows have two columns to clip against the edge. */
const PROVIDERS: [name: string, games: number][] = [
  ["Pragmatic Play", 412],
  ["Hacksaw Gaming", 168],
  ["Nolimit City", 94],
  ["Push Gaming", 76],
  ["Play'n GO", 331],
  ["Relax Gaming", 205],
  ["Print Studios", 41],
  ["Peter & Sons", 58],
  ["Thunderkick", 87],
  ["ELK Studios", 63],
  ["Big Time Gaming", 52],
  ["Red Tiger", 244],
  ["NetEnt", 289],
  ["Quickspin", 121],
  ["Yggdrasil", 178],
  ["Blueprint Gaming", 156],
  ["Games Global", 397],
  ["Twist Games", 29],
];

/**
 * A panel that comes in from the edge, is full height whether or not the content
 * fills it — `inset-y-0` is part of the placement, not something the content
 * earns — and scrolls the list inside it.
 *
 * That combination is the whole reason the three regions exist. The panel's
 * height is decided before the content is known, so something has to give once
 * the list is longer than the screen: `DrawerBody` takes the leftover height and
 * scrolls inside it, while `DrawerHeader` and `DrawerFooter` hold their size.
 * Scroll the rows — the title stays at the top and the buttons stay at the
 * bottom, and the list is clipped by the body rather than by the viewport.
 *
 * The same list in a bare `<div>` grows the panel instead and pushes the buttons
 * off the bottom of the screen — for the players with enough providers to
 * overflow it, and for nobody else.
 */
export const ScrollableSidePanel: Story = {
  args: { defaultOpen: true, direction: "right" },
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open providers</Button>
      </DrawerTrigger>
      <DrawerContent>
        <PanelHeader>Game providers</PanelHeader>
        <DrawerBody className="px-2 py-1">
          <ul className="flex flex-col">
            {PROVIDERS.map(([name, games]) => (
              <li
                key={name}
                className="border-border-neutral-subtle flex items-center justify-between gap-3 border-b px-3 py-3 last:border-b-0"
              >
                <TypographyLabel size="m" className="text-foreground-on-surface-default truncate">
                  {name}
                </TypographyLabel>
                <TypographyBody
                  as="span"
                  size="s"
                  className="text-foreground-on-surface-muted shrink-0"
                >
                  {games} games
                </TypographyBody>
              </li>
            ))}
          </ul>
        </DrawerBody>
        <PanelActions>
          <Button size="lg">Apply</Button>
          <DrawerClose asChild>
            <Button size="lg" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </PanelActions>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * The same contract on the bottom edge, where the panel's height comes from the
 * `max-h-[80dvh]` cap rather than from the edge it is pinned to: past that the
 * panel stops growing and `DrawerBody` starts scrolling, so the title above it
 * and the actions below it stay where they are however long the text runs.
 */
export const LongContent: Story = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger asChild>
        <Button variant="outline">Open</Button>
      </DrawerTrigger>
      <DrawerContent>
        <PanelHeader>Terms</PanelHeader>
        <DrawerBody className="flex flex-col gap-4 p-4">
          {Array.from({ length: 12 }, (_, index) => (
            <TypographyBody key={index} size="s">
              {index + 1}. {paragraph}
            </TypographyBody>
          ))}
        </DrawerBody>
        <PanelActions>
          <DrawerClose asChild>
            <Button size="lg">Got it</Button>
          </DrawerClose>
        </PanelActions>
      </DrawerContent>
    </Drawer>
  ),
};

/** Driven from outside — a route, a store, a parent's state. */
export const Controlled: Story = {
  render: function ControlledDrawer() {
    const [open, setOpen] = React.useState(true);

    return (
      <div className="flex flex-col items-start gap-4">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open
        </Button>
        <TypographyBody size="s">The drawer is {open ? "open" : "closed"}.</TypographyBody>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <PanelHeader>Driven from outside</PanelHeader>
            <DrawerBody className="p-4">
              <DrawerDescription className="text-foreground-on-surface-muted">
                {paragraph}
              </DrawerDescription>
            </DrawerBody>
            <PanelActions>
              <Button size="lg" onClick={() => setOpen(false)}>
                Close it from the parent
              </Button>
            </PanelActions>
          </DrawerContent>
        </Drawer>
      </div>
    );
  },
};

/**
 * The three ways the background can behave, in one place.
 *
 * - **default** — dimmed and blurred, page inert.
 * - **`overlay={false}`** on `DrawerContent` — no scrim, page visible and
 *   undimmed, but still inert. Appearance only.
 * - **`modal={false}`** on `Drawer` — the page keeps working behind the panel.
 *   Vaul drops the scrim itself here, so `overlay` has nothing left to say, and it
 *   drops closing on an outside press with it. See `NonModal`.
 *
 * `classNames={{ overlay: "hidden" }}` is *not* a fourth way: it mounts the scrim
 * and hides it, so the page stays locked and the invisible scrim still swallows
 * the press meant for what is behind it.
 */
export const WithoutOverlay: Story = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger asChild>
        <Button variant="outline">Open undimmed</Button>
      </DrawerTrigger>
      <DrawerContent overlay={false}>
        <PanelHeader>No scrim, still modal</PanelHeader>
        <DrawerBody className="p-4">
          <DrawerDescription className="text-foreground-on-surface-muted">
            {paragraph}
          </DrawerDescription>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * `modal={false}`: the page behind the panel stays interactive — try the button.
 *
 * Note what this costs. Vaul vetoes every outside press in this mode, so the
 * drawer does *not* close when you press the page, and `disableOverlayClose` has
 * nothing left to disable. It cannot work otherwise: a drawer that closed on an
 * outside press while leaving the page usable would close on the first press the
 * page was meant to receive. A non-modal drawer closes by its buttons, Escape and
 * the swipe.
 */
export const NonModal: Story = {
  render: function NonModalDrawer() {
    const [count, setCount] = React.useState(0);

    return (
      <div className="flex flex-col items-start gap-4">
        <Button variant="outline" onClick={() => setCount((n) => n + 1)}>
          Pressed {count} times — still works with the drawer open
        </Button>

        <Drawer defaultOpen modal={false}>
          <DrawerTrigger asChild>
            <Button variant="outline">Open</Button>
          </DrawerTrigger>
          <DrawerContent>
            <PanelHeader>Non-modal</PanelHeader>
            <DrawerBody className="p-4">
              <DrawerDescription className="text-foreground-on-surface-muted">
                {paragraph}
              </DrawerDescription>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </div>
    );
  },
};

/** An outside press no longer dismisses it. Escape, the swipe and the buttons still do. */
export const OverlayCloseDisabled: Story = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger asChild>
        <Button variant="outline">Open</Button>
      </DrawerTrigger>
      <DrawerContent disableOverlayClose>
        <PanelHeader>Confirm your purchase</PanelHeader>
        <DrawerBody className="p-4">
          <DrawerDescription className="text-foreground-on-surface-muted">
            {paragraph}
          </DrawerDescription>
        </DrawerBody>
        <PanelActions>
          <Button size="lg">Confirm</Button>
          <DrawerClose asChild>
            <Button size="lg" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </PanelActions>
      </DrawerContent>
    </Drawer>
  ),
};
