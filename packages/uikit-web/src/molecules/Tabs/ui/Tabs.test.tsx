import * as React from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Tabs, TabsContent, TabsList, TabsPanels, TabsTrigger } from "@/molecules/Tabs";

type Tab = { value: string; label: string; disabled?: boolean };

const settings: Tab[] = [
  { value: "account", label: "Account" },
  { value: "password", label: "Password" },
  { value: "billing", label: "Billing", disabled: true },
];

// Ten of them in a 288px row, which overflows on any platform's idea of how
// wide the word "Favourites" is.
const categories: Tab[] = [
  "Home",
  "Slots",
  "Live dealer",
  "New games",
  "Jackpots",
  "Bonus buy",
  "Table games",
  "Arcade",
  "Slingo",
  "Favourites",
  // `replaceAll`, not `replace`: the latter rewrites the first space only, so a
  // two-word label would put a literal space inside a `data-testid` and inside a
  // Radix value — and the lookups would fail as if the component were broken.
].map((label) => ({ value: label.toLowerCase().replaceAll(" ", "-"), label }));

function TabsFixture({
  tabs = settings,
  listProps,
  panelsProps,
  withPanels = true,
  ...props
}: React.ComponentProps<typeof Tabs> & {
  tabs?: Tab[];
  listProps?: React.ComponentProps<typeof TabsList>;
  panelsProps?: React.ComponentProps<typeof TabsPanels>;
  withPanels?: boolean;
}) {
  return (
    <Tabs defaultValue={tabs[0].value} className="w-72" {...props}>
      <TabsList {...listProps}>
        {tabs.map(({ value, label, disabled }) => (
          <TabsTrigger key={value} value={value} disabled={disabled}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {withPanels ? (
        <TabsPanels {...panelsProps}>
          {tabs.map(({ value, label }) => (
            <TabsContent key={value} value={value}>
              {label} panel
            </TabsContent>
          ))}
        </TabsPanels>
      ) : null}
    </Tabs>
  );
}

async function mountTabs(props: React.ComponentProps<typeof TabsFixture> = {}) {
  const view = await render(<TabsFixture data-testid="tabs" {...props} />);
  const within = page.elementLocator(view.container);

  return {
    view,
    within,
    tab: (name: string) => within.getByRole("tab", { name }),
    panel: () => within.getByRole("tabpanel"),
    previous: within.getByRole("button", { name: "Scroll tabs left" }),
    next: within.getByRole("button", { name: "Scroll tabs right" }),
    // A vertical bar cannot scroll left, so its arrows say so — which is the
    // accessible name a screen reader user is offered, and the only honest way
    // to tell the two bars apart from the outside.
    up: within.getByRole("button", { name: "Scroll tabs up" }),
    down: within.getByRole("button", { name: "Scroll tabs down" }),
    scrollLeft: () => (within.getByTestId("tabs-list").element() as HTMLElement).scrollLeft,
    scrollTop: () => (within.getByTestId("tabs-list").element() as HTMLElement).scrollTop,
  };
}

describe("selecting a tab", () => {
  it("opens the panel that belongs to it", async () => {
    const { tab, panel } = await mountTabs();

    await expect.element(panel()).toHaveTextContent("Account panel");
    await expect.element(tab("Account")).toHaveAttribute("aria-selected", "true");

    await userEvent.click(tab("Password"));

    await expect.element(panel()).toHaveTextContent("Password panel");
    await expect.element(tab("Password")).toHaveAttribute("aria-selected", "true");
    await expect.element(tab("Account")).toHaveAttribute("aria-selected", "false");
  });

  it("makes a tab a link without giving up the selected state", async () => {
    const view = await render(
      <Tabs value="/games/slots">
        <TabsList>
          <TabsTrigger value="/games/slots" asChild>
            <a href="/games/slots">Slots</a>
          </TabsTrigger>
          <TabsTrigger value="/games/live" asChild>
            <a href="/games/live">Live dealer</a>
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const within = page.elementLocator(view.container);

    await expect
      .element(within.getByRole("tab", { name: "Slots" }))
      .toHaveAttribute("href", "/games/slots");
    await expect
      .element(within.getByRole("tab", { name: "Slots" }))
      .toHaveAttribute("aria-selected", "true");
  });
});

describe("naming the parts", () => {
  it("derives every part's id from the one the tabs were given", async () => {
    const { within } = await mountTabs();

    await expect.element(within.getByTestId("tabs-list")).toBeInTheDocument();
    await expect.element(within.getByTestId("tabs-trigger-password")).toHaveTextContent("Password");
    await expect
      .element(within.getByTestId("tabs-content-account"))
      .toHaveTextContent("Account panel");
  });

  it("puts nothing test-only in the DOM of tabs nobody named", async () => {
    const view = await render(<TabsFixture />);

    expect(view.container.querySelector("[data-testid]")).toBeNull();
  });
});

describe("the box the panels sit in", () => {
  it("takes the styling the whole panel area shares", async () => {
    const { within } = await mountTabs({ panelsProps: { className: "panel-area" } });
    const panels = within.getByTestId("tabs-panels").element();

    expect(panels).toHaveClass("panel-area");
    expect(panels.contains(within.getByTestId("tabs-content-account").element())).toBe(true);
  });
});

describe("a row with more tabs than fit", () => {
  it("offers the way forward, and the way back once it has moved", async () => {
    const { previous, next, scrollLeft } = await mountTabs({ tabs: categories });

    await expect.element(next).toBeVisible();
    expect(previous.query()).toBeNull();

    await userEvent.click(next);

    await expect.poll(scrollLeft).toBeGreaterThan(0);
    await expect.element(previous).toBeVisible();
  });

  it("still measures the bar when the consumer takes a ref to it", async () => {
    // A `ref` arriving through `...props` used to displace the bar's own, which
    // left it unable to measure itself: no arrows, ever, and nothing to debug.
    let taken: HTMLElement | null = null;
    const { next } = await mountTabs({
      tabs: categories,
      listProps: {
        ref: (node: HTMLDivElement | null) => {
          taken = node;
        },
      },
    });

    await expect.element(next).toBeVisible();
    expect(taken).not.toBeNull();
  });

  it("leaves the arrows out when told to", async () => {
    const { previous, next } = await mountTabs({
      tabs: categories,
      listProps: { showArrows: false },
    });

    expect(next.query()).toBeNull();
    expect(previous.query()).toBeNull();
  });

  it("leaves them out when everything already fits", async () => {
    // Wide enough for three tabs at the browser's default font size: the brand
    // tokens are not loaded here, so a label is drawn larger than it ever is in
    // an app and the row overflows a realistic width.
    const { next } = await mountTabs({ className: "w-200" });

    expect(next.query()).toBeNull();
  });

  it("brings a selected tab that is off screen into view", async () => {
    const { view, scrollLeft } = await mountTabs({
      tabs: categories,
      value: "home",
      withPanels: false,
    });

    expect(scrollLeft()).toBe(0);

    await view.rerender(
      <TabsFixture data-testid="tabs" tabs={categories} value="favourites" withPanels={false} />,
    );

    await expect.poll(scrollLeft).toBeGreaterThan(0);
  });
});

// `orientation` is Radix's prop, but on its own Radix only turns the arrow keys
// with it. Everything a person sees — which side of the panels the bar is on,
// which way it scrolls, and where its arrows are — is this component's, so it
// is this component's to test.
describe("running the tabs down a column", () => {
  const column = { orientation: "vertical" } as const;

  it("moves between tabs with the up and down keys instead of left and right", async () => {
    const { tab } = await mountTabs(column);

    await userEvent.click(tab("Account"));
    await userEvent.keyboard("{ArrowDown}");

    await expect.element(tab("Password")).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowUp}");

    await expect.element(tab("Account")).toHaveAttribute("aria-selected", "true");
  });

  it("scrolls the bar down rather than along, and says so on the arrows", async () => {
    // Ten tabs of 36px in a 96px column: enough below the fold for both arrows
    // to have somewhere to go.
    const { up, down, next, previous, scrollTop } = await mountTabs({
      ...column,
      tabs: categories,
      className: "h-24",
    });

    await expect.element(down).toBeVisible();
    expect(up.query()).toBeNull();
    expect(next.query()).toBeNull();
    expect(previous.query()).toBeNull();

    await userEvent.click(down);

    await expect.poll(scrollTop).toBeGreaterThan(0);
    await expect.element(up).toBeVisible();
  });

  it("brings a selected tab below the fold into view", async () => {
    const { view, scrollTop } = await mountTabs({
      ...column,
      tabs: categories,
      className: "h-24",
      value: "home",
      withPanels: false,
    });

    expect(scrollTop()).toBe(0);

    await view.rerender(
      <TabsFixture
        data-testid="tabs"
        orientation="vertical"
        tabs={categories}
        className="h-24"
        value="favourites"
        withPanels={false}
      />,
    );

    await expect.poll(scrollTop).toBeGreaterThan(0);
  });
});

// The two things the bar does *not* do, both of which looked done and were not.
describe("keeping out of the way of the keyboard", () => {
  it("leaves the focused tab focused when an arrow is pressed", async () => {
    const { tab, next } = await mountTabs({ tabs: categories });

    await userEvent.click(tab("Home"));
    await expect.element(tab("Home")).toHaveFocus();

    // `tabIndex={-1}` keeps the arrow out of the Tab sequence but leaves it
    // click-focusable, so without refusing the focus outright the arrow took it
    // — and the arrow that reaches the end of the bar then unmounts under its
    // own focus, dropping the caret on `<body>`.
    await userEvent.click(next);

    await expect.element(tab("Home")).toHaveFocus();
  });
});

describe("a tab that navigates and cannot be reached", () => {
  it("carries the mark the stylesheet reaches a disabled link by", async () => {
    const view = await render(
      <Tabs value="/games/slots">
        <TabsList>
          <TabsTrigger value="/games/slots" asChild>
            <a href="/games/slots">Slots</a>
          </TabsTrigger>
          <TabsTrigger value="/games/live" asChild disabled>
            <a href="/games/live">Live dealer</a>
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const within = page.elementLocator(view.container);

    // `asChild` makes this an `<a>`, and `:disabled` matches form controls only
    // — so `tab-base`'s disabled fill and `button-base`'s `pointer-events: none`
    // both used to miss it and the tab stayed clickable. They read
    // `[data-disabled]` as well now; this pins the attribute they depend on,
    // since the brand stylesheet is deliberately not loaded in this runner.
    await expect
      .element(within.getByRole("tab", { name: "Live dealer" }))
      .toHaveAttribute("data-disabled", "");
  });
});
