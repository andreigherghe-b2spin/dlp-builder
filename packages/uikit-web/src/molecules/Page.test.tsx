import type * as React from "react";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Page } from "@/molecules/Page";

/**
 * One mount per test — a second `render` in the same `it` leaves two bands in the
 * document and every locator after it matches twice.
 */
async function mount(props: React.ComponentProps<typeof Page> = {}) {
  const view = await render(
    <Page data-testid="page" {...props}>
      Content
    </Page>,
  );
  const within = page.elementLocator(view.container);

  return {
    band: within.getByTestId("page").element(),
    surface: within.getByTestId("page-content").element(),
  };
}

describe("the two class props", () => {
  // Inverted from every other component here, so it is the one thing worth
  // pinning: a caller's `className` reaching the band would move the padding and
  // the background at every call site that already relies on the split.
  it("dresses the surface with `className` and the band with `rootClassName`", async () => {
    const { band, surface } = await mount({ className: "px-0", rootClassName: "max-w-5xl" });

    expect(band.className).toContain("max-w-5xl");
    expect(band.className).not.toContain("px-0");
    expect(surface.className).toContain("px-0");
  });

  it("lets that `className` beat the responsive padding rather than losing above lg", async () => {
    const { surface } = await mount({ className: "px-0" });
    const { paddingLeft } = getComputedStyle(surface);

    expect(paddingLeft).toBe("0px");
  });

  it("pads the surface when the caller says nothing", async () => {
    const { surface } = await mount();

    expect(getComputedStyle(surface).paddingLeft).not.toBe("0px");
  });
});

describe("pinning the band", () => {
  it("stays in flow when it was not asked to pin", async () => {
    const { band } = await mount();

    expect(getComputedStyle(band).position).toBe("static");
  });

  it("pins at the offset the app publishes", async () => {
    const { band } = await mount({ sticky: true });

    expect(getComputedStyle(band).position).toBe("sticky");
  });
});

describe("naming the parts", () => {
  it("puts no test ids in the DOM when the band was not named", async () => {
    const view = await render(<Page>Content</Page>);
    const within = page.elementLocator(view.container);

    expect(within.getByTestId(/.*/).elements()).toHaveLength(0);
  });
});
