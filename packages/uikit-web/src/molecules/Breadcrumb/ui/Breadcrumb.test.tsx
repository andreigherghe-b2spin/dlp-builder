import * as React from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  type BreadcrumbCrumb,
} from "@/molecules/Breadcrumb";

const trail: BreadcrumbCrumb[] = [
  { label: "Home", href: "/" },
  { label: "Slots", href: "/slots" },
  { label: "Megaways", href: "/slots/megaways" },
  { label: "Book of Ra", href: "/slots/megaways/book-of-ra" },
  { label: "Paytable" },
];

/**
 * One mount per test — a second `render` in the same `it` leaves two trails in
 * the document and every locator after it matches twice.
 *
 * The root is always named, because `createTestIdFor` returns `undefined` for
 * every part when it is not, and an unnamed trail is deliberately unaddressable.
 */
async function mount(props: React.ComponentProps<typeof Breadcrumb> = {}) {
  const view = await render(<Breadcrumb data-testid="trail" items={trail} {...props} />);
  const within = page.elementLocator(view.container);

  return {
    within,
    links: within.getByRole("link"),
    crumb: (part: string) => within.getByTestId(`trail-${part}`),
  };
}

describe("the trail as data", () => {
  it("draws a link per crumb, pointed where the crumb says", async () => {
    const { links, crumb } = await mount();

    await expect.element(links.nth(0)).toHaveAccessibleName("Home");
    await expect.element(crumb("slots")).toHaveAttribute("href", "/slots");
    await expect.element(crumb("slots-megaways")).toHaveAttribute("href", "/slots/megaways");
  });

  it("renders the crumb without an href as the current page, not as a dead link", async () => {
    const { crumb } = await mount();
    const current = crumb("page");

    await expect.element(current).toHaveAttribute("aria-current", "page");
    await expect.element(current).not.toHaveAttribute("href");
  });

  it("puts a separator between crumbs and never after the last one", async () => {
    const { crumb } = await mount();

    // Four gaps for five crumbs. `aria-hidden` keeps them out of the
    // accessibility tree, so they are counted by the name they all share.
    expect(crumb("separator").elements()).toHaveLength(4);
  });

  it("gives a second crumb with no href a name of its own", async () => {
    const { within } = await mount({
      items: [{ label: "Home", href: "/" }, { label: "Section" }, { label: "Now" }],
    });

    await expect.element(within.getByTestId("trail-page")).toHaveTextContent("Section");
    await expect.element(within.getByTestId("trail-page-2")).toHaveTextContent("Now");
  });

  it("puts no test ids in the DOM when the trail was not named", async () => {
    const view = await render(<Breadcrumb items={trail} />);
    const within = page.elementLocator(view.container);

    expect(within.getByTestId(/.*/).elements()).toHaveLength(0);
  });
});

describe("collapsing a long trail", () => {
  it("folds the middle into a control that names what it hides", async () => {
    const { within, links } = await mount({ maxItems: 3 });

    // Home, then the …, then the last two crumbs — of which only the first is a
    // link, because the last is the current page and leads nowhere.
    expect(links.elements()).toHaveLength(2);
    await expect
      .element(within.getByRole("button", { name: "Show hidden breadcrumbs" }))
      .toBeInTheDocument();
  });

  it("opens the hidden crumbs as a menu, and hides nothing that is not in it", async () => {
    const { crumb, within, links } = await mount({ maxItems: 3 });

    // Read the visible crumbs before opening: an open Radix menu is modal and
    // `aria-hidden`s the rest of the document, so afterwards the trail is not in
    // the accessibility tree to be counted. The current page is added by hand
    // rather than caught by `links`, because it is not one.
    const visible = [...links.elements(), crumb("page").element()].map(
      (element) => element.textContent,
    );

    await userEvent.click(within.getByRole("button", { name: "Show hidden breadcrumbs" }));

    await expect
      .element(page.getByRole("menuitem", { name: "Slots" }))
      .toHaveAttribute("href", "/slots");

    const hidden = page
      .getByRole("menuitem")
      .elements()
      .map((element) => element.textContent);

    // Sorted, because what is asserted is that nothing fell out, not the order.
    expect([...visible, ...hidden].sort()).toEqual([
      "Book of Ra",
      "Home",
      "Megaways",
      "Paytable",
      "Slots",
    ]);
  });
});

describe("composing the trail by hand", () => {
  it("renders children instead of the data form", async () => {
    const view = await render(
      <Breadcrumb data-testid="trail">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" data-testid="trail-home">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Paytable</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const within = page.elementLocator(view.container);

    await expect.element(within.getByTestId("trail-home")).toHaveAttribute("href", "/");
    await expect.element(within.getByText("Paytable")).toHaveAttribute("aria-current", "page");
  });

  it("renders every crumb through the component `linkAs` names", async () => {
    // Stands in for a brand `components/Link`: a component, not a tag, taking
    // props an `<a>` does not have.
    const RouterLink = ({ href, prefetch, ...rest }: { href: string; prefetch?: boolean }) => (
      <a data-router={String(prefetch ?? false)} href={href} {...rest} />
    );

    const { crumb } = await mount({ linkAs: RouterLink });

    await expect.element(crumb("slots")).toHaveAttribute("data-router", "false");
    await expect.element(crumb("slots")).toHaveAttribute("href", "/slots");
    // The crumb's own styling has to survive the swap, or `as` buys a bare link.
    expect(crumb("slots").element().className).toContain("underline");
  });
});
