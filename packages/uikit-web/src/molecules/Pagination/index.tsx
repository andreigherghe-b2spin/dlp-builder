"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the ones on the files behind
// this barrel are dropped on the way into dist/. So the boundary is declared
// here, where the built consumer actually sees it.

/**
 * The pagination's single entry point: `@ui/web/Pagination` resolves here, and
 * nothing outside this directory imports any deeper.
 *
 * `Pagination` is the whole thing when you pass `total` — the parts below are
 * for the row that needs a slot the data form cannot describe.
 * `getPaginationRange` is the range on its own, for a row that wants the slots
 * and none of this markup.
 *
 * ## Coming from the brand apps
 *
 * `shared/core-components/src/components/Pagination` is the one this replaces.
 * It takes the same shape of data and differs in three ways worth knowing about
 * before porting a call site.
 *
 * | `core-components/Pagination` | here                                             |
 * | ---------------------------- | ------------------------------------------------ |
 * | `total` / `current`          | `total` / `page`                                 |
 * | `onPageChange`               | `onPageChange`, and `page` must move with it     |
 * | `maxPageNumberOnEachSide`    | `siblingCount`                                   |
 * | `maxShowingNumberPagesWithoutHidden` | nothing — a gap appears when it hides ≥2 |
 * | `showPrevPageButtons` / `showNextPageButtons` | nothing — Back and Next disable |
 * | `buttonLabels.prevPage` / `.nextPage` | `labels.previous` / `labels.next`       |
 * | `buttonLabels.firstPage` / `.lastPage` | nothing — `boundaryCount` keeps 1 and N |
 * | `buttonLabels.ellipsisPage`  | `PaginationEllipsis`, in the composed form       |
 * | `className='active-pagination-button'` | `classNames.link`, plus `aria-current` |
 *
 * 1. **It is controlled.** The old one kept `current` in a `useState` seeded from
 *    the prop, so the page it showed and the page the app thought it was on drifted
 *    the moment anything else moved the page — a filter change, the back button, a
 *    deep link. Pass `page` and move it in `onPageChange`.
 * 2. **First and last are gone as separate controls.** `boundaryCount` keeps page 1
 *    and page N in the row at all times, so they are one click away without two
 *    extra buttons and four inline SVGs holding `fill='#CCCCCC'`.
 * 3. **The row does not change width as you page.** `getPageRage` shortened the
 *    range at the ends; this one pushes the window inward instead. Back stays where
 *    the user last clicked it.
 */
export { Pagination, type PaginationClassNames } from "@/molecules/Pagination/ui/Pagination";
export {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/molecules/Pagination/ui/PaginationContent";
export {
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/molecules/Pagination/ui/PaginationLink";
export {
  getPaginationRange,
  type PaginationRangeOptions,
  type PaginationSlot,
} from "@/molecules/Pagination/lib/getPaginationRange";
