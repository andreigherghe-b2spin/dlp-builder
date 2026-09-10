import type * as React from "react";

import { shortcut } from "@/molecules/DropdownMenu/lib/utils";
import { cn } from "@/lib/utils";

/**
 * The keyboard shortcut hint against a row's trailing edge.
 *
 * No `"use client"` and no hooks — it is a `<span>` with a class, so it stays
 * renderable on the server for a menu that is.
 *
 * @param {string} [className] - Additional CSS classes
 */
function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn(shortcut, className)} {...props} />;
}

export { DropdownMenuShortcut };
