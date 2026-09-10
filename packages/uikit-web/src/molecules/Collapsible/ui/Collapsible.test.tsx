import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Badge } from "@/atoms/Badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  CollapsibleLabel,
  CollapsibleToggle,
  CollapsibleTrigger,
} from "@/molecules/Collapsible";

// The two sizes are two compositions, so there are two fixtures rather than one with a
// branch in it — the thing under test is partly *which parts you write*, and a fixture
// that hid that behind a flag would be testing itself.

function CompactFixture({
  selected,
  triggerProps,
  ...props
}: React.ComponentProps<typeof Collapsible> & {
  selected?: boolean;
  triggerProps?: Partial<React.ComponentProps<typeof CollapsibleTrigger>>;
}) {
  return (
    <Collapsible className="w-96" {...props}>
      <CollapsibleTrigger selected={selected} {...triggerProps}>
        <CollapsibleLabel>Order #4189</CollapsibleLabel>
        <Badge>New</Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>100 Market St, San Francisco</CollapsibleContent>
    </Collapsible>
  );
}

function LargeFixture(props: React.ComponentProps<typeof Collapsible>) {
  return (
    <Collapsible className="w-96" size="large" {...props}>
      <CollapsibleHeader>
        <CollapsibleLabel>Recent activity</CollapsibleLabel>
        <Badge>3</Badge>
        <CollapsibleToggle aria-label="Show recent activity" />
      </CollapsibleHeader>
      <CollapsibleContent>Three new messages</CollapsibleContent>
    </Collapsible>
  );
}

async function mountCompact(props: React.ComponentProps<typeof CompactFixture> = {}) {
  // Named in the test even though a consumer need not: `createTestIdFor` returns
  // `undefined` for every part when the root has no name, so an unnamed root makes the
  // whole component unaddressable. One test below covers exactly that.
  const view = await render(<CompactFixture data-testid="order" {...props} />);
  // Scoped to this render — `page.getByTestId` searches the whole document, which is
  // shared by every test in the file.
  const within = page.elementLocator(view.container);

  return {
    within,
    row: within.getByRole("button", { name: /Order #4189/ }),
    label: within.getByTestId("order-label"),
    panel: within.getByTestId("order-content"),
  };
}

async function mountLarge(props: React.ComponentProps<typeof Collapsible> = {}) {
  const view = await render(<LargeFixture data-testid="activity" {...props} />);
  const within = page.elementLocator(view.container);

  return {
    within,
    header: within.getByTestId("activity-header"),
    toggle: within.getByRole("button", { name: "Show recent activity" }),
    panel: within.getByTestId("activity-content"),
  };
}

describe("opening the compact size, where the row is the button", () => {
  it("starts closed, with the panel hidden rather than gone", async () => {
    const { row, panel } = await mountCompact();

    await expect.element(row).toHaveAttribute("aria-expanded", "false");
    // Radix keeps the panel mounted and marks it `hidden` — it needs the node to
    // measure. So this is `toBeVisible`, not `toBeInTheDocument`, throughout the file,
    // and the distinction is load-bearing: the panel's own class list sets
    // `display: flex`, which beats the UA's `[hidden] { display: none }`. What actually
    // hides it is `[&[hidden]]:hidden`, and this is the assertion that fails if that
    // class is ever dropped. Keyed on the attribute rather than on `data-state`
    // deliberately — Radix sets `hidden` only once the exit animation has finished,
    // while `data-state="closed"` is there for the whole of it, so the `data-state`
    // version would hide the panel on the first frame of closing and the collapse would
    // never be seen.
    await expect.element(panel).not.toBeVisible();
    await expect.element(panel).toBeInTheDocument();
  });

  it("opens on a click anywhere in the row and closes again", async () => {
    const { row, panel, label } = await mountCompact();

    // The label, not the chevron: the point of this size is that the whole row is the
    // control, and a click landing on a child has to reach the button.
    await userEvent.click(label);
    await expect.element(panel).toBeVisible();
    await expect.element(row).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(label);
    await expect.element(panel).not.toBeVisible();
  });

  it("opens from the keyboard, because the row is a real button", async () => {
    const { row, panel } = await mountCompact();

    await userEvent.keyboard("{Tab}");
    await expect.element(row).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect.element(panel).toBeVisible();
  });

  it("marks the open row so the chevron rule and a consumer's styles can see it", async () => {
    const { row } = await mountCompact({ defaultOpen: true });

    await expect.element(row).toHaveAttribute("data-state", "open");
  });

  it("names the panel from the row that controls it", async () => {
    const { row, panel } = await mountCompact({ defaultOpen: true });

    // `element()` is a snapshot of right now, not a retrying locator, so there is
    // nothing to await — and the row is already settled by the assertion above.
    const controls = row.element().getAttribute("aria-controls");
    const panelId = panel.element().id;

    expect(controls).toBe(panelId);
  });
});

describe("opening the large size, where only the toggle is the button", () => {
  it("leaves the header row inert, so a control can sit in it", async () => {
    const { within, toggle } = await mountLarge();

    // Exactly one button in the whole component, and it is the toggle — not the row
    // around it. A badge, a count or a menu beside the label depends on that: none of
    // them may be nested inside a button.
    expect(within.getByRole("button").elements()).toHaveLength(1);
    await expect.element(toggle).toBeInTheDocument();
  });

  it("opens and closes from the toggle", async () => {
    const { toggle, panel } = await mountLarge();

    await userEvent.click(toggle);
    await expect.element(panel).toBeVisible();
    await expect.element(toggle).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(toggle);
    await expect.element(panel).not.toBeVisible();
  });

  it("does not open when the label beside the toggle is clicked", async () => {
    const { within, panel } = await mountLarge();

    await userEvent.click(within.getByTestId("activity-label"));

    await expect.element(panel).not.toBeVisible();
  });

  it("keeps its own accessible name, which aria-expanded does not supply", async () => {
    const { toggle } = await mountLarge();

    await expect.element(toggle).toHaveAccessibleName("Show recent activity");
  });
});

describe("being controlled from outside", () => {
  it("reports the state it is asked to move to without moving itself", async () => {
    const onOpenChange = vi.fn();
    const { row, panel } = await mountCompact({ open: false, onOpenChange });

    await userEvent.click(row);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Still closed: the parent owns the state, and a controlled component that opened
    // itself anyway would fight it on the next render.
    await expect.element(panel).not.toBeVisible();
  });

  it("opens when the prop says so", async () => {
    const { panel } = await mountCompact({ open: true, onOpenChange: vi.fn() });

    await expect.element(panel).toBeVisible();
  });
});

describe("being disabled", () => {
  it("turns the compact row off and marks the parts", async () => {
    const { within, row, panel } = await mountCompact({ disabled: true });

    await expect.element(row).toBeDisabled();
    await expect.element(panel).not.toBeVisible();
    // Radix marks what it owns. Not clicked: `button-base` sets `pointer-events: none`
    // on a disabled control, so a click would be a test of Playwright rather than of
    // this component.
    await expect.element(within.getByTestId("order-trigger")).toHaveAttribute("data-disabled");
  });

  it("turns the large toggle off and lets the header see it", async () => {
    const { header, toggle } = await mountLarge({ disabled: true });

    await expect.element(toggle).toBeDisabled();
    // The header is ours, not Radix's, so nothing marks it from outside — it reads the
    // flag from context. This is the seam that breaks if the provider stops publishing.
    await expect.element(header).toHaveClass("text-foreground-state-disabled");
  });
});

describe("marking the current row", () => {
  it("reflects selected as an attribute, and omits it otherwise", async () => {
    const { row } = await mountCompact({ selected: true });

    await expect.element(row).toHaveAttribute("data-selected");

    const plain = await mountCompact({ selected: false });
    await expect.element(plain.row).not.toHaveAttribute("data-selected");
  });

  it("is independent of whether the panel is open", async () => {
    const { row } = await mountCompact({ selected: true, defaultOpen: true });

    await expect.element(row).toHaveAttribute("data-selected");
    await expect.element(row).toHaveAttribute("data-state", "open");
  });
});

describe("naming the parts", () => {
  it("derives every part's id from the root's", async () => {
    const { within } = await mountCompact({ defaultOpen: true });

    for (const part of ["order-trigger", "order-trigger-chevron", "order-label", "order-content"]) {
      await expect.element(within.getByTestId(part)).toBeInTheDocument();
    }
  });

  it("derives the large size's parts too", async () => {
    const { within } = await mountLarge({ defaultOpen: true });

    for (const part of [
      "activity-header",
      "activity-label",
      "activity-toggle",
      "activity-toggle-chevron",
      "activity-content",
    ]) {
      await expect.element(within.getByTestId(part)).toBeInTheDocument();
    }
  });

  it("puts nothing test-only in the DOM for a collapsible nobody named", async () => {
    const view = await render(
      <Collapsible defaultOpen className="w-96">
        <CollapsibleTrigger>
          <CollapsibleLabel>Unnamed</CollapsibleLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>Body</CollapsibleContent>
      </Collapsible>,
    );

    expect(view.container.querySelectorAll("[data-testid]")).toHaveLength(0);
  });

  it("lets a part override its derived id", async () => {
    const { within } = await mountCompact({
      triggerProps: { "data-testid": "order-row" },
    });

    await expect.element(within.getByTestId("order-row")).toBeInTheDocument();
    // Replaced rather than extended — the override is the escape hatch for two of the
    // same part in one collapsible, so the derived name must be gone.
    expect(within.getByTestId("order-trigger").elements()).toHaveLength(0);
  });
});

describe("styling it from outside", () => {
  it("takes a className on every part without losing its own", async () => {
    const view = await render(
      <Collapsible defaultOpen className="w-96 shadow-lg" data-testid="styled" size="large">
        <CollapsibleHeader className="gap-4">
          <CollapsibleLabel className="whitespace-normal">Wrapping title</CollapsibleLabel>
          <CollapsibleToggle />
        </CollapsibleHeader>
        <CollapsibleContent className="p-8">Body</CollapsibleContent>
      </Collapsible>,
    );
    const within = page.elementLocator(view.container);

    // The consumer's class lands, and the component's own is still there — `cn()` puts
    // `className` last so an override wins, which is not the same as a replacement.
    await expect.element(within.getByTestId("styled-header")).toHaveClass("gap-4");
    await expect.element(within.getByTestId("styled-header")).toHaveClass("items-center");
    await expect.element(within.getByTestId("styled-label")).toHaveClass("whitespace-normal");
    await expect.element(within.getByTestId("styled-content")).toHaveClass("p-8");
  });
});

describe("naming the large size's toggle", () => {
  it("takes its name from the label beside it, with nothing passed", async () => {
    const view = await render(
      <Collapsible data-testid="activity" size="large">
        <CollapsibleHeader>
          <CollapsibleLabel>Recent activity</CollapsibleLabel>
          <CollapsibleToggle />
        </CollapsibleHeader>
        <CollapsibleContent>Three new messages</CollapsibleContent>
      </Collapsible>,
    );
    const within = page.elementLocator(view.container);

    // The title is already on screen and already translated; the icon-only button
    // having to repeat it as a second string is what this replaces.
    await expect
      .element(within.getByTestId("activity-toggle"))
      .toHaveAccessibleName("Recent activity");
  });

  it("lets an explicit aria-label win over the label", async () => {
    const { toggle } = await mountLarge();

    // `LargeFixture` passes one, for a button that means more than the title says.
    await expect.element(toggle).toHaveAccessibleName("Show recent activity");
  });

  it("falls back to its own default when there is no label to point at", async () => {
    const view = await render(
      <Collapsible data-testid="bare" size="large">
        <CollapsibleHeader>
          <CollapsibleToggle />
        </CollapsibleHeader>
        <CollapsibleContent>Nothing named this</CollapsibleContent>
      </Collapsible>,
    );
    const within = page.elementLocator(view.container);

    // `aria-labelledby` resolves to nothing, so the accessible-name algorithm falls
    // through to `aria-label`. This is the assertion that would catch a browser not
    // doing that — the whole fallback rests on it.
    await expect.element(within.getByTestId("bare-toggle")).toHaveAccessibleName("Toggle section");
  });
});

describe("giving the label an element of its own", () => {
  it("renders the caller's heading and keeps the type, the id and the testid", async () => {
    const view = await render(
      <Collapsible data-testid="activity" size="large">
        <CollapsibleHeader>
          <CollapsibleLabel as="h3">Recent activity</CollapsibleLabel>
          <CollapsibleToggle />
        </CollapsibleHeader>
        <CollapsibleContent>Three new messages</CollapsibleContent>
      </Collapsible>,
    );
    const within = page.elementLocator(view.container);
    const heading = within.getByRole("heading", { name: "Recent activity" });

    await expect.element(heading).toBeVisible();
    await expect.element(heading).toHaveAttribute("data-testid", "activity-label");
    await expect
      .element(within.getByTestId("activity-toggle"))
      .toHaveAccessibleName("Recent activity");
  });
});

describe("composing the wrong part for the size", () => {
  it("warns when the compact trigger is used inside a large collapsible", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await render(
      <Collapsible size="large">
        <CollapsibleTrigger>
          <CollapsibleLabel>Wrong part</CollapsibleLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>…</CollapsibleContent>
      </Collapsible>,
    );

    // It renders and looks nearly right, which is exactly why it needs saying out loud.
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("CollapsibleTrigger"));
    warn.mockRestore();
  });

  it("warns when the large header is used inside a compact one", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await render(
      <Collapsible>
        <CollapsibleHeader>
          <CollapsibleLabel>Wrong part</CollapsibleLabel>
          <CollapsibleToggle />
        </CollapsibleHeader>
        <CollapsibleContent>…</CollapsibleContent>
      </Collapsible>,
    );

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("CollapsibleHeader"));
    warn.mockRestore();
  });

  it("says nothing about a part rendered on its own, which has no size to disagree with", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // A story showing one row, or a test of the header alone. There is no root above
    // it, so the fallback size is not a decision anybody made.
    await render(
      <CollapsibleHeader>
        <CollapsibleLabel>On its own</CollapsibleLabel>
      </CollapsibleHeader>,
    );

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("handing the compact row to a consumer's own element", () => {
  async function mountAsChild() {
    const view = await render(
      <Collapsible className="w-96" data-testid="order">
        <CollapsibleTrigger asChild>
          <a href="#order-4189">
            <CollapsibleLabel>Order #4189</CollapsibleLabel>
            <Badge>New</Badge>
          </a>
        </CollapsibleTrigger>
        <CollapsibleContent>100 Market St, San Francisco</CollapsibleContent>
      </Collapsible>,
    );
    const within = page.elementLocator(view.container);

    return { within, row: within.getByRole("link", { name: /Order #4189/ }) };
  }

  it("renders the element it was given, with the chevron still inside it", async () => {
    // Two children reach Radix's `Slot` here — the consumer's anchor and the chevron
    // the trigger always draws — so without `Slottable` marking which of them is the
    // element to merge into, `Slot` hits `React.Children.only` and throws. This test
    // therefore fails as a crashed render rather than as a missing attribute, which is
    // also how it failed in an app.
    const { within, row } = await mountAsChild();

    await expect.element(row).toBeVisible();
    await expect.element(within.getByTestId("order-trigger-chevron")).toBeInTheDocument();
    // Inside the anchor, not beside it: the row is one click target, and a chevron
    // that escaped it would be outside the thing that opens the panel.
    expect(row.element().querySelector("[data-collapsible-chevron]")).not.toBeNull();
  });

  it("still opens the panel from the element it merged into", async () => {
    const { within, row } = await mountAsChild();

    await userEvent.click(row);

    await expect.element(within.getByTestId("order-content")).toBeVisible();
    await expect.element(row).toHaveAttribute("aria-expanded", "true");
  });
});
