/**
 * The candidate list for one `srcset`, in a shape that cannot express an invalid one.
 *
 * A `srcset` describes the *same* image at several resolutions, and HTML gives it two
 * descriptor kinds that may never be mixed in one attribute:
 *
 * - `x` — device pixel ratio. The image occupies one layout box and the browser asks
 *   for more pixels inside it. This is the retina case.
 * - `w` — the intrinsic pixel width of each file. The browser combines it with `sizes`
 *   to work out which file is smallest-but-big-enough for the box it will actually
 *   draw. This is the fluid-layout case, and it is useless without `sizes`.
 *
 * Mixing the two is a conformance error that browsers resolve by dropping candidates,
 * which is invisible: the image still appears, just always at the wrong size. So the
 * two live in separate keys rather than in one map of free-form descriptors, and no
 * runtime check is needed — `{ densities: …, widths: … }` does not typecheck.
 *
 * A raw string stays accepted as the escape hatch, for a `srcset` that arrives from a
 * CMS or an image service already assembled.
 */
type PictureCandidates =
  | string
  | { densities: Record<number, string | undefined>; widths?: never }
  | { widths: Record<number, string | undefined>; densities?: never };

/**
 * Builds the `srcset` attribute for one candidate list.
 *
 * Returns `undefined` — rather than `""` — for a list that describes nothing, so the
 * caller can leave the attribute off entirely. An empty `srcset` is not the same as an
 * absent one: present-but-empty still makes the browser prefer `srcset` over `src`.
 *
 * URLs are trimmed and otherwise passed through untouched. In particular a comma is
 * **not** percent-encoded, even though a comma inside a candidate URL breaks the
 * attribute — `srcset` splits on it. Encoding it here would silently rewrite a URL
 * whose bytes may be signed by the CDN, so the caller keeps that responsibility.
 *
 * @param candidates - A raw `srcset` string, or a density / width map
 * @returns The attribute value, or `undefined` when there is nothing to offer
 */
function toSrcSet(candidates?: PictureCandidates): string | undefined {
  if (candidates == null) return undefined;

  if (typeof candidates === "string") {
    const raw = candidates.trim();
    return raw === "" ? undefined : raw;
  }

  const isDensities = "densities" in candidates && candidates.densities != null;
  const map = isDensities ? candidates.densities : candidates.widths;
  const unit = isDensities ? "x" : "w";

  const parts = Object.entries(map ?? {})
    .map(([descriptor, url]) => ({ url: url?.trim(), value: Number(descriptor) }))
    // A descriptor must be a positive number, and a missing URL is the data-driven
    // case — `{ densities: { 1: game.thumb, 2: game.thumb2x } }` where the retina
    // asset does not exist for every game. It drops out; the rest still ship.
    .filter(
      ({ url, value }) => Number.isFinite(value) && value > 0 && url !== undefined && url !== "",
    )
    // Object key order puts integers first in ascending order but appends
    // non-integers — `1.5` — in insertion order, so the sort is what makes the output
    // deterministic regardless of how the map was written.
    .sort((a, b) => a.value - b.value)
    .map(({ url, value }) => `${url} ${value}${unit}`);

  return parts.length === 0 ? undefined : parts.join(", ");
}

export { toSrcSet };
export type { PictureCandidates };
