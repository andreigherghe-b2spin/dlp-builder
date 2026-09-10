"use client";

import * as React from "react";

import { Img, type ImgProps } from "@/atoms/Img";
import { toSrcSet, type PictureCandidates } from "@/molecules/Picture/lib/toSrcSet";

/**
 * One `<source>`: a set of candidates plus the conditions under which the browser is
 * allowed to use them.
 *
 * `type` and `media` are two different questions and combine freely:
 *
 * - `type` asks *can you decode this?* — the format gate. `image/avif`,
 *   `image/webp`, `image/jxl`. A browser that does not know the type skips the whole
 *   source without fetching anything.
 * - `media` asks *does this describe your viewport?* — the art-direction gate. It is
 *   for a genuinely different picture (a tighter crop for phones), not for a smaller
 *   copy of the same one; a smaller copy is `srcSet` + `sizes`, which the browser
 *   resolves better than a media query can.
 */
type PictureSource = {
  /** The candidates, as a raw `srcset` or a density / width map. */
  srcSet: PictureCandidates;
  /** MIME type of every candidate here. Omitted, the source is offered to everyone. */
  type?: string;
  /** Media query gating this source. Omitted, it matches always. */
  media?: string;
  /** Required by `widths` candidates, ignored by `densities` ones. */
  sizes?: string;
  /** Intrinsic width of the candidates, for a crop whose aspect ratio differs. */
  width?: number;
  /** Intrinsic height of the candidates, for a crop whose aspect ratio differs. */
  height?: number;
};

/**
 * Every `Img` prop, since an `Img` is what this renders — `alt` required, `fallbackSrc`
 * meaning the same thing — plus the offers, and `srcSet` widened to the structured form.
 * Declared as an omission of `ImgProps` rather than respelled, so a prop `Img` grows
 * later arrives here without this file being edited.
 */
type PictureProps = Omit<ImgProps, "srcSet"> & {
  sources: PictureSource[];
  srcSet?: PictureCandidates;
};

/**
 * A `<picture>` that negotiates format and art direction, and swaps to a fallback when
 * whatever it chose fails to load.
 *
 * `<picture>` itself renders nothing and styles nothing: it is a list of offers, and
 * the `<img>` inside it is the element that exists, carries `alt`, `className`,
 * `width`/`height`, `loading`, and is the one thing laid out. This component is shaped
 * around that — every prop other than `sources`, `srcSet` and `fallbackSrc` is an
 * `<img>` prop and lands on the `<img>`.
 *
 * ## Three axes, and which one to reach for
 *
 * | Axis | Question | Where it goes |
 * | --- | --- | --- |
 * | Format | can the browser decode it? | `sources[].type` |
 * | Art direction | is this the right *picture* for the viewport? | `sources[].media` |
 * | Resolution | how many pixels for the box it lands in? | `srcSet` inside a source |
 *
 * Most images need only the first and third:
 *
 * ```tsx
 * <Picture
 *   alt="Neon Reels"
 *   src="/games/neon-reels.jpg"
 *   srcSet={{ densities: { 1: "/games/neon-reels.jpg", 2: "/games/neon-reels@2x.jpg" } }}
 *   sources={[
 *     { type: "image/avif", srcSet: { densities: { 1: "/games/neon-reels.avif", 2: "/games/neon-reels@2x.avif" } } },
 *     { type: "image/webp", srcSet: { densities: { 1: "/games/neon-reels.webp", 2: "/games/neon-reels@2x.webp" } } },
 *   ]}
 *   className="h-30 w-40 rounded-lg object-cover"
 * />
 * ```
 *
 * ## Order is the API, and it is yours
 *
 * The browser walks `sources` top to bottom and takes the **first** source whose
 * `media` matches and whose `type` it can decode. It never looks further, and it never
 * reconsiders — so the list is a preference order, from best to worst: AVIF, then
 * WebP, then whatever the `<img>` itself holds as the format every browser has.
 *
 * The list is deliberately not sorted for you. Sorting would have to invent a ranking
 * of formats, and with `media` in play there is no safe one: when both gates are used,
 * **group by `media` and order the groups so the most specific query comes first.**
 * Format-major order is the trap — `(min-width: 0px)` sits above `(min-width: 900px)`
 * and matches every viewport, so the wide crop is never reached.
 *
 * ```tsx
 * sources={[
 *   { media: "(min-width: 900px)", type: "image/avif", srcSet: "/hero-wide.avif" },
 *   { media: "(min-width: 900px)", type: "image/webp", srcSet: "/hero-wide.webp" },
 *   { type: "image/avif", srcSet: "/hero-tall.avif" },
 *   { type: "image/webp", srcSet: "/hero-tall.webp" },
 * ]}
 * ```
 *
 * ## Why `fallbackSrc` exists at all
 *
 * Source selection looks only at `type` and `media`. Whether the file is *there* is
 * never part of it: a matched source whose URL 404s does not fall through to the next
 * source, it fails the image outright. So a `<picture>` with three formats has three
 * ways to break and no recovery of its own.
 *
 * Given a `fallbackSrc`, the failure drops **every** source together with the `<img>`'s
 * own `srcSet` and `sizes`, and only then sets `src`. Dropping the sources is the part
 * that makes it work: leave one in place and the browser goes on choosing it, and the
 * fallback sits on an attribute nothing reads.
 *
 * As with `Img` there is no built-in placeholder URL — that belongs to the product's
 * asset host — and `alt` is required, because it is a string a person hears.
 *
 * ## It is an `Img` in a `<picture>`
 *
 * The image element is `Img`, not a bare `<img>`: there is one `<img>` renderer in the
 * design system and this is a `<picture>` wrapped around it. That is also why `Picture`
 * is a molecule rather than an atom — it composes another component of ours.
 *
 * The one thing it does **not** delegate is the fallback swap, and that is the whole
 * reason this component exists rather than a `sources` prop on `Img`. Removing the
 * `<source>` elements is what makes a fallback reachable at all, and only the component
 * that renders them can remove them — so the failure state lives here, and the `Img`
 * inside is given no `fallbackSrc` of its own. Two states would be two keys: `Img` keys
 * its swap on `src`, which under-identifies a `<picture>` whose resource came from a
 * source, and the two would disagree the first time the offers changed while `src` did
 * not.
 *
 * ## Layout: it stands in for an `Img`
 *
 * The `<picture>` is `display: contents`, so it has no box of its own and the `<img>`
 * is laid out by whatever surrounds the component — a flex or grid parent sees the
 * image, not a wrapper. That is what lets an `Img` be swapped for a `Picture` with every
 * class it already had (`size-full object-cover`) resolving against the same parent.
 * A case that genuinely wants a box around the image wants a `div` of its own; there
 * is nothing to style on a `<picture>`.
 *
 * @param {string} alt - The image's text alternative. Required. `""` marks the image
 * decorative, which hides it from assistive technology
 * @param {PictureSource[]} sources - The offers, best first. Each is one `<source>`:
 * `srcSet` plus the `type` and `media` gates gating it. A source whose candidates come
 * out empty is not rendered
 * @param {string} [src] - The `<img>`'s own URL: the last resort, in the format every
 * browser can decode. Also what a browser too old for `<picture>` uses
 * @param {string | { densities: Record<number, string> } | { widths: Record<number, string> }} [srcSet] -
 * Candidates for `src`'s format, in the same structured form the sources take
 * @param {string} [sizes] - Widths for a `widths` `srcSet`. Dropped with it on failure
 * @param {string} [fallbackSrc] - Loaded instead once the chosen resource fails, with
 * every source removed so it can be reached. Omitted, a failed image is left broken
 * @param {string} [className] - Classes for the `<img>` itself
 * @param {React.ReactEventHandler<HTMLImageElement>} [onError] - Called on the failure
 * too; the swap happens either way
 *
 * @example
 * ```tsx
 * // Art direction: a tall crop on phones, a wide one from 900px up, AVIF preferred in
 * // both, and a JPEG under everything.
 * <Picture
 *   alt="Weekly tournament"
 *   src="/promo/tournament-tall.jpg"
 *   sources={[
 *     { media: "(min-width: 900px)", type: "image/avif", srcSet: "/promo/tournament-wide.avif" },
 *     { media: "(min-width: 900px)", srcSet: "/promo/tournament-wide.jpg" },
 *     { type: "image/avif", srcSet: "/promo/tournament-tall.avif" },
 *   ]}
 *   fallbackSrc="/promo/placeholder.jpg"
 * />
 *
 * // Fluid width: one format, six sizes, and `sizes` telling the browser the box.
 * <Picture
 *   alt=""
 *   src="/banner-1200.jpg"
 *   sources={[{
 *     type: "image/webp",
 *     sizes: "(max-width: 600px) 100vw, 50vw",
 *     srcSet: { widths: { 400: "/banner-400.webp", 800: "/banner-800.webp", 1200: "/banner-1200.webp" } },
 *   }]}
 * />
 * ```
 *
 * @cssVariables
 * None. The component draws no chrome of its own.
 */
function Picture({
  alt,
  fallbackSrc,
  onError,
  sizes,
  sources,
  src,
  srcSet,
  ...props
}: PictureProps) {
  const [failedAttempt, setFailedAttempt] = React.useState<string>();

  const imgSrcSet = toSrcSet(srcSet);
  // A source that resolves to no candidates is dropped rather than rendered empty: a
  // `<source>` without a `srcset` is invalid, and an invalid source is skipped anyway.
  const offers = sources
    .map((source) => ({ ...source, srcSet: toSrcSet(source.srcSet) }))
    .filter((source): source is PictureSource & { srcSet: string } => source.srcSet != null);

  // Everything this render is offering the browser, as one string. The failure is keyed
  // on it rather than on `src` alone, because with `<picture>` the resource that failed
  // usually came from a source: keyed on `src`, an art-direction swap that kept the
  // same JPEG under it would stay pinned to the fallback forever. Any change to the
  // offers no longer matches what failed, and the image is retried with no effect to
  // reset it.
  const attempt = [
    src ?? "",
    imgSrcSet ?? "",
    ...offers.map((offer) => `${offer.media ?? ""}|${offer.type ?? ""}|${offer.srcSet}`),
  ].join("\n");

  const showFallback = fallbackSrc != null && failedAttempt === attempt;

  return (
    // `display: contents` — see the layout note above: the image is laid out by this
    // component's parent, so `Picture` drops into an `Img`'s place unchanged.
    <picture className="contents">
      {showFallback
        ? null
        : offers.map((offer) => (
            <source
              height={offer.height}
              key={`${offer.media ?? ""}|${offer.type ?? ""}|${offer.srcSet}`}
              media={offer.media}
              sizes={offer.sizes}
              srcSet={offer.srcSet}
              type={offer.type}
              width={offer.width}
            />
          ))}
      {/*
       * No `fallbackSrc` reaches the `Img`, on purpose — see the note above. Its swap
       * cannot see the offers, so the decision is made here and `Img` is handed the URL
       * that decision produced.
       */}
      <Img
        alt={alt}
        onError={(event) => {
          // Records what was asked for, never what is currently shown. So a
          // `fallbackSrc` that 404s too writes the same value a second time, React
          // bails out of the identical state, and there is no loop.
          setFailedAttempt(attempt);
          onError?.(event);
        }}
        sizes={showFallback ? undefined : sizes}
        src={showFallback ? fallbackSrc : src}
        srcSet={showFallback ? undefined : imgSrcSet}
        {...props}
      />
    </picture>
  );
}

export { Picture };
export type { PictureProps, PictureSource };
