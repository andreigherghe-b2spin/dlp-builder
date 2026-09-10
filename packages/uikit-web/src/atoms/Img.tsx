"use client";

import * as React from "react";

type ImgProps = Omit<React.ComponentProps<"img">, "alt"> & {
  alt: string;
  fallbackSrc?: string;
};

/**
 * An `<img>` that swaps to a fallback when its source fails to load.
 *
 * Everything else about it is a plain image: no wrapper, no styles of its own, no
 * intrinsic size. `className` and every native attribute land on the `<img>` itself,
 * so it drops into whatever layout is already around it.
 *
 * Two things it does not do, both deliberate:
 *
 * **It has no built-in fallback URL.** Without `fallbackSrc` a broken image stays
 * broken, exactly as a bare `<img>` would. The placeholder is a property of the
 * product's asset host, not of the design system, so there is nothing sensible for
 * this file to hardcode and no environment for it to read one from.
 *
 * **`alt` is required.** It is a real string a person hears, so it cannot be derived
 * from the URL — a screen reader announcing
 * `https://cdn.example.com/games/a8f31c.jpg` is worse than silence. Pass `alt=""`
 * for a decorative image; that is the way to say "skip this", and it has to be said
 * on purpose.
 *
 * @param {string} alt - The image's text alternative. Required. `""` marks the image
 * decorative, which hides it from assistive technology
 * @param {string} [src] - The image to load
 * @param {string} [fallbackSrc] - Loaded instead once `src` fails. Omitted, a failed
 * image is simply left broken
 * @param {string} [srcSet] - Responsive candidates, as on a plain `<img>`. Dropped
 * together with `src` when the fallback takes over, since the fallback is one URL and
 * a browser that has candidates never looks at `src`
 * @param {string} [sizes] - Widths for `srcSet`, and dropped with it
 * @param {string} [className] - Classes for the `<img>`
 * @param {React.ReactEventHandler<HTMLImageElement>} [onError] - Called on the failure
 * too; the swap happens either way
 *
 * @example
 * ```tsx
 * <Img
 *   src={game.thumbnail}
 *   fallbackSrc="/placeholder.jpg"
 *   alt={game.name}
 *   className="size-full object-cover"
 * />
 *
 * // Decorative — announced by nothing, because the caption beside it already says it
 * <Img src={badge.icon} alt="" />
 * ```
 *
 * @cssVariables
 * None. The component draws no chrome of its own.
 */
function Img({ alt, fallbackSrc, onError, sizes, src, srcSet, ...props }: ImgProps) {
  const [failedSrc, setFailedSrc] = React.useState<string>();

  // Keyed on `src` rather than a bare boolean, so pointing the component at a new
  // image retries it: a different `src` no longer matches the one that failed, and
  // the fallback drops away without an effect to reset it.
  const showFallback = fallbackSrc != null && failedSrc != null && failedSrc === src;

  return (
    <img
      alt={alt}
      src={showFallback ? fallbackSrc : src}
      // Dropped along with `src`, and this is what makes the swap work at all: a
      // browser picks its candidate from `srcset` and ignores `src` entirely whenever
      // there is one. Left in place, the fallback would be set on an attribute nothing
      // reads, and the broken candidates would go on being the only ones offered.
      // `sizes` describes a candidate list that no longer exists, so it goes too.
      srcSet={showFallback ? undefined : srcSet}
      sizes={showFallback ? undefined : sizes}
      onError={(event) => {
        // Records `src` — the URL originally asked for — and never the one currently
        // being shown. So a `fallbackSrc` that 404s too writes the same value a second
        // time, React bails out of the identical state, and there is no loop.
        setFailedSrc(src);
        onError?.(event);
      }}
      {...props}
    />
  );
}

export { Img };
export type { ImgProps };
