import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

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
} from "@/molecules/DropdownMenu";

/**
 * One mount per test — a second `render` in the same `it` leaves two menus in the
 * document and every locator after it matches twice.
 *
 * The panel is portalled out of the container, so its parts are looked up on the
 * page rather than within it. The root is always named: `createTestIdFor`
 * returns `undefined` for every part when it is not, so an unnamed menu is
 * deliberately unaddressable.
 */
async function mount(
  children: React.ReactNode,
  props: React.ComponentProps<typeof DropdownMenu> = {},
) {
  const view = await render(
    <DropdownMenu data-testid="account" {...props}>
      <DropdownMenuTrigger>Account</DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>,
  );
  const within = page.elementLocator(view.container);

  return {
    within,
    part: (name: string) => page.getByTestId(`account-${name}`),
    open: () => userEvent.click(within.getByRole("button", { name: "Account" })),
  };
}

describe("naming the parts", () => {
  it("derives every part from the menu's own testid, and a row from its value", async () => {
    const { part, open } = await mount(
      <>
        <DropdownMenuLabel>Signed in</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem value="profile">Profile</DropdownMenuItem>
        <DropdownMenuItem value="sign-out">Sign out</DropdownMenuItem>
      </>,
    );

    await open();

    await expect.element(part("content")).toBeInTheDocument();
    await expect.element(part("label")).toHaveTextContent("Signed in");
    await expect.element(part("item-profile")).toHaveTextContent("Profile");
    await expect.element(part("item-sign-out")).toHaveTextContent("Sign out");

    // The separator is not among them, and that is deliberate: a menu has one
    // per group and none of them stands for anything, so a derived name would
    // only give a locator four elements to choose between.
    expect(
      page.getByRole("menu").element().querySelectorAll("[data-testid*='separator']"),
    ).toHaveLength(0);
  });

  it("puts no test ids in the DOM when the menu was not named", async () => {
    const view = await render(
      <DropdownMenu>
        <DropdownMenuTrigger>Account</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem value="profile">Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const within = page.elementLocator(view.container);

    await userEvent.click(within.getByRole("button", { name: "Account" }));

    // Asserted against the panel's own subtree rather than the document: the
    // panel is portalled onto `body`, which the runner shares with its own
    // furniture, so a document-wide sweep answers about that too.
    const menu = page.getByRole("menu").element();

    expect(menu.hasAttribute("data-testid")).toBe(false);
    expect(menu.querySelectorAll("[data-testid]")).toHaveLength(0);
  });
});

describe("choosing a row", () => {
  it("reports the row that was picked and leaves a disabled one alone", async () => {
    const onSelect = vi.fn();
    const { part, open } = await mount(
      <>
        <DropdownMenuItem value="profile" onSelect={() => void onSelect("profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem value="billing" disabled onSelect={() => void onSelect("billing")}>
          Billing
        </DropdownMenuItem>
      </>,
    );

    await open();
    await userEvent.click(part("item-billing"), { force: true });
    await userEvent.click(part("item-profile"));

    expect(onSelect.mock.calls.flat()).toEqual(["profile"]);
  });

  it("marks a destructive row so the styling and the meaning cannot disagree", async () => {
    const { part, open } = await mount(
      <DropdownMenuItem value="sign-out" variant="destructive">
        Sign out
      </DropdownMenuItem>,
    );

    await open();

    await expect.element(part("item-sign-out")).toHaveAttribute("data-variant", "destructive");
  });
});

describe("rows that hold a value", () => {
  it("ticks a checkbox row and reports the new state", async () => {
    const onCheckedChange = vi.fn();
    const { part, open } = await mount(
      <DropdownMenuCheckboxItem value="receipts" checked={false} onCheckedChange={onCheckedChange}>
        Email me receipts
      </DropdownMenuCheckboxItem>,
    );

    await open();

    // Named by what the row is, not by whether it is ticked — so the id it is
    // clicked by is the id it still has afterwards.
    await userEvent.click(part("item-receipts"));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("names a radio row by its value and reports the one chosen", async () => {
    const onValueChange = vi.fn();
    const { part, open } = await mount(
      <DropdownMenuRadioGroup value="usd" onValueChange={onValueChange}>
        <DropdownMenuRadioItem value="usd">US dollars</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="eur">Euros</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>,
    );

    await open();

    await expect.element(part("item-usd")).toHaveAttribute("data-state", "checked");
    await userEvent.click(part("item-eur"));

    expect(onValueChange).toHaveBeenCalledWith("eur");
  });
});

describe("a menu that opens out of a row", () => {
  it("opens the submenu from its row and names both from the menu's own testid", async () => {
    const onSelect = vi.fn();
    const { part, open } = await mount(
      <DropdownMenuGroup>
        <DropdownMenuItem value="profile">Profile</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Currency</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem value="usd" onSelect={() => void onSelect("usd")}>
              US dollars
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuGroup>,
    );

    await open();
    await userEvent.click(part("sub-trigger"));

    // The submenu panel is a second portal, so a row inside it has to keep
    // deriving its name from the same base as the rows outside.
    await expect.element(part("sub-content")).toBeInTheDocument();
    await userEvent.click(part("item-usd"));

    expect(onSelect.mock.calls.flat()).toEqual(["usd"]);
  });

  it("puts the shortcut hint in the row that owns it", async () => {
    const { part, open } = await mount(
      <DropdownMenuItem value="settings">
        Settings
        <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
      </DropdownMenuItem>,
    );

    await open();

    await expect.element(part("item-settings")).toHaveTextContent("⌘,");
  });
});
