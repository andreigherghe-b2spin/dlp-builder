"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the ones on the files behind
// this barrel are dropped on the way into dist/. So the boundary is declared
// here, where the built consumer actually sees it.

/**
 * The dropdown menu's single entry point: `@ui/web/DropdownMenu` resolves here,
 * and nothing outside this directory imports any deeper.
 *
 * One file per part, and every class the menu wears in `lib/utils.ts` — the same
 * layout `Collapsible` and `Tabs` use. The classes are there rather than beside
 * the part that renders them because five of the parts share `row`, two share
 * `panel`, and a token move should be one file to open.
 *
 * `lib/utils.ts` also carries the reason those classes are *not* shared with
 * `Select`, which is the question to read first if you are here to restyle
 * something.
 */
export {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSub,
} from "@/molecules/DropdownMenu/ui/DropdownMenu";
export {
  DropdownMenuContent,
  DropdownMenuSubContent,
} from "@/molecules/DropdownMenu/ui/DropdownMenuContent";
export { DropdownMenuTrigger } from "@/molecules/DropdownMenu/ui/DropdownMenuTrigger";
export { DropdownMenuSubTrigger } from "@/molecules/DropdownMenu/ui/DropdownMenuSubTrigger";
export { DropdownMenuItem } from "@/molecules/DropdownMenu/ui/DropdownMenuItem";
export { DropdownMenuCheckboxItem } from "@/molecules/DropdownMenu/ui/DropdownMenuCheckboxItem";
export { DropdownMenuRadioItem } from "@/molecules/DropdownMenu/ui/DropdownMenuRadioItem";
export { DropdownMenuLabel } from "@/molecules/DropdownMenu/ui/DropdownMenuLabel";
export { DropdownMenuSeparator } from "@/molecules/DropdownMenu/ui/DropdownMenuSeparator";
export { DropdownMenuShortcut } from "@/molecules/DropdownMenu/ui/DropdownMenuShortcut";
