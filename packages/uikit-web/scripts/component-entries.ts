/**
 * The one answer to "what counts as a component", shared by everything that has to
 * enumerate them: tsup's entry discovery, Storybook's `@ui/web/*` aliases, and the
 * story-metadata guard.
 *
 * It used to live in each of those separately, and that is precisely what published
 * `Progress.test` as an entry: a flat component keeps its test beside it, `foo.test.tsx`
 * is a `.tsx` in a level directory like any other, and three copies of the rule meant
 * three places to remember it. The next non-component `.tsx` — `foo.stories.tsx`,
 * `foo.types.tsx` — now only has to be handled here.
 *
 * `node:fs` and nothing else, so a tsup config, a Storybook config and a Vitest guard can
 * all import it without dragging a toolchain along.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

/** The atomic-design levels, in the order CLAUDE.md lists them. */
export const LEVELS = ["atoms", "molecules", "organisms"] as const;

/**
 * A component's test lives beside it (`Badge.tsx` / `Badge.test.tsx`), so a level
 * directory holds `.tsx` files that are not components. A test *inside* a component
 * directory is already invisible below, since only `index.tsx` is looked for there.
 */
const TEST_FILE = /\.test\.tsx?$/;

export type ComponentEntry = {
  /**
   * Basename: the tsup entry name, the `@ui/web` subpath, and the story file's name.
   * camelCase, after the component it exports — `AspectRatio` is `aspectRatio`.
   */
  name: string;
  /** The file to build and alias — `foo.tsx`, or `foo/index.tsx` in the directory layout. */
  entry: string;
  /** The level directory it was found in. */
  level: (typeof LEVELS)[number];
  /** The directory it was found in, which is what a duplicate-component error names. */
  dir: string;
};

function sourceDirs(uikitWebSrc: string): { dir: string; level: ComponentEntry["level"] }[] {
  return LEVELS.map((level) => ({ dir: resolve(uikitWebSrc, level), level })).filter(({ dir }) =>
    existsSync(dir),
  );
}

/**
 * Every component under `src`, in either of the two layouts CLAUDE.md allows: a single
 * `foo.tsx`, or a `foo/` directory whose `index.tsx` is its only public surface. Both
 * yield the same `name`, which is what lets a component move between the two layouts —
 * and between levels — without changing anything a consumer imports.
 *
 * Not deduplicated: two components with one name is an error tsup raises with both paths,
 * and swallowing it here would turn it into a silently dropped entry.
 *
 * @param uikitWebSrc - Absolute path to `packages/uikit-web/src`
 */
export function listComponents(uikitWebSrc: string): ComponentEntry[] {
  const found: ComponentEntry[] = [];

  for (const { dir, level } of sourceDirs(uikitWebSrc)) {
    for (const file of readdirSync(dir)) {
      const path = resolve(dir, file);

      if (statSync(path).isFile() && file.endsWith(".tsx") && !TEST_FILE.test(file)) {
        found.push({ name: file.replace(/\.tsx$/, ""), entry: path, level, dir });
        continue;
      }

      if (statSync(path).isDirectory() && existsSync(resolve(path, "index.tsx"))) {
        found.push({ name: file, entry: resolve(path, "index.tsx"), level, dir });
      }
    }
  }

  return found;
}
