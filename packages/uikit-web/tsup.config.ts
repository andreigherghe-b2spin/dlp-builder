import { statSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join, dirname } from "node:path";
import { defineConfig, build } from "tsup";

import { listComponents } from "./scripts/component-entries";

const dir = import.meta.dirname;

// When true (set by scripts/dev-link.mjs), skip dts/clean/mcp-server rebuild
// so watch-mode rebuilds finish in well under a second.
const devLink = process.env.UIKIT_DEV_LINK === "1";

// When true, skip content-hashed chunk splitting so dev-link rebuilds emit
// stable per-entry filenames instead of renaming shared chunks on every save.
const noSplit = devLink || process.env.UIKIT_NO_SPLIT === "1";

// Step 1: Auto-generate ai-docs.json if missing (e.g. fresh clone).
// Runs synchronously before tsup starts so the file is always ready for the build.
const aiDocsPath = resolve(dir, "src/docs/ai-docs.json");
if (!existsSync(aiDocsPath)) {
  console.log("ai-docs.json not found, running codegen:docs...");
  execSync("node scripts/reindex-uikit-docs.js && node scripts/clean-ai-docs.js", {
    cwd: dir,
    stdio: "inherit",
  });
}

// Atomic-design levels components are organized into under src/. Explicit
// (rather than a blind recursive walk over src/) so src/lib and src/docs
// can never be mistaken for component entries.

// Step 2: Collect all UI component entries dynamically so new components
// are picked up automatically without touching this config. Entry keys are
// flattened to components/ui/<basename> regardless of which level directory
// a component lives in, so dist/ output and the public `exports` map never
// change when a component is reclassified between levels.
//
// A component is either a single `foo.tsx` or a `foo/` directory with an
// `index.tsx` barrel — the two layouts documented in CLAUDE.md. Both produce the
// same entry name, so `@ui/web/foo` keeps resolving to `dist/components/ui/foo.js`
// and a component can move between the two layouts without a breaking change.
// Files inside a component directory are bundled into it rather than published
// on their own, which is what makes the barrel the only public surface.
//
// What counts as a component lives in `scripts/component-entries.ts`, which Storybook's
// config and the story-metadata guard read too — three copies of that rule are what
// published `Progress.test` as an entry.
//
// Entries are inserted grouped by the directory their source file sits in, and that
// grouping is load-bearing rather than cosmetic. tsup's dts step runs
// `rollup-plugin-dts`, whose `createPrograms` walks the entry list in insertion order
// and starts a *new* `ts.createProgram` every time an entry's `dirname` differs from
// the previous one's. Each program loads the whole React + Radix + lib.dom type graph,
// so every extra one costs a few hundred MB in the dts worker thread.
//
// Interleaved, that is catastrophic: a directory-form component (`Collapsible/index.tsx`)
// has a different `dirname` than the flat file next to it (`DropdownMenu.tsx`), so
// alphabetical order flip-flops between `src/molecules` and `src/molecules/<Name>` on
// almost every step. The unsorted list produced 18 programs and the worker died with
// ERR_WORKER_OUT_OF_MEMORY; grouped, it produces one per distinct directory.
//
// Grouping alone is not enough any more, and could not have been: with the sort in
// place the count *is* the number of distinct directories, and every component moved
// to the directory layout adds one. Three levels plus `lib` plus nine directory-form
// components is 13, which is where the worker died again — Node's default heap is
// ~4.3GB and thirteen programs do not fit in it. So the dts step is also chunked
// below; see `dtsChunks`.
//
// Order affects nothing else — entry *keys* decide output paths, so `dist/` and the
// public `exports` map are byte-identical either way.
function getEntries() {
  const entries: Record<string, string> = {};

  const found = [
    {
      name: "utils",
      key: "lib/utils",
      entry: resolve(dir, "src/lib/utils.ts"),
      dir: resolve(dir, "src/lib"),
    },
    ...listComponents(resolve(dir, "src")).map((c) => ({
      name: c.name,
      key: `components/ui/${c.name}`,
      entry: c.entry,
      dir: c.dir,
    })),
  ].sort(
    (a, b) => dirname(a.entry).localeCompare(dirname(b.entry)) || a.name.localeCompare(b.name),
  );

  const seenIn = new Map<string, string>();
  for (const { name, key, entry, dir: foundIn } of found) {
    const existingDir = seenIn.get(name);
    if (existingDir) {
      throw new Error(
        `Duplicate component "${name}" found in both ${existingDir} and ${foundIn}. ` +
          "A component must live in exactly one atomic-design level directory.",
      );
    }
    seenIn.set(name, foundIn);
    entries[key] = entry;
  }

  return entries;
}

// Step 2b: Split the entries into batches for the dts step, so the number of
// `ts.createProgram`s alive at once is bounded by this constant rather than by how
// many components happen to use the directory layout.
//
// The JS build stays one pass — esbuild is not what runs out of memory. Only the
// declarations are batched, through `dts: { only: true }` runs in `onSuccess`, and
// each run's worker exits before the next starts, so the peak is one batch rather
// than the whole package. Output is unaffected: an entry's *key* decides its path,
// and the batches partition the same entry list.
//
// Three directories per batch, measured against a ~4.3GB default heap and programs
// that cost a few hundred MB each. Raise it only with a measurement — the failure
// mode is a CI runner dying, not a slow build.
const DTS_DIRS_PER_BATCH = 3;

function dtsBatches(entries: Record<string, string>) {
  const batches: Record<string, string>[] = [];
  let batch: Record<string, string> = {};
  let dirs = 0;
  let previous: string | null = null;

  // `entries` is already grouped by directory, so a change of `dirname` is the
  // boundary rollup-plugin-dts itself would start a new program at.
  for (const [key, entry] of Object.entries(entries)) {
    const entryDir = dirname(entry);

    if (entryDir !== previous) {
      previous = entryDir;
      dirs += 1;

      if (dirs > DTS_DIRS_PER_BATCH) {
        batches.push(batch);
        batch = {};
        dirs = 1;
      }
    }

    batch[key] = entry;
  }

  if (Object.keys(batch).length > 0) batches.push(batch);

  return batches;
}

// Step 3: esbuild plugin to resolve the @/ path alias used across components.
//
// Both layouts have to resolve, because both are legal: `@/atoms/Button` is a
// file and `@/molecules/DropdownMenu` is a directory with an `index.tsx`. The
// directory case needs saying out loud — `statSync` succeeds on a directory, so
// probing an empty extension first returned the directory path and esbuild died
// with "Cannot read file: is a directory". It stayed latent for as long as no
// directory-form component was imported by another component; a component's own
// test importing its barrel does not reach tsup. `isFile()` is what makes the
// probe mean what it reads as.
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function isFile(path: string) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isDirectory(path: string) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function resolveAtAlias() {
  return {
    name: "resolve-at-alias",
    setup(build: {
      onResolve: (
        options: { filter: RegExp },
        callback: (args: { path: string }) => { path: string },
      ) => void;
    }) {
      build.onResolve({ filter: /^@\// }, (args: { path: string }) => {
        const basePath = resolve(dir, "src", args.path.slice(2));

        // An extension already on the import, then one we add, then the barrel
        // of a component directory — the order TypeScript and Vite both use, so
        // the build resolves what the editor and the tests resolved.
        if (isFile(basePath)) return { path: basePath };

        for (const ext of EXTENSIONS) {
          if (isFile(basePath + ext)) return { path: basePath + ext };
        }

        if (isDirectory(basePath)) {
          for (const ext of EXTENSIONS) {
            const barrel = join(basePath, `index${ext}`);
            if (isFile(barrel)) return { path: barrel };
          }
        }

        return { path: basePath };
      });
    },
  };
}

// Step 4 (onSuccess): Copy ai-docs.json from src/ into dist/ so it is
// included in the published package alongside the compiled components.
// ai-docs.json also contains __fileMap (ComponentName → subpath), so no
// separate component-file-map.json is needed.
function copyAiDocs() {
  const src = resolve(dir, "src/docs/ai-docs.json");
  const dest = resolve(dir, "dist/components/ui/docs/ai-docs.json");
  if (!existsSync(src)) {
    console.error(`ai-docs.json not found at ${src}. Run codegen:docs first.`);
    return;
  }
  mkdirSync(resolve(dir, "dist/components/ui/docs"), { recursive: true });
  copyFileSync(src, dest);
  console.log("Copied ai-docs.json → dist/components/ui/docs/ai-docs.json");
}

// Step 5 (onSuccess): Copy foundation CSS files from uikit-themes into
// dist/mcp-server/themes/ so the MCP server can read them when installed
// as an npm package in another repo (no monorepo path available there).
function copyMcpThemes() {
  const foundationDir = resolve(dir, "..", "uikit-themes", "src", "foundation");
  const destDir = resolve(dir, "dist", "mcp-server", "themes");
  const files = ["config.css", "animations.css"];

  if (!existsSync(foundationDir)) {
    console.warn(
      `uikit-themes/src/foundation not found at ${foundationDir}, skipping MCP themes copy.`,
    );
    return;
  }

  mkdirSync(destDir, { recursive: true });
  for (const file of files) {
    const src = join(foundationDir, file);
    const dest = join(destDir, file);
    if (existsSync(src)) {
      copyFileSync(src, dest);
      console.log(`Copied ${file} → dist/mcp-server/themes/${file}`);
    } else {
      console.warn(`Foundation file not found: ${src}`);
    }
  }
}

const entries = getEntries();

export default defineConfig({
  entry: entries,
  format: ["esm"],
  // Emitted by the batched runs in `onSuccess` instead — see `dtsBatches`.
  dts: false,
  sourcemap: true,
  clean: !devLink,
  splitting: !noSplit,
  target: "es2022",
  outDir: "dist",
  esbuildPlugins: [resolveAtAlias()],
  onSuccess: async () => {
    // Step 4: Copy ai-docs.json into dist/
    copyAiDocs();

    // In dev-link fast mode, skip declarations, the mcp-server rebuild and the
    // theme copy on every save — dist/ keeps them from the last full build.
    if (devLink) return;

    // Step 4b: Declarations, a few directories at a time. Sequential on purpose:
    // the point is that one batch's worker has exited before the next one starts.
    const batches = dtsBatches(entries);
    for (const [index, batch] of batches.entries()) {
      console.log(
        `DTS batch ${index + 1}/${batches.length} (${Object.keys(batch).length} entries)`,
      );
      await build({
        config: false,
        entry: batch,
        format: ["esm"],
        dts: { only: true },
        sourcemap: false,
        clean: false,
        outDir: "dist",
        esbuildPlugins: [resolveAtAlias()],
      });
    }

    // Step 5: Build the MCP server with Node.js-specific settings (no dts,
    // node18 target, externalized Node built-ins and MCP/zod deps).
    // clean: false — avoids wiping the dist/ that was just built above.
    await build({
      config: false,
      entry: { "mcp-server/server": "mcp-server/server.ts" },
      format: ["esm"],
      dts: false,
      sourcemap: false,
      clean: false,
      outDir: "dist",
      external: ["fs", "fs/promises", "path", "url"],
      target: "node22",
    });

    // Step 6: Copy foundation CSS files so the MCP server works outside the monorepo
    copyMcpThemes();
  },
});
