"use client";

// tsup bundles this directory into one entry, and esbuild keeps a "use client"
// directive only from the entry point — the one on the file behind this barrel is
// dropped on the way into dist/. So the boundary is declared here, where the built
// consumer sees it.

/**
 * `@ui/web/Picture` resolves here, and nothing outside this directory imports deeper.
 *
 * A molecule rather than an atom because it composes `Img`: one `<img>` renderer in the
 * design system, with a `<picture>` around it. The published path is unaffected — both
 * levels and both layouts flatten to `@ui/web/Picture`.
 *
 * The directory layout rather than a flat `Picture.tsx` because of `lib/toSrcSet.ts`:
 * building a `srcset` from a density or width map is a pure function with its own
 * conformance rules, and it is worth a node-runtime unit test of its own rather than
 * being reachable only through a rendered component.
 */
export { Picture } from "@/molecules/Picture/ui/Picture";
export type { PictureProps, PictureSource } from "@/molecules/Picture/ui/Picture";
export type { PictureCandidates } from "@/molecules/Picture/lib/toSrcSet";
