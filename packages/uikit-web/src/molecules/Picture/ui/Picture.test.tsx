import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Picture } from "@/molecules/Picture";

/**
 * The required tests for a molecule at `Needs Review`, and pointed at the part that is
 * unobservable from outside: which offers are in the DOM after a failure. Source
 * selection itself belongs to the browser and is not tested here; what the browser is
 * *given* is. The swap `Img` performs on top of that has its own tests in
 * `atoms/Img.test.tsx` — what these assert is the decision handed to it.
 *
 * Every URL below 404s on purpose, bar the one inline fallback. Nothing asserts that an
 * image loaded — a real asset would only make the test depend on the dev server's static
 * handling.
 */
const BROKEN = "/__missing__/hero.jpg";
const BROKEN_AVIF = "/__missing__/hero.avif";
const BROKEN_FALLBACK = "/__missing__/placeholder.jpg";

// The one URL here that loads, and inline so it needs no network and no dev server: a
// fallback that resolves ends the failure cycle, which is what makes "how many times did
// this fail" an assertion rather than a race.
const FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>');

const SOURCES = [{ type: "image/avif", srcSet: { densities: { 1: BROKEN_AVIF } } }];

async function mount(props: Partial<React.ComponentProps<typeof Picture>> = {}) {
  const view = await render(<Picture alt="Neon Reels" sources={SOURCES} src={BROKEN} {...props} />);
  // Scoped to this render: the page is shared by every test in the file.
  const within = page.elementLocator(view.container);

  return {
    container: view.container,
    image: within.getByRole("img", { name: "Neon Reels" }),
    view,
  };
}

describe("offering the sources", () => {
  it("renders one source per offer, in the order given", async () => {
    const { container } = await mount({
      sources: [
        { type: "image/avif", srcSet: { densities: { 1: "/a.avif", 2: "/a@2x.avif" } } },
        { media: "(min-width: 900px)", srcSet: "/wide.jpg", sizes: "50vw" },
      ],
    });

    const sources = [...container.querySelectorAll("source")];

    expect(sources.map((source) => source.getAttribute("srcset"))).toEqual([
      "/a.avif 1x, /a@2x.avif 2x",
      "/wide.jpg",
    ]);
    expect(sources[0]).toHaveAttribute("type", "image/avif");
    expect(sources[1]).toHaveAttribute("media", "(min-width: 900px)");
    expect(sources[1]).toHaveAttribute("sizes", "50vw");
  });

  it("skips a source whose candidates come out empty", async () => {
    // A `<source>` with no `srcset` is invalid, so an offer built from data that turned
    // out to hold no URLs is left out rather than rendered as an empty one.
    const { container } = await mount({
      sources: [
        { type: "image/avif", srcSet: { densities: { 1: undefined } } },
        { type: "image/webp", srcSet: "/a.webp" },
      ],
    });

    expect([...container.querySelectorAll("source")].map((s) => s.getAttribute("type"))).toEqual([
      "image/webp",
    ]);
  });
});

describe("falling back after the chosen resource fails", () => {
  it("removes every source, so the fallback can be reached at all", async () => {
    // The regression this file exists for. Source selection ignores whether the file is
    // there, so one surviving source goes on being chosen and the fallback sits on an
    // attribute nothing reads: the image stays broken while the component believes it
    // recovered.
    const { container, image } = await mount({
      fallbackSrc: FALLBACK,
      srcSet: { densities: { 1: BROKEN, 2: "/__missing__/hero@2x.jpg" } },
      sizes: "50vw",
    });

    await expect.element(image).toHaveAttribute("src", FALLBACK);
    expect(container.querySelectorAll("source")).toHaveLength(0);
    expect(image.element()).not.toHaveAttribute("srcset");
    expect(image.element()).not.toHaveAttribute("sizes");
  });

  it("leaves a broken image broken when there is no fallback to swap to", async () => {
    // A bare `<picture>` is the documented behaviour without `fallbackSrc`: the
    // placeholder belongs to the product's asset host, not to the design system.
    const { container, image } = await mount();

    await expect.element(image).toHaveAttribute("src", BROKEN);
    expect(container.querySelectorAll("source")).toHaveLength(1);
  });

  it("does not loop when the fallback fails too", async () => {
    // `onError` records what was *asked* for rather than what is shown, so the failing
    // fallback writes the same state a second time and React bails out of the identical
    // value. Without that, each failure would be a fresh state and the two would take
    // turns forever.
    const onError = vi.fn();
    const { image } = await mount({ fallbackSrc: BROKEN_FALLBACK, onError });

    await expect.element(image).toHaveAttribute("src", BROKEN_FALLBACK);
    // Once for the source that was chosen, once for the fallback. Nothing after that.
    await expect.poll(() => onError.mock.calls.length).toBe(2);
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it("retries when the offers change, not only when src does", async () => {
    // Keyed on `src` alone, an art-direction swap that kept the same JPEG under it
    // would stay pinned to the fallback for the rest of the component's life — no new
    // load would be attempted, so nothing would fail again either.
    const onError = vi.fn();
    const { image, view } = await mount({ fallbackSrc: FALLBACK, onError });

    await expect.element(image).toHaveAttribute("src", FALLBACK);
    expect(onError).toHaveBeenCalledTimes(1);

    await view.rerender(
      <Picture
        alt="Neon Reels"
        fallbackSrc={FALLBACK}
        onError={onError}
        sources={[{ type: "image/avif", srcSet: "/__missing__/other.avif" }]}
        src={BROKEN}
      />,
    );

    // The offers no longer match what failed, so the browser is asked again — and fails
    // again, which is the only observable proof that it was asked.
    await expect.poll(() => onError.mock.calls.length).toBe(2);
    await expect.element(image).toHaveAttribute("src", FALLBACK);
  });
});
