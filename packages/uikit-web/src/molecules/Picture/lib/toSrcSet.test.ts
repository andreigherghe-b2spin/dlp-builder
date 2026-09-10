import { describe, expect, it } from "vitest";

import { toSrcSet } from "@/molecules/Picture/lib/toSrcSet";

describe("toSrcSet", () => {
  it("returns undefined when there is nothing to offer", () => {
    // Absent rather than empty, on purpose: a present-but-empty `srcset` still makes a
    // browser prefer it over `src`, so the caller has to be able to leave it off.
    expect(toSrcSet(undefined)).toBeUndefined();
    expect(toSrcSet("   ")).toBeUndefined();
    expect(toSrcSet({ densities: {} })).toBeUndefined();
    expect(toSrcSet({ widths: {} })).toBeUndefined();
  });

  it("passes a raw srcset through, trimmed", () => {
    expect(toSrcSet("  /a.jpg 1x, /a@2x.jpg 2x ")).toBe("/a.jpg 1x, /a@2x.jpg 2x");
  });

  it("writes an x descriptor per density", () => {
    expect(toSrcSet({ densities: { 1: "/a.avif", 2: "/a@2x.avif", 3: "/a@3x.avif" } })).toBe(
      "/a.avif 1x, /a@2x.avif 2x, /a@3x.avif 3x",
    );
  });

  it("writes a w descriptor per width", () => {
    expect(toSrcSet({ widths: { 400: "/a-400.webp", 1200: "/a-1200.webp" } })).toBe(
      "/a-400.webp 400w, /a-1200.webp 1200w",
    );
  });

  it("sorts ascending however the map was written", () => {
    // Integer keys come out of an object in ascending order regardless, but a
    // fractional one is appended in insertion order — which is why the sort is here.
    expect(toSrcSet({ densities: { 2: "/a@2x.png", 1.5: "/a@1.5x.png", 1: "/a.png" } })).toBe(
      "/a.png 1x, /a@1.5x.png 1.5x, /a@2x.png 2x",
    );
  });

  it("drops a candidate with no URL and keeps the rest", () => {
    // The data-driven case: a retina asset that does not exist for every record.
    expect(toSrcSet({ densities: { 1: "/a.jpg", 2: undefined, 3: "  " } })).toBe("/a.jpg 1x");
  });

  it("drops a descriptor that is not a positive number", () => {
    const candidates = { densities: { 0: "/zero.jpg", 2: "/a@2x.jpg" } };
    expect(toSrcSet(candidates)).toBe("/a@2x.jpg 2x");
    expect(toSrcSet({ densities: { "-1": "/negative.jpg" } })).toBeUndefined();
    expect(
      toSrcSet({ widths: { NaN: "/nan.jpg" } as unknown as Record<number, string> }),
    ).toBeUndefined();
  });

  it("trims each URL but otherwise leaves it alone", () => {
    // A comma inside a URL breaks the attribute and is still not encoded here: the
    // bytes may be signed by the CDN. Documented on the function, asserted here so the
    // decision is not quietly reversed.
    expect(toSrcSet({ densities: { 1: " /a,b.jpg " } })).toBe("/a,b.jpg 1x");
  });
});
