import type * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  DialogFooter,
  type DialogFooterProps,
  DialogHeader,
  type DialogHeaderProps,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
} from "@/organisms/Dialog";
import { Button } from "@/atoms/Button";

const TITLE = "Claim your bonus";
const DESCRIPTION = "Ten free spins, no deposit needed.";

type Parts = {
  contentProps?: Partial<DialogContentProps>;
  headerProps?: Partial<DialogHeaderProps>;
  footerProps?: Partial<DialogFooterProps>;
  /** Left out for a dialog driven from outside, which has no trigger to press. */
  withTrigger?: boolean;
  footer?: React.ReactNode;
};

async function mountDialog({
  contentProps,
  headerProps,
  footerProps,
  withTrigger = true,
  footer = (
    <>
      <Button size="lg">Confirm</Button>
      <DialogClose asChild>
        <Button size="lg" variant="outline">
          Cancel
        </Button>
      </DialogClose>
    </>
  ),
  ...props
}: Partial<DialogProps> & Parts = {}) {
  const view = await render(
    // The base every part derives its id from — `signup-content`, `signup-header-close`.
    // `Dialog` renders no element of its own, so it publishes the base through context
    // rather than placing it, and a dialog nobody named hands out no ids at all.
    <Dialog data-testid="signup" {...props}>
      {withTrigger && <DialogTrigger>Open</DialogTrigger>}
      <DialogContent {...contentProps}>
        <DialogHeader {...headerProps}>
          <DialogTitle>{TITLE}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>{DESCRIPTION}</DialogDescription>
        </DialogBody>
        <DialogFooter {...footerProps}>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>,
  );

  // Page-level rather than scoped to the render: the panel is portalled to
  // `document.body`, so a container-scoped locator would never see it. The setup
  // unmounts after every test, so there is only ever one dialog on the page.
  const one = (testId: string) => page.getByTestId(testId).element() as HTMLElement;
  const count = (testId: string) => page.getByTestId(testId).elements().length;

  const panel = () => page.getByRole("dialog");
  const trigger = () => page.elementLocator(view.container).getByText("Open");
  const part = (name: string) => page.getByTestId(`signup-${name}`);

  const open = async () => {
    await userEvent.click(trigger());
    await expect.element(panel()).toBeVisible();
  };

  /**
   * A press on the overlay, in the corner where nothing else is: the panel is
   * centred, so the top-left of a `fixed inset-0` scrim is the one place a real
   * click cannot land on the dialog instead of behind it.
   */
  const pressOutside = () => userEvent.click(part("overlay"), { position: { x: 4, y: 4 } });

  /**
   * A duration rather than a condition, and named so it reads as an assertion:
   * proving the dialog did *not* close is the one thing there is nothing
   * observable to wait for. Comfortably past the 200ms close animation.
   */
  const expectStillOpen = async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    await expect.element(panel()).toBeVisible();
  };

  return {
    view,
    count,
    expectStillOpen,
    one,
    open,
    panel,
    part,
    pressOutside,
    trigger,
  };
}

describe("opening it and closing it", () => {
  it("opens from its trigger, titled and described", async () => {
    const dialog = await mountDialog();

    await expect.element(dialog.panel()).not.toBeInTheDocument();

    await dialog.open();

    await expect.element(dialog.panel()).toHaveAccessibleName(TITLE);
    await expect.element(dialog.panel()).toHaveAccessibleDescription(DESCRIPTION);
  });

  it("closes from the close button in the header", async () => {
    const dialog = await mountDialog();

    await dialog.open();
    await userEvent.click(page.getByRole("button", { name: "Close" }));

    await expect.element(dialog.panel()).not.toBeInTheDocument();
  });

  it("closes from a `DialogClose` in the footer", async () => {
    const dialog = await mountDialog();

    await dialog.open();
    await userEvent.click(page.getByRole("button", { name: "Cancel" }));

    await expect.element(dialog.panel()).not.toBeInTheDocument();
  });

  it("closes on a press behind the panel", async () => {
    const dialog = await mountDialog();

    await dialog.open();
    await dialog.pressOutside();

    await expect.element(dialog.panel()).not.toBeInTheDocument();
  });

  it("reports every edge to `onOpenChange` and only the closing one to `onClose`", async () => {
    const onOpenChange = vi.fn();
    const onClose = vi.fn();
    const dialog = await mountDialog({ onOpenChange, onClose });

    await dialog.open();

    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.keyboard("{Escape}");
    await expect.element(dialog.panel()).not.toBeInTheDocument();

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("a dialog the user has to answer", () => {
  it("holds still when pressed behind, while Escape and the button still work", async () => {
    // The veto is `preventDefault` on Radix's own event, so the caller's handler runs
    // first either way — a dialog that swallowed the press silently could not be
    // instrumented by the product around it.
    const onPointerDownOutside = vi.fn();
    const dialog = await mountDialog({
      contentProps: { disableOverlayClose: true, onPointerDownOutside },
    });

    await dialog.open();
    await dialog.pressOutside();
    await dialog.expectStillOpen();

    expect(onPointerDownOutside).toHaveBeenCalledTimes(1);

    await userEvent.keyboard("{Escape}");

    await expect.element(dialog.panel()).not.toBeInTheDocument();
  });
});

describe("driving it from outside", () => {
  it("never moves itself — it asks, and the caller decides", async () => {
    const onClose = vi.fn();
    const dialog = await mountDialog({ open: true, withTrigger: false, onClose });

    await expect.element(dialog.panel()).toBeVisible();

    await userEvent.click(page.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    // The parent's `open` never changed, so the panel must still be there: a dialog
    // that closed itself here would be closed twice over in a real app, and would
    // reopen on the next render.
    await dialog.expectStillOpen();
  });
});

describe("what it does to the page behind it", () => {
  it("moves focus into the panel and hands it back on close", async () => {
    const dialog = await mountDialog();

    await dialog.open();

    const content = dialog.one("signup-content");

    expect(content.contains(document.activeElement)).toBe(true);

    await userEvent.keyboard("{Escape}");
    await expect.element(dialog.panel()).not.toBeInTheDocument();
    await expect.element(dialog.trigger()).toHaveFocus();
  });

  it("hides the rest of the page from a screen reader while it is modal", async () => {
    const dialog = await mountDialog();
    const trigger = dialog.trigger().element();

    await dialog.open();

    // Radix hides the panel's siblings rather than each control it finds, so what
    // the trigger inherits is an ancestor's `aria-hidden` — which is the thing that
    // actually takes it out of the screen reader's reach.
    expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe("where the panel is rendered", () => {
  it("portals the panel out of the trigger's tree", async () => {
    const dialog = await mountDialog();

    await dialog.open();

    const content = dialog.one("signup-content");

    expect(dialog.view.container.contains(content)).toBe(false);
    expect(document.body.contains(content)).toBe(true);
  });

  it("keeps the panel inline when asked, and mounts the overlay either way", async () => {
    // The overlay comes along even when the surrounding layout hides it: it is what
    // makes the page behind the dialog inert, so a panel without one is not modal.
    const dialog = await mountDialog({
      contentProps: { portal: false, classNames: { overlay: "hidden" } },
    });

    await dialog.open();

    expect(dialog.view.container.contains(dialog.one("signup-content"))).toBe(true);
    expect(dialog.view.container.contains(dialog.one("signup-overlay"))).toBe(true);
  });
});

describe("naming its parts", () => {
  it("derives every part's name from the base the root published", async () => {
    const dialog = await mountDialog({
      headerProps: { onBack: vi.fn(), logo: <span>Brand</span> },
      footerProps: { caption: "Terms apply", link: <a href="/terms">Read the terms</a> },
    });

    await dialog.open();

    // The parts a consumer composes sit flat under the base, in the order they are
    // written; a part's own internals nest under the part instead.
    for (const name of ["trigger", "overlay", "content", "header", "title", "body", "footer"]) {
      await expect.element(dialog.part(name)).toBeInTheDocument();
    }
    for (const name of ["header-close", "header-back", "header-logo"]) {
      await expect.element(dialog.part(name)).toBeInTheDocument();
    }
    for (const name of ["footer-buttons", "footer-link", "footer-caption"]) {
      await expect.element(dialog.part(name)).toBeInTheDocument();
    }
  });

  it("lets one part be renamed without renaming the rest", async () => {
    // The escape hatch for two of the same part in one dialog: the override replaces
    // the derived name rather than extending it.
    const dialog = await mountDialog({ contentProps: { "data-testid": "step-two" } });

    await dialog.open();

    await expect.element(page.getByTestId("step-two")).toBeInTheDocument();
    expect(dialog.count("signup-content")).toBe(0);
    await expect.element(dialog.part("body")).toBeInTheDocument();
  });

  it("puts nothing test-only into the DOM of a dialog nobody named", async () => {
    await render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TITLE}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>{DESCRIPTION}</DialogDescription>
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );

    const panel = page.getByRole("dialog").element();

    // The panel and everything in it, rather than the whole document: the runner's
    // own render container carries a `data-testid` of its own, and it is not the
    // dialog's to be silent about.
    expect(panel.hasAttribute("data-testid")).toBe(false);
    expect(panel.querySelector("[data-testid]")).toBeNull();
  });
});

describe("the header", () => {
  it("reports a press on the back arrow, for a dialog that is a flow", async () => {
    const onBack = vi.fn();
    const dialog = await mountDialog({ headerProps: { onBack } });

    await dialog.open();
    await userEvent.click(page.getByRole("button", { name: "Back" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("dresses the info element it is given and leaves its handler alone", async () => {
    const onInfo = vi.fn();
    const dialog = await mountDialog({
      headerProps: {
        info: (
          <button type="button" aria-label="About this offer" onClick={onInfo}>
            ?
          </button>
        ),
      },
    });

    await dialog.open();
    await userEvent.click(page.getByRole("button", { name: "About this offer" }));

    expect(onInfo).toHaveBeenCalledTimes(1);
    // Dressed, not wrapped: the element passed in is the one carrying the id, so a
    // tooltip trigger lands here intact.
    expect(dialog.one("signup-header-info").tagName).toBe("BUTTON");
  });

  it("draws no close button when asked not to", async () => {
    const dialog = await mountDialog({ headerProps: { showClose: false } });

    await dialog.open();

    expect(dialog.count("signup-header-close")).toBe(0);
    // Closing is still reported by the dialog itself, which is why the button is
    // safe to drop: Escape and the overlay are unaffected.
    await userEvent.keyboard("{Escape}");
    await expect.element(dialog.panel()).not.toBeInTheDocument();
  });
});

describe("the footer", () => {
  it("stacks them full width when it is vertical", async () => {
    const dialog = await mountDialog({ footerProps: { orientation: "vertical" } });

    await dialog.open();

    const buttons = dialog.one("signup-footer-buttons");
    const [confirm, cancel] = page
      .getByRole("button", { name: /Confirm|Cancel/ })
      .elements() as HTMLElement[];

    expect(dialog.one("signup-footer")).toHaveAttribute("data-orientation", "vertical");
    expect(cancel.getBoundingClientRect().top).toBeGreaterThan(
      confirm.getBoundingClientRect().bottom - 1,
    );
    expect(confirm.getBoundingClientRect().width).toBe(buttons.getBoundingClientRect().width);
  });

  it("draws the link and the caption under the buttons, and the link keeps its href", async () => {
    const dialog = await mountDialog({
      footerProps: {
        link: <a href="/terms">Read the terms</a>,
        caption: "You can change this at any time.",
      },
    });

    await dialog.open();

    // Dressed rather than wrapped, so the `<a>` is still the element with the
    // destination on it.
    await expect
      .element(page.getByRole("link", { name: "Read the terms" }))
      .toHaveAttribute("href", "/terms");
    await expect
      .element(dialog.part("footer-caption"))
      .toHaveTextContent("You can change this at any time.");
  });
});
