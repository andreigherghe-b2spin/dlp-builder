import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Responsive table component with horizontal scroll container
 *
 * @description Creates a table wrapped in a responsive container with horizontal scrolling.
 * Automatically applies base styles and supports all standard HTML table attributes.
 *
 * @param {string} [className] - Additional CSS classes for customization
 * @param {React.ReactNode} [children] - Table content (thead, tbody, tfoot, etc.)
 *
 * @example
 * <Table className="border-collapse">
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Name</TableHead>
 *       <TableHead>Email</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>John Doe</TableCell>
 *       <TableCell>john@example.com</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

/**
 * Table header component with bottom border styling
 *
 * @description Renders a thead element with automatic border styling for table rows.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ReactNode} [children] - Header content (typically TableRow with TableHead)
 *
 * @example
 * <TableHeader>
 *   <TableRow>
 *     <TableHead>Name</TableHead>
 *     <TableHead>Email</TableHead>
 *   </TableRow>
 * </TableHeader>
 */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

/**
 * Table body component with row border management
 *
 * @description Renders a tbody element with styling that removes border from the last row.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ReactNode} [children] - Body content (typically TableRow elements)
 *
 * @example
 * <TableBody>
 *   <TableRow>
 *     <TableCell>John Doe</TableCell>
 *     <TableCell>john@example.com</TableCell>
 *   </TableRow>
 *   <TableRow>
 *     <TableCell>Jane Smith</TableCell>
 *     <TableCell>jane@example.com</TableCell>
 *   </TableRow>
 * </TableBody>
 */
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

/**
 * Table footer component with muted background styling
 *
 * @description Renders a tfoot element with muted background and medium font weight.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ReactNode} [children] - Footer content
 *
 * @example
 * <TableFooter>
 *   <TableRow>
 *     <TableCell>Total</TableCell>
 *     <TableCell>$2,500.00</TableCell>
 *   </TableRow>
 * </TableFooter>
 */
function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

/**
 * Table row component with hover and selection states
 *
 * @description Renders a tr element with hover effects, selection state support, and transition animations.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ReactNode} [children] - Row content (typically TableHead or TableCell)
 *
 * @example

 * <TableRow>
 *   <TableCell>Product A</TableCell>
 *   <TableCell>$100.00</TableCell>
 * </TableRow>

 *
 * @example

 * // With selection state
 * <TableRow data-state="selected">
 *   <TableCell>Selected Item</TableCell>
 *   <TableCell>$50.00</TableCell>
 * </TableRow>

 */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Table header cell component with consistent styling
 *
 * @description Renders a th element with proper alignment, padding, and checkbox support.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ReactNode} [children] - Header cell content
 *
 * @example
 * <TableHead>Name</TableHead>
 *
 * @example
 * // With custom alignment
 * <TableHead className="text-right">Price</TableHead>
 *
 * @example
 * // With checkbox
 * <TableHead>
 *   <Checkbox role="checkbox" />
 * </TableHead>
 */
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 whitespace-nowrap px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Table data cell component with consistent styling
 *
 * @description Renders a td element with proper alignment, padding, and checkbox support.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ReactNode} [children] - Cell content
 *
 * @example
 * <TableCell>John Doe</TableCell>
 *
 * // With custom alignment
 * <TableCell className="text-right font-medium">$2,500.00</TableCell>
 *
 * // With checkbox
 * <TableCell>
 *   <Checkbox role="checkbox" />
 * </TableCell>
 */
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Table caption component for accessibility and description
 *
 * @description Renders a caption element with muted styling for table descriptions.
 *
 * @param {string} [className] - Additional CSS classes
 * @param {React.ReactNode} [children] - Caption text
 *
 * @example
 * <Table>
 *   <TableCaption>A list of your recent invoices.</TableCaption>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Invoice</TableHead>
 *       <TableHead>Status</TableHead>
 *     </TableRow>
 *   </TableHeader>
 * </Table>
 */
function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
