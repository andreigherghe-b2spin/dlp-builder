"use client";

import * as React from "react";

import {
  getPaginationRange,
  type PaginationRangeOptions,
} from "@/molecules/Pagination/lib/getPaginationRange";
import {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/molecules/Pagination/ui/PaginationContent";
import {
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/molecules/Pagination/ui/PaginationLink";
import { TestIdProvider } from "@/lib/testId";
import { cn, createTestIdFor } from "@/lib/utils";

/** Per-part classes for the `total` form; the composed form dresses its own parts. */
type PaginationClassNames = {
  content?: string;
  item?: string;
  link?: string;
  ellipsis?: string;
  previous?: string;
  next?: string;
};

type PaginationRowProps = {
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  siblingCount?: PaginationRangeOptions["siblingCount"];
  boundaryCount?: PaginationRangeOptions["boundaryCount"];
  hrefFor?: (page: number) => string;
  linkAs?: React.ElementType;
  icon?: boolean;
  labels?: { previous?: React.ReactNode; next?: React.ReactNode };
  classNames?: PaginationClassNames;
};

/**
 * Navigation across a paged list — Back, the pages, Next.
 *
 * Two ways to use it, and the first is the one nearly every list wants:
 *
 * ```tsx
 * // Data. The row works out which pages to draw and where the gaps go.
 * <Pagination total={10} page={page} onPageChange={setPage} />
 *
 * // Links instead of a handler — the row a crawler can follow, through the
 * // app's own router link rather than a bare `<a>`.
 * <Pagination
 *   total={10}
 *   page={page}
 *   hrefFor={(p) => `/promotions?page=${p}`}
 *   linkAs={BrandLink}
 * />
 *
 * // Arrows alone, where the row has no width for two words.
 * <Pagination total={10} page={page} onPageChange={setPage} icon />
 *
 * // Composed, when the row needs something the data form cannot say.
 * <Pagination>
 *   <PaginationPrevious onClick={back} disabled={page === 1} />
 *   <PaginationContent>
 *     <PaginationItem>
 *       <PaginationLink isActive>1</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationEllipsis />
 *     </PaginationItem>
 *   </PaginationContent>
 *   <PaginationNext onClick={forward} />
 * </Pagination>
 * ```
 *
 * `total` exists because the page range is the part everyone gets wrong.
 * `shared/core-components`' `getPageRage` shortens the row at the ends, so the
 * Back button walks left as you page through; here the sibling window is pushed
 * inward instead and the row is the same width on page 1 as on page 5. See
 * [getPaginationRange](../lib/getPaginationRange.ts), which is exported for a
 * row that wants the slots but not this markup.
 *
 * The row is controlled: `page` is where you are, `onPageChange` is told where
 * the user asked to go, and nothing moves until `page` does. That is the same
 * contract as every other input here, and it is what lets a page number live in
 * the URL — which for a paged list it usually should.
 *
 * `hrefFor` and `onPageChange` are not exclusive. Give both and each page is a
 * real link a crawler can follow *and* a click the app can intercept.
 *
 * Naming the row names every part: a `data-testid` here is published to the
 * subtree, and each part derives its own from it — `-pages`, `-previous`,
 * `-next`, and `-page-4` per page, named after the page it goes to rather than
 * after its slot, because the slots shift as you page. Without the prop no part
 * carries a test id at all.
 *
 * @param {number} [total] - How many pages there are. Given, the row draws itself.
 * @param {number} [page=1] - The page being viewed, 1-based
 * @param {(page: number) => void} [onPageChange] - Called with the page the user asked for
 * @param {number} [siblingCount=1] - Pages kept either side of the current one
 * @param {number} [boundaryCount=1] - Pages always kept at each end
 * @param {(page: number) => string} [hrefFor] - Turns a page number into an href, making every slot a real link
 * @param {React.ElementType} [linkAs] - What every slot renders as once `hrefFor` gives it an href. Pass the app's router link.
 * @param {boolean} [icon=false] - Draw Back and Next as arrows alone, with no label
 * @param {object} [labels] - `previous` and `next` labels. Default to `Back` and `Next`.
 * @param {PaginationClassNames} [classNames] - Per-part classes: `content`, `item`, `link`, `ellipsis`, `previous`, `next`
 * @param {string} [className] - Additional CSS classes for the `<nav>`
 * @param {string} [data-testid] - Names the row; every part derives its own from it
 * @param {React.ComponentProps<'nav'>} props - Props for the nav element
 *
 * @cssVariables
 * Every slot is a [Button](../../../atoms/Button.tsx) — `outline` on Back and Next:
 * - `--components-button-radius`
 * - `--components-button-border`
 * - `--typography-font-weight-bold`
 * - `--typography-font-size-label-m`
 * - `--color-border-neutral-default`
 * - `--color-foreground-on-surface-default`
 *
 * On a page number, which is `ghost` plus the two things Figma draws differently:
 * - `--radius-comfortable`
 * - `--typography-font-family`
 * - `--typography-font-size-label-s`
 * - `--typography-font-weight-medium`
 * - `--color-background-state-selected`
 * - `--color-background-state-hover`
 * - `--color-background-state-pressed`
 * - `--color-border-state-focus`
 * - `--color-background-state-disabled`
 * - `--color-foreground-state-disabled`
 *
 * @see [Documentation](https://ui.shadcn.com/docs/components/pagination)
 */
function Pagination({
  total,
  page = 1,
  onPageChange,
  siblingCount,
  boundaryCount,
  hrefFor,
  linkAs,
  icon,
  labels,
  classNames,
  className,
  children,
  ...props
}: React.ComponentProps<"nav"> & PaginationRowProps & { "data-testid"?: string }) {
  return (
    <TestIdProvider value={props["data-testid"]}>
      <nav
        role="navigation"
        aria-label="pagination"
        className={cn("flex w-full items-center justify-between gap-2", className)}
        {...props}
      >
        {total == null ? (
          children
        ) : (
          <PaginationRow
            total={total}
            page={page}
            onPageChange={onPageChange}
            siblingCount={siblingCount}
            boundaryCount={boundaryCount}
            hrefFor={hrefFor}
            linkAs={linkAs}
            icon={icon}
            labels={labels}
            classNames={classNames}
            testIdFor={createTestIdFor(props["data-testid"])}
          />
        )}
      </nav>
    </TestIdProvider>
  );
}

/**
 * The `total` form's rendering, kept out of the root so the composed form pays
 * nothing for it.
 */
function PaginationRow({
  total,
  page,
  onPageChange,
  siblingCount,
  boundaryCount,
  hrefFor,
  linkAs,
  icon,
  labels,
  classNames,
  testIdFor,
}: Required<Pick<PaginationRowProps, "total" | "page">> &
  PaginationRowProps & { testIdFor: (part: string) => string | undefined }) {
  // Clamped once, here, and used for every decision below. `getPaginationRange`
  // clamps its own copy, so reading the raw prop for the rest was a way for the
  // row and its controls to disagree: `page={99}` of 10 drew the page-10 window
  // with nothing marked `aria-current`, Back enabled, and a click asking for 98.
  const current = Math.min(Math.max(page, 1), Math.max(total, 1));

  const slots = getPaginationRange({ total, page: current, siblingCount, boundaryCount });

  const atStart = current <= 1;
  const atEnd = current >= total;

  // A plain click is the app's, a modified one is the browser's. Without this,
  // `hrefFor` and `onPageChange` together could not do what they say: the anchor
  // won, the state update was lost to a full page load, and the handler may as
  // well not have been passed.
  //
  // The modifiers are the whole rule. Cmd or ctrl opens a new tab, shift a new
  // window, alt downloads — each of them is the user asking for the href
  // specifically, and swallowing them turns a real link back into a
  // `<div onClick>`. The mouse button is not checked because it cannot differ:
  // `click` fires only for the primary button, and the others go to `auxclick`.
  const go = (to: number) => (event: React.MouseEvent) => {
    if (!onPageChange || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    event.preventDefault();
    onPageChange(to);
  };

  // A disabled control is a `<button>`, never a link: `disabled` does nothing to
  // an `<a>`, and an href the user is not meant to follow is one a crawler
  // follows anyway.
  // `as` only travels with an href: a router link rendered without one points at
  // nothing, so an `onClick` row stays on plain `<button>`s.
  const step = (to: number, blocked: boolean) => ({
    as: !blocked && hrefFor ? linkAs : undefined,
    disabled: blocked,
    href: blocked ? undefined : hrefFor?.(to),
    icon,
    onClick: blocked ? undefined : go(to),
  });

  return (
    <>
      <PaginationPrevious
        {...step(current - 1, atStart)}
        className={classNames?.previous}
        data-testid={testIdFor("previous")}
      >
        {labels?.previous}
      </PaginationPrevious>

      <PaginationContent className={classNames?.content}>
        {slots.map((slot) => (
          <PaginationItem key={slot} className={classNames?.item}>
            {typeof slot === "number" ? (
              <PaginationLink
                as={hrefFor ? linkAs : undefined}
                isActive={slot === current}
                href={hrefFor?.(slot)}
                onClick={go(slot)}
                className={classNames?.link}
                data-testid={testIdFor(`page-${slot}`)}
              >
                {slot}
              </PaginationLink>
            ) : (
              <PaginationEllipsis className={classNames?.ellipsis} />
            )}
          </PaginationItem>
        ))}
      </PaginationContent>

      <PaginationNext
        {...step(current + 1, atEnd)}
        className={classNames?.next}
        data-testid={testIdFor("next")}
      >
        {labels?.next}
      </PaginationNext>
    </>
  );
}

export { Pagination, type PaginationClassNames };
