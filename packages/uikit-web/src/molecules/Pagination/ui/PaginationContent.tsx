"use client";

import * as React from "react";

import { labelVariants } from "@/atoms/Typography";
import { usePartTestId } from "@/lib/testId";
import { cn } from "@/lib/utils";

// The middle of the row: the list of pages, one slot in it, and the gap mark.

/**
 * The list of pages.
 *
 * `only:mx-auto` is what lets one component draw both rows Figma and shadcn
 * describe. Flanked by `PaginationPrevious` and `PaginationNext`, the list is
 * the middle of three children and `justify-between` on the row puts it where
 * the design does — free space split evenly, which is where Figma's own 622px
 * instance lands its `Pages` frame to the half-pixel. On its own, with the
 * controls composed inside it the way shadcn's docs write them, there is no
 * flanking to space against and it would sit against the left edge; `mx-auto`
 * centres it instead.
 *
 * - @param {string} [className] - Additional CSS classes
 * - @param {string} [data-testid] - Overrides the `<base>-pages` the row derives
 * - @param {React.ComponentProps<'ul'>} props - Props for the unordered list element
 */
function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul"> & { "data-testid"?: string }) {
  const { testId } = usePartTestId("pages", props["data-testid"]);

  return (
    <ul
      className={cn("flex flex-row items-center justify-center gap-1 only:mx-auto", className)}
      {...props}
      data-testid={testId}
    />
  );
}

/**
 * One slot in the list — a page, or the gap that stands for the ones left out.
 *
 * - @param {React.ComponentProps<'li'>} props - Props for the list item element
 */
function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li {...props} />;
}

/**
 * The gap where pages were left out.
 *
 * The same 32px square a page number occupies, so the row's slots stay on a grid
 * and nothing shifts sideways when a gap turns into a page. `aria-hidden`,
 * because "…" read aloud tells no one anything the surrounding numbers have not
 * already said.
 *
 * - @param {React.ReactNode} [children] - Custom content. Defaults to `…`.
 * - @param {string} [className] - Additional CSS classes
 * - @param {React.ComponentProps<'span'>} props - Props for the span element
 */
function PaginationEllipsis({ children, className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn(
        labelVariants({ size: "s", weight: "medium" }),
        "text-foreground-on-surface-default flex size-8 items-center justify-center",
        className,
      )}
      {...props}
    >
      {children ?? "…"}
    </span>
  );
}

export { PaginationContent, PaginationEllipsis, PaginationItem };
