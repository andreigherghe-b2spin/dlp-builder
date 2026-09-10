import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/organisms/Dialog";
import { SelectField } from "@/molecules/SelectField";

const OPTIONS = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
];

/**
 * A real `SelectField`, never a stand-in: what is under test is the seam between
 * a dialog and the floating panels composed into it, and a fake `Select` would go
 * on passing after that seam broke.
 *
 * `name` is the testid base a field derives its parts from, so the trigger is
 * `country-trigger` and the menu `country-content` with nothing else passed.
 */
const field = (
  <SelectField name="country" label="Country" placeholder="Pick one" options={OPTIONS} />
);

const trigger = () => page.getByTestId("country-trigger");
const menu = () => page.getByTestId("country-content");

async function openTheMenu() {
  await userEvent.click(trigger());
  await expect.element(menu()).toBeVisible();

  return {
    menu: menu().element() as HTMLElement,
    trigger: trigger().element() as HTMLElement,
  };
}

describe("a floating panel opened inside a dialog", () => {
  async function mountInDialog() {
    await render(
      <Dialog data-testid="signup" defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim your bonus</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>Where you are playing from.</DialogDescription>
            {field}
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );

    const panel = page.getByRole("dialog");
    await expect.element(panel).toBeVisible();

    return panel.element() as HTMLElement;
  }

  it("renders inside the dialog's own panel rather than beside it in the body", async () => {
    // The whole point of the container: portalled to the body, the menu is a
    // sibling of whatever modal it was opened from, and which one is on top comes
    // down to a z-index this package does not own. Inside the panel it is above
    // the dialog's content for the same reason any later sibling is.
    const panel = await mountInDialog();
    const { menu } = await openTheMenu();

    expect(panel.contains(menu)).toBe(true);
  });

  it("lands in the panel even when the menu is already open at mount", async () => {
    // The one case the click-to-open tests above cannot reach. `DialogContent`
    // publishes its panel as state, so on its very first render the container is still
    // `null` and a menu open at that moment portals to the body; the ref then fires and
    // the menu is re-mounted into the panel. That happens before paint and there is
    // nothing in a just-opened menu to lose, so the outcome is right — but it is right
    // by way of a discarded mount, and this pins the outcome rather than the route.
    await render(
      <Dialog data-testid="signup" defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim your bonus</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>Where you are playing from.</DialogDescription>
            <SelectField
              name="country"
              label="Country"
              placeholder="Pick one"
              options={OPTIONS}
              defaultOpen
            />
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );

    const panel = page.getByRole("dialog");
    await expect.element(menu()).toBeVisible();

    expect((panel.element() as HTMLElement).contains(menu().element())).toBe(true);
    // Exactly one: the discarded mount has to be gone, not left behind in the body as a
    // second listbox that a `getByRole` would then find at random.
    expect(menu().elements()).toHaveLength(1);
  });

  it("is still positioned against its trigger, not against the panel that contains it", async () => {
    // The panel centres itself with a transform, which makes it the containing
    // block for the `position: fixed` popper inside it. Floating UI measures the
    // offset parent and compensates; if it ever stopped, the menu would be off by
    // the panel's own top-left — hundreds of pixels, not a rounding error.
    await mountInDialog();
    const { menu, trigger } = await openTheMenu();

    const menuBox = menu.getBoundingClientRect();
    const triggerBox = trigger.getBoundingClientRect();

    expect(Math.abs(menuBox.left - triggerBox.left)).toBeLessThan(2);
    expect(Math.abs(menuBox.width - triggerBox.width)).toBeLessThan(2);
  });
});

describe("a floating panel opened outside a dialog", () => {
  it("goes on portalling to the document body", async () => {
    // The default every consumer that never renders a dialog depends on. Radix
    // reads `container={null}` as the body, so nothing here changed for them —
    // this is what proves it stayed that way.
    await render(field);

    const { menu } = await openTheMenu();

    expect(menu.closest("[role=dialog]")).toBeNull();
    expect(document.body.contains(menu)).toBe(true);
  });
});
