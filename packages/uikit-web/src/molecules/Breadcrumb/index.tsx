"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the ones on the files behind
// this barrel are dropped on the way into dist/. So the boundary is declared
// here, where the built consumer actually sees it.

/**
 * The breadcrumb's single entry point: `@ui/web/Breadcrumb` resolves here, and
 * nothing outside this directory imports any deeper.
 *
 * `Breadcrumb` is the whole thing when you pass `items` — the parts below are
 * for the trail that needs a crumb the data form cannot describe. `lib/` is
 * internal: the collapse and the test-id slug.
 *
 * ## Coming from the brand apps
 *
 * `templates/components/Breadcrumbs` in `ui-b2spin-monorepo` is five copies of
 * one component — `default`, `hellomillions`, `mcluck`, `mclucklite`,
 * `playfame` — and each is the same three jobs stacked in a file: derive the
 * trail from `usePathname()`, emit the `BreadcrumbList` JSON-LD, draw it. Only
 * the third is ours.
 *
 * | `templates/components/Breadcrumbs` | here                                    |
 * | ---------------------------------- | --------------------------------------- |
 * | `getBreadcrumbs(pathname)`         | stays in the app — it is routing        |
 * | `getBreadcrumbSchema(breadcrumbs)` | stays in the app — it is SEO            |
 * | the `<ul>` and its `<Crumb>`s      | `items`                                 |
 * | `<Crumb last>` returning `null`    | a crumb with no `href` — `showCurrentPage` |
 * | `currentPageEl`                    | compose, and pass `as` on the heading   |
 * | `classes.list` / `classes.listItem`| `classNames.list` / `classNames.item`   |
 * | `<Link>` from `components/Link`    | `<BreadcrumbLink asChild>`              |
 * | `data-test="…BreadcrumbLink"`      | `data-testid` on the root, derived per href |
 *
 * `showCurrentPage` does not survive as a prop, and should not: PlayFame drew
 * the last crumb and the others dropped it, which is the same trail with and
 * without its last entry. Slice it off in the app and the component has one
 * shape to draw instead of two.
 */
export { Breadcrumb, type BreadcrumbClassNames } from "@/molecules/Breadcrumb/ui/Breadcrumb";
export { BreadcrumbEllipsis, BreadcrumbMenu } from "@/molecules/Breadcrumb/ui/BreadcrumbEllipsis";
export { BreadcrumbLink, BreadcrumbPage } from "@/molecules/Breadcrumb/ui/BreadcrumbLink";
export {
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/molecules/Breadcrumb/ui/BreadcrumbList";
export { type BreadcrumbCrumb } from "@/molecules/Breadcrumb/lib/collapseCrumbs";
