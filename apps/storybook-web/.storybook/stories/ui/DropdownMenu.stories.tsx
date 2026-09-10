import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@ui/web/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@ui/web/DropdownMenu";

const meta: Meta<typeof DropdownMenu> = {
  title: "Needs Review/Molecules/DropdownMenu",
  id: "DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Controls the open state of the menu",
    },
    defaultOpen: {
      control: "boolean",
      description: "The default open state of the menu",
    },
    modal: {
      control: "boolean",
      description: "Whether interactions outside are disabled",
    },
    onOpenChange: {
      action: "openChange",
      description: "Called when the open state changes",
    },
  },
};

export default meta;

type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: (args) => (
    <DropdownMenu {...args}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const Checkboxs: Story = {
  render: () => {
    const [viewOptions, setViewOptions] = useState({
      showToolbar: true,
      showStatusBar: false,
    });

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">View</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>View Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            value="toolbar"
            checked={viewOptions.showToolbar}
            onCheckedChange={(checked) =>
              setViewOptions((current) => ({
                ...current,
                showToolbar: Boolean(checked),
              }))
            }
          >
            Show Toolbar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            value="status-bar"
            checked={viewOptions.showStatusBar}
            onCheckedChange={(checked) =>
              setViewOptions((current) => ({
                ...current,
                showStatusBar: Boolean(checked),
              }))
            }
          >
            Show Status Bar
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};

export const RadioGroup: Story = {
  render: () => {
    const [position, setPosition] = useState("bottom");

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Position</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Panel position</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
            <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="left">Left</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};

export const Submenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Share</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem>Email</DropdownMenuItem>
        <DropdownMenuItem>
          Copy link
          <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem>Twitter</DropdownMenuItem>
            <DropdownMenuItem>Facebook</DropdownMenuItem>
            <DropdownMenuItem>LinkedIn</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

/**
 * The one story the visual suite photographs, and it is photographed open — a
 * closed dropdown is a `Button`, which has its own baselines. Everything the
 * panel can hold is in here at once: a caption, a rule, plain rows, a row with a
 * shortcut, a destructive row, a disabled row, a tick, a radio and the row that
 * opens a submenu.
 *
 * `defaultOpen` is deliberately not set — the spec clicks the trigger, because
 * the helper waits for the popper to place itself and a panel that is already
 * open on load is photographed mid-measurement.
 */
export const AllStates: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Account</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>sam@example.com</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem value="profile">Profile</DropdownMenuItem>
        <DropdownMenuItem value="settings">
          Settings
          <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem value="billing" disabled>
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem value="receipts" checked>
          Email me receipts
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value="usd">
          <DropdownMenuRadioItem value="usd">US dollars</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="eur">Euros</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Invite a friend</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem value="invite-email">By email</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem value="sign-out" variant="destructive">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
