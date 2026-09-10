import { useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ui/web/Pagination";

const meta: Meta<typeof Pagination> = {
  title: "Needs Review/Molecules/Pagination",
  id: "Pagination",
  component: Pagination,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  argTypes: {
    total: { control: { type: "number", min: 0 }, description: "How many pages there are" },
    page: { control: { type: "number", min: 1 }, description: "The page being viewed, 1-based" },
    siblingCount: {
      control: { type: "number", min: 0 },
      description: "Pages kept either side of the current one",
    },
    boundaryCount: {
      control: { type: "number", min: 0 },
      description: "Pages always kept at each end",
    },
    icon: {
      control: "boolean",
      description: "Draw Back and Next as arrows alone, with no label",
    },
    linkAs: {
      control: false,
      description:
        "What every slot renders as once `hrefFor` gives it an href. Pass the app's " +
        "`components/Link` — nothing in these apps navigates through a bare `<a>`.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Pagination>;

/**
 * The row is controlled, so a story that moves has to hold the page. That is the
 * same thing a page does — usually against the URL, which for a paged list it
 * should be.
 */
function LivePagination({ total = 10, ...props }: React.ComponentProps<typeof Pagination>) {
  const [page, setPage] = useState(5);

  return <Pagination total={total} page={page} onPageChange={setPage} {...props} />;
}

/** Stands in for a brand `components/Link`: a component rather than a tag. */
function RouterLink({ prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
  return <a data-router={String(prefetch ?? false)} {...props} />;
}

export const Default: Story = {
  render: (args) => (
    <div className="w-160">
      <LivePagination {...args} />
    </div>
  ),
  args: { total: 10 },
};

/**
 * Arrows alone, for a row with no width for two words. The `aria-label` is what
 * names each control once the text is gone.
 */
export const IconOnly: Story = {
  render: (args) => (
    <div className="w-96">
      <LivePagination {...args} />
    </div>
  ),
  args: { total: 10, icon: true },
};

/**
 * `hrefFor` makes every slot a real link — the row a crawler can follow. Give
 * both `hrefFor` and `onPageChange` and it is a link the app can also intercept.
 *
 * `linkAs` is what a brand app adds on top: every slot then renders through that
 * app's `components/Link`, which resolves the locale, starts the progress bar and
 * handles external hrefs. `RouterLink` below stands in for it.
 */
export const AsLinks: Story = {
  render: (args) => (
    <div className="w-160">
      <Pagination {...args} />
    </div>
  ),
  args: {
    total: 10,
    page: 3,
    hrefFor: (page: number) => `?page=${page}`,
    linkAs: RouterLink,
  },
};

/** Compose the parts when the row needs a slot the data form cannot describe. */
export const Composed: Story = {
  render: () => (
    <div className="w-160">
      <Pagination>
        <PaginationPrevious href="#" />
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              7
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">8</PaginationLink>
          </PaginationItem>
        </PaginationContent>
        <PaginationNext href="#" />
      </Pagination>
    </div>
  ),
};

/**
 * The one story the visual suite photographs.
 *
 * Both ends and the middle, so the disabled Back and the disabled Next are both
 * in the shot, plus a row short enough to need no gaps and one with a wider
 * window. The fixed `w-160` is what keeps the image the same size on macOS and
 * on Linux — a fluid width resolves to whatever the host measures the labels as,
 * and Playwright refuses to compare images of different sizes.
 */
export const AllStates: Story = {
  render: () => (
    <div className="w-160 flex flex-col gap-6">
      <Pagination total={10} page={1} />
      <Pagination total={10} page={5} />
      <Pagination total={10} page={10} />
      <Pagination total={5} page={3} />
      <Pagination total={20} page={10} siblingCount={2} />
      <Pagination total={10} page={5} icon />
    </div>
  ),
};
