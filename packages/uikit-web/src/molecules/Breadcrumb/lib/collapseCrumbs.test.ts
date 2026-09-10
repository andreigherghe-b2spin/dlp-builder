import { describe, expect, it } from "vitest";

import { collapseCrumbs } from "@/molecules/Breadcrumb/lib/collapseCrumbs";

const trail = ["home", "slots", "megaways", "book-of-ra", "paytable"];

describe("leaving the trail alone", () => {
  it("keeps every crumb when no maximum is set, or when the trail already fits", () => {
    expect(collapseCrumbs(trail)).toEqual({ leading: trail, hidden: [], trailing: [] });
    expect(collapseCrumbs(trail, 5)).toEqual({ leading: trail, hidden: [], trailing: [] });
  });

  it("never collapses below two, the smallest trail a gap can sit inside", () => {
    expect(collapseCrumbs(trail, 1).hidden).toEqual([]);
  });
});

describe("folding the middle away", () => {
  it("keeps the root, spends the rest of the allowance on the end of the trail", () => {
    expect(collapseCrumbs(trail, 4)).toEqual({
      leading: ["home"],
      hidden: ["slots"],
      trailing: ["megaways", "book-of-ra", "paytable"],
    });
  });

  it("draws exactly maxItems crumbs and loses none of the others", () => {
    const { leading, hidden, trailing } = collapseCrumbs(trail, 3);

    expect(leading.length + trailing.length).toBe(3);
    expect([...leading, ...hidden, ...trailing]).toEqual(trail);
  });

  it("handles an empty trail", () => {
    expect(collapseCrumbs([], 2)).toEqual({ leading: [], hidden: [], trailing: [] });
  });
});
