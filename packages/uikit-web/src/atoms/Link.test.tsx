import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Link } from "@/atoms/Link";

/**
 * An atom does not owe a test here — its stories draw it and its baseline
 * photographs it. This one exists because `Link` does something a class list
 * cannot: it reads two ARIA attributes and changes what it renders. React
 * serialises `aria-*` booleans instead of dropping them, so `aria-current={false}`
 * and `aria-disabled={false}` reach the DOM as the strings `"false"` — the
 * difference between "styled when asked" and "styled always" is one `=== "true"`,
 * and nothing else in the suite would notice it flipping.
 */

describe("marking a link as the current page", () => {
  it("takes the treatment only when the value says so", async () => {
    const view = await render(
      <>
        <Link href="/here" aria-current="page">
          This page
        </Link>
        <Link href="/there" aria-current={false}>
          Another
        </Link>
      </>,
    );
    const within = page.elementLocator(view.container);
    const muted = "text-foreground-on-surface-muted";

    await expect.element(within.getByRole("link", { name: "This page" })).toHaveClass(muted);
    await expect.element(within.getByRole("link", { name: "Another" })).not.toHaveClass(muted);
  });
});

describe("marking a link unavailable", () => {
  it("takes it out of reach of the keyboard, not just the mouse", async () => {
    const view = await render(
      <Link href="/locked" aria-disabled>
        Locked
      </Link>,
    );
    const locked = page.elementLocator(view.container).getByText("Locked");

    // `pointer-events-none` stops the mouse; without these an `<a href>` is
    // still a tab stop that Enter follows.
    await expect.element(locked).toHaveAttribute("tabindex", "-1");

    // The click is cancelled rather than the `href` removed: the element may be
    // a router link, and `next/link` takes `href` as a required prop. Dispatched
    // rather than clicked, so the event is ours to read back — a real navigation
    // would take the test runner's page with it.
    await expect.element(locked).toHaveAttribute("href", "/locked");

    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    locked.element().dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
  });
});
