import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/molecules/Pagination";

/**
 * One mount per test — a second `render` in the same `it` leaves two rows in the
 * document and every locator after it matches twice.
 *
 * The root is always named: `createTestIdFor` returns `undefined` for every part
 * when it is not, so an unnamed row is deliberately unaddressable.
 */
async function mount(props: React.ComponentProps<typeof Pagination> = {}) {
  const view = await render(<Pagination data-testid="pager" total={10} page={5} {...props} />);
  const within = page.elementLocator(view.container);

  return {
    within,
    part: (name: string) => within.getByTestId(`pager-${name}`),
    back: within.getByRole("button", { name: "Go to previous page" }),
    next: within.getByRole("button", { name: "Go to next page" }),
    /** Every page slot, gaps included, as the row reads left to right. */
    slots: () =>
      within
        .getByRole("listitem")
        .elements()
        .map((element) => element.textContent),
  };
}

describe("the row as data", () => {
  it("draws the range Figma draws, and marks the current page once", async () => {
    const { within, part, slots } = await mount();

    expect(slots()).toEqual(["1", "…", "4", "5", "6", "…", "10"]);
    await expect.element(part("page-5")).toHaveAttribute("aria-current", "page");
    expect(
      within
        .getByRole("button")
        .elements()
        .filter((element) => element.getAttribute("aria-current") === "page"),
    ).toHaveLength(1);
  });

  it("takes different words for Back and Next without losing their accessible names", async () => {
    const { within, back } = await mount({ labels: { previous: "Previous", next: "Forward" } });

    await expect.element(back).toHaveTextContent("Previous");
    await expect
      .element(within.getByRole("button", { name: "Go to next page" }))
      .toHaveTextContent("Forward");
  });
});

describe("moving between pages", () => {
  it("asks for the page that was clicked, and steps one at a time with Back and Next", async () => {
    const onPageChange = vi.fn();
    const { part, back, next } = await mount({ onPageChange });

    await userEvent.click(part("page-6"));
    await userEvent.click(next);
    await userEvent.click(back);

    expect(onPageChange.mock.calls.flat()).toEqual([6, 6, 4]);
  });

  it("is controlled: nothing moves until `page` does", async () => {
    const { part, slots } = await mount({ onPageChange: vi.fn() });

    await userEvent.click(part("page-6"));

    await expect.element(part("page-5")).toHaveAttribute("aria-current", "page");
    expect(slots()).toEqual(["1", "…", "4", "5", "6", "…", "10"]);
  });

  it("disables Back on the first page and Next on the last, rather than hiding them", async () => {
    const { back, next } = await mount({ page: 1 });

    await expect.element(back).toBeDisabled();
    await expect.element(next).toBeEnabled();
  });

  it("clamps a page outside the list instead of marking nothing current", async () => {
    const onPageChange = vi.fn();
    const { part, next } = await mount({ page: 99, onPageChange });

    await expect.element(part("page-10")).toHaveAttribute("aria-current", "page");
    await expect.element(next).toBeDisabled();

    await userEvent.click(part("previous"));
    expect(onPageChange).toHaveBeenCalledWith(9);
  });

  it("does not submit a form it sits inside — every control is type=button", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const view = await render(
      <form onSubmit={onSubmit}>
        <Pagination data-testid="pager" total={10} page={5} />
      </form>,
    );
    const within = page.elementLocator(view.container);

    await userEvent.click(within.getByTestId("pager-page-6"));
    await userEvent.click(within.getByRole("button", { name: "Go to next page" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("a row of links", () => {
  it("turns every slot into a real href with hrefFor", async () => {
    const { part } = await mount({ hrefFor: (p) => `/promotions?page=${p}` });

    await expect.element(part("page-4")).toHaveAttribute("href", "/promotions?page=4");
    await expect.element(part("previous")).toHaveAttribute("href", "/promotions?page=4");
  });

  it("renders every slot through the component `linkAs` names", async () => {
    // Stands in for a brand `components/Link`: a component, not a tag, taking
    // props an `<a>` does not have.
    const RouterLink = ({ href, prefetch, ...rest }: { href: string; prefetch?: boolean }) => (
      <a data-router={String(prefetch ?? false)} href={href} {...rest} />
    );

    const { part } = await mount({ hrefFor: (p) => `?page=${p}`, linkAs: RouterLink });

    await expect.element(part("page-4")).toHaveAttribute("data-router", "false");
    await expect.element(part("next")).toHaveAttribute("data-router", "false");
    // Disabled controls stay plain buttons: a router link would navigate anyway.
    expect(part("previous").element().tagName).toBe("A");
  });

  it("keeps a disabled control a button, so a crawler is not offered a dead end", async () => {
    const { part } = await mount({ page: 1, hrefFor: (p) => `/promotions?page=${p}` });
    const back = part("previous");

    expect(back.element().tagName).toBe("BUTTON");
    await expect.element(back).not.toHaveAttribute("href");
  });

  it("intercepts a plain click but leaves a cmd-click to open the href in a new tab", async () => {
    const onPageChange = vi.fn();
    const { part } = await mount({ onPageChange, hrefFor: (p) => `?page=${p}` });
    const link = part("page-6").element();

    // Dispatched rather than clicked, so the verdict is ours to read back. The
    // modified click is one the component deliberately leaves alone, and the
    // anchor's own default is then to navigate — which takes the runner's iframe
    // with it on any platform where Meta is not the open-in-a-new-tab modifier.
    // So the last listener in the chain reads the verdict and stops the
    // navigation: React's own handler has run by the time it reaches `document`.
    const dispatch = (init: MouseEventInit) => {
      let prevented = false;
      const stop = (event: Event) => {
        prevented = event.defaultPrevented;
        event.preventDefault();
      };

      document.addEventListener("click", stop);
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
      document.removeEventListener("click", stop);

      return prevented;
    };

    expect(dispatch({ button: 0 })).toBe(true);
    expect(dispatch({ button: 0, metaKey: true })).toBe(false);
    expect(onPageChange.mock.calls.flat()).toEqual([6]);
  });
});

describe("composing the row by hand", () => {
  it("renders children instead of the data form", async () => {
    const onClick = vi.fn();
    const view = await render(
      <Pagination data-testid="pager">
        <PaginationPrevious onClick={onClick} />
        <PaginationContent>
          <PaginationItem>
            <PaginationLink isActive data-testid="pager-one">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        </PaginationContent>
        <PaginationNext href="/next" />
      </Pagination>,
    );
    const within = page.elementLocator(view.container);

    await expect.element(within.getByTestId("pager-one")).toHaveAttribute("aria-current", "page");
    await expect
      .element(within.getByRole("link", { name: "Go to next page" }))
      .toHaveAttribute("href", "/next");

    await userEvent.click(within.getByRole("button", { name: "Go to previous page" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("draws Back and Next as arrows alone under `icon`", async () => {
    const { back, next } = await mount({ icon: true });

    await expect.element(back).toHaveAccessibleName("Go to previous page");
    expect(back.element().textContent).toBe("");
    expect(back.element().querySelector("svg")).not.toBeNull();
    expect(next.element().querySelector("svg")).not.toBeNull();
  });

  it("puts no test ids in the DOM when the row was not named", async () => {
    const view = await render(<Pagination total={10} page={5} />);
    const within = page.elementLocator(view.container);

    expect(within.getByTestId(/.*/).elements()).toHaveLength(0);
  });
});
