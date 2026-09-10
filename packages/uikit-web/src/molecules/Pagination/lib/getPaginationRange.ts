/**
 * A slot in the row: a page to go to, or a gap where pages were left out.
 *
 * The two gaps are told apart rather than both being `"ellipsis"`, because they
 * are two different slots in one list and a list needs stable keys. `1 … 4 5 6 …
 * 10` renders seven slots; if both gaps answered to the same name, React would
 * have to fall back to the index, and the index is exactly what moves when the
 * current page moves.
 */
type PaginationSlot = number | "start-ellipsis" | "end-ellipsis";

type PaginationRangeOptions = {
  /** How many pages there are. `0` or less yields an empty row. */
  total: number;
  /** The page the user is on, 1-based. Clamped into range. */
  page: number;
  /** Pages kept either side of the current one. Defaults to `1`. */
  siblingCount?: number;
  /** Pages always kept at each end. Defaults to `1`. */
  boundaryCount?: number;
};

/** `[from, to]` inclusive; empty when `to < from`. */
function range(from: number, to: number) {
  return Array.from({ length: Math.max(to - from + 1, 0) }, (_, index) => from + index);
}

/**
 * The pages a pagination row should draw, gaps included.
 *
 * The defaults are the design's: `siblingCount: 1` and `boundaryCount: 1` give
 * `1 … 4 5 6 … 10` on page 5 of 10, which is the row in Figma down to the slot.
 *
 * The row's **length never changes** as the page moves, which is the whole point
 * of computing it rather than slicing. A window that simply took
 * `page ± siblingCount` collapses at the ends — page 1 of 10 would draw four
 * slots where page 5 draws seven — and the Back button then walks left as you
 * page. Here the sibling window is pushed inward at the ends to make up the
 * difference, so `1 2 3 4 … 10` and `1 … 7 8 9 10` are both seven slots wide.
 *
 * A gap is only drawn where it hides something. With `total: 7` the "gap" would
 * stand for exactly one page, so that page is drawn instead — a `…` you can
 * click through in one step is a `…` that should not have been there.
 *
 * @example
 * getPaginationRange({ total: 10, page: 5 })
 * // [1, "start-ellipsis", 4, 5, 6, "end-ellipsis", 10]
 * getPaginationRange({ total: 10, page: 1 })
 * // [1, 2, 3, 4, 5, "end-ellipsis", 10]
 * getPaginationRange({ total: 5, page: 3 })
 * // [1, 2, 3, 4, 5]
 */
function getPaginationRange({
  total,
  page,
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationRangeOptions): PaginationSlot[] {
  if (total <= 0) {
    return [];
  }

  const current = Math.min(Math.max(page, 1), total);

  const startPages = range(1, Math.min(boundaryCount, total));
  const endPages = range(Math.max(total - boundaryCount + 1, boundaryCount + 1), total);

  const siblingsStart = Math.max(
    Math.min(current - siblingCount, total - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(current + siblingCount, boundaryCount + siblingCount * 2 + 2),
    // Guarded rather than asserted: `endPages` is empty whenever the boundary
    // pages have already been drawn by `startPages`, which is every list shorter
    // than two boundaries.
    endPages.length > 0 ? endPages[0] - 2 : total - 1,
  );

  // A gap two or more pages wide is a gap; one page wide, and the page itself is
  // drawn in its place. The `<` and `>` are strict, and that is the whole of it:
  // written as a clamped `range()` on either side, both fallbacks fire on the
  // same page whenever the list is exactly `2 * boundaryCount + 1` long, and
  // `{ total: 3, page: 2 }` comes out `[1, 2, 2, 3]` — a duplicate React key and
  // two slots answering to `<base>-page-2`.
  const startGap: PaginationSlot[] =
    siblingsStart > boundaryCount + 2
      ? ["start-ellipsis"]
      : boundaryCount + 1 < total - boundaryCount
        ? [boundaryCount + 1]
        : [];

  const endGap: PaginationSlot[] =
    siblingsEnd < total - boundaryCount - 1
      ? ["end-ellipsis"]
      : total - boundaryCount > boundaryCount
        ? [total - boundaryCount]
        : [];

  return [...startPages, ...startGap, ...range(siblingsStart, siblingsEnd), ...endGap, ...endPages];
}

export { getPaginationRange, type PaginationRangeOptions, type PaginationSlot };
