import { describe, expect, it } from "vitest";

import { getPaginationRange } from "@/molecules/Pagination/lib/getPaginationRange";

/** The row as a string, so a case reads as the thing a user would see. */
const row = (options: Parameters<typeof getPaginationRange>[0]) =>
  getPaginationRange(options)
    .map((slot) => (typeof slot === "number" ? String(slot) : "…"))
    .join(" ");

describe("drawing the row", () => {
  it("puts a gap either side of the current page, the way Figma draws it", () => {
    expect(getPaginationRange({ total: 10, page: 5 })).toEqual([
      1,
      "start-ellipsis",
      4,
      5,
      6,
      "end-ellipsis",
      10,
    ]);
  });

  it("draws a gap only where it hides more than one page", () => {
    expect(row({ total: 7, page: 4 })).toBe("1 2 3 4 5 6 7");
    expect(row({ total: 8, page: 4 })).toBe("1 2 3 4 5 … 8");
  });

  it("widens the window with siblingCount and the ends with boundaryCount", () => {
    expect(row({ total: 20, page: 10, siblingCount: 2 })).toBe("1 … 8 9 10 11 12 … 20");
    expect(row({ total: 20, page: 10, boundaryCount: 2 })).toBe("1 2 … 9 10 11 … 19 20");
  });
});

describe("keeping the row the same width as the page moves", () => {
  it("pushes the window inward at the ends rather than shortening the row", () => {
    expect(row({ total: 10, page: 1 })).toBe("1 2 3 4 5 … 10");
    expect(row({ total: 10, page: 10 })).toBe("1 … 6 7 8 9 10");
  });

  it("draws seven slots on every page of ten", () => {
    const widths = Array.from({ length: 10 }, (_, index) =>
      getPaginationRange({ total: 10, page: index + 1 }),
    ).map((slots) => slots.length);

    expect(widths).toEqual(Array(10).fill(7));
  });
});

describe("never drawing the same page twice", () => {
  it("draws the middle page once when the list is exactly three long", () => {
    // `2 * boundaryCount + 1` is where both "draw the page instead of the gap"
    // fallbacks want the same page, and a duplicate is a duplicate React key and
    // two slots answering to one `data-testid`.
    expect(row({ total: 3, page: 2 })).toBe("1 2 3");
  });

  it("holds for every list, page and boundary a row could be given", () => {
    for (let boundaryCount = 1; boundaryCount <= 5; boundaryCount += 1) {
      for (let total = 1; total <= 24; total += 1) {
        for (let page = 1; page <= total; page += 1) {
          const pages = getPaginationRange({ total, page, boundaryCount }).filter(
            (slot): slot is number => typeof slot === "number",
          );

          expect({ total, page, boundaryCount, pages }).toEqual({
            total,
            page,
            boundaryCount,
            pages: [...new Set(pages)],
          });
        }
      }
    }
  });
});

describe("the edges", () => {
  it("is empty when there is nothing to page through", () => {
    expect(getPaginationRange({ total: 0, page: 1 })).toEqual([]);
  });

  it("draws the one page there is", () => {
    expect(row({ total: 1, page: 1 })).toBe("1");
  });

  it("clamps a page outside the list rather than drawing a row around nothing", () => {
    expect(row({ total: 10, page: 0 })).toBe(row({ total: 10, page: 1 }));
    expect(row({ total: 10, page: 99 })).toBe(row({ total: 10, page: 10 }));
  });
});
