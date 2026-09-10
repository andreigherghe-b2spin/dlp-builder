import type { BreadcrumbCrumb } from "@/molecules/Breadcrumb/lib/collapseCrumbs";

/**
 * A crumb's natural name: where it goes, flattened to something a locator does
 * not have to escape.
 *
 * The query and the fragment go first — two crumbs differing only by `?page=2`
 * are the same place — and `/` would flatten to nothing, so the site root is
 * called `root` rather than left with an empty name.
 */
function slugify(href: string) {
  const slug = href
    .replace(/[?#].*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "root";
}

/**
 * One crumb with the name it is rendered under.
 *
 * The name is on the crumb rather than in a lookup beside it, so slicing the
 * trail into leading, hidden and trailing carries the names along with it.
 */
type NamedCrumb = BreadcrumbCrumb & { name: string };

/**
 * A name per crumb, unique across the trail — used both as the React key and as
 * the crumb's part of the `data-testid`.
 *
 * A crumb is named after where it goes rather than after its position, because a
 * level inserted in the middle moves every position after it. The crumb with
 * nowhere to go is `page`.
 *
 * Neither name is unique on its own: a trail can repeat an href, and nothing
 * says only the last crumb may be hrefless. Left to `href ?? "page"` both cases
 * collapse two crumbs onto one key — React renders the second over the first —
 * and onto one `data-testid`, so a locator that should match one part matches
 * two and every test using it goes ambiguous rather than red. The first crumb to
 * ask for a name keeps it and later ones take a suffix, so the ordinary trail is
 * untouched: `<base>-page` stays `<base>-page` as long as there is one current
 * page, which there almost always is.
 *
 * Returned as an array in trail order rather than as a `Map` keyed on the crumb.
 * A `Map` is keyed by object identity, and a caller may legitimately put the
 * same object in twice — `items={[home, section, home]}` — at which point the
 * second `set` overwrites the first, both positions read the later name, and the
 * duplicate key and duplicate test id this function exists to prevent come back.
 * Position is the one thing a trail cannot have two of.
 *
 * @param crumbs - The full trail, root first
 * @returns The same crumbs, in order, each carrying its name
 */
function nameCrumbs(crumbs: BreadcrumbCrumb[]): NamedCrumb[] {
  const taken = new Set<string>();

  return crumbs.map((crumb) => {
    const base = crumb.href == null ? "page" : slugify(crumb.href);

    let name = base;
    for (let suffix = 2; taken.has(name); suffix += 1) {
      name = `${base}-${suffix}`;
    }

    taken.add(name);

    return { ...crumb, name };
  });
}

export { nameCrumbs, type NamedCrumb };
