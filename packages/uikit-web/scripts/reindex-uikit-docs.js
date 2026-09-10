#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Whether a name is part of a package's public surface worth documenting: a
 * component, written PascalCase, or a hook, written `useThing`.
 *
 * The lowercase `use` prefix is why this is a predicate and not a single regex
 * test on the first letter. A hook is API — `useCarousel` is exported from
 * `@ui/web/Carousel` with its own `@example` — and a first-letter test drops it
 * on the floor. `type Foo` and `foo` still fail both branches, which is what
 * keeps types and internal helpers out.
 *
 * @param {string} name - The identifier as written in the source
 * @returns {boolean}
 */
function isPublicApiName(name) {
  return /^[A-Z]/.test(name) || /^use[A-Z]/.test(name);
}

/**
 * The other names a component answers to, read from `@alias` tags in its own
 * JSDoc.
 *
 * An alias is only for a name the *products* use for something this library
 * ships under a different one — `GlobalSnackbar` and `openSnackbar()` in the
 * brand apps, `Toast` in loyalty, all of them this package's `Toaster`. An
 * agent told to "replace the snackbar" has no way to guess the answer is filed
 * under `Toaster`, and the migration recipe is inside that entry.
 *
 * Spelling is not an alias: the MCP server matches on casing and separators
 * already, so `scroll-area` finds `ScrollArea` with no tag.
 *
 * The tag lives on the component so that whoever renames or deletes it is
 * looking at the alias when they do. A long list is a sign the naming needs
 * fixing rather than aliasing.
 *
 * @param {string} doc - The raw JSDoc block for one export
 * @returns {string[]}
 */
function extractAliases(doc) {
  return [...doc.matchAll(/^\s*\*\s*@alias\s+(\S+)/gm)].map((m) => m[1]);
}

/**
 * Analyzes TypeScript/JSX file and extracts component documentation
 * @param {string} filePath - Path to the file
 * @returns {Object} Object with component names and their documentation
 */
function analyzeComponentFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    const components = {};
    let currentComment = "";
    let inComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Start of JSDoc comment.
      //
      // A single-line `/** … */` opens and closes on the same line, and saying so
      // is load-bearing. The exit test below used to look for a line *starting*
      // with `*/`, which a one-liner never produces — so `inComment` stayed true
      // to the end of the file, every component after it went unrecorded, and the
      // docs simply vanished with nothing failing. There are ~158 one-line JSDoc
      // comments in src/, so this was eating far more than it looked like.
      if (line.startsWith("/**")) {
        currentComment = line;
        inComment = !line.endsWith("*/");
        continue;
      }

      // Continue comment. Closed by `*/` wherever it sits on the line, not only
      // at the start of one — `* the last word */` is a comment ending too.
      if (inComment) {
        currentComment += "\n" + line;
        if (line.endsWith("*/")) inComment = false;
        continue;
      }

      // Find component functions
      if (
        line.startsWith("function ") ||
        line.startsWith("const ") ||
        line.startsWith("export function ")
      ) {
        let functionName = "";

        if (line.startsWith("function ")) {
          const match = line.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
          if (match) functionName = match[1];
        } else if (line.startsWith("const ")) {
          const match = line.match(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
          if (match) functionName = match[1];
        } else if (line.startsWith("export function ")) {
          const match = line.match(/export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
          if (match) functionName = match[1];
        }

        if (functionName && isPublicApiName(functionName)) {
          const documentation = currentComment.trim() || null;
          components[functionName] = documentation;
          currentComment = "";
        }
      }
    }

    // Look for exports at the end of the file
    const exportLines = lines.filter((line) => line.trim().startsWith("export "));

    for (const exportLine of exportLines) {
      const exportMatch = exportLine.match(/export\s*{\s*([^}]+)\s*}/);
      if (exportMatch) {
        const exportedItems = exportMatch[1].split(",").map((item) => item.trim());

        for (const item of exportedItems) {
          const cleanItem = item.split(" as ")[0].trim();
          if (isPublicApiName(cleanItem) && !components[cleanItem]) {
            components[cleanItem] = null;
          }
        }
      }

      const defaultExportMatch = exportLine.match(
        /export\s*{\s*default\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*}/,
      );
      if (defaultExportMatch) {
        const componentName = defaultExportMatch[1];
        if (!components[componentName]) {
          components[componentName] = null;
        }
      }
    }

    return components;
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error.message);
    return {};
  }
}

/**
 * Extracts named exports (PascalCase only) from a component file.
 * Returns an array of exported component names.
 * @param {string} content - Source file content
 */
function extractExportedComponents(content) {
  const EXPORT_RE = /export\s+\{([^}]+)\}/g;
  const names = [];
  let m;
  while ((m = EXPORT_RE.exec(content)) !== null) {
    for (const part of m[1].split(",")) {
      const name = part
        .trim()
        .split(/\s+as\s+/)[0]
        .trim();
      if (name && isPublicApiName(name)) {
        names.push(name);
      }
    }
  }
  return names;
}

// Atomic-design levels components are organized into under src/. Explicit
// list (rather than a blind recursive walk over src/) so src/lib and
// src/docs can never be mistaken for component directories.
const LEVELS = ["atoms", "molecules", "organisms"];

/**
 * A component's tests live beside it, so a level directory holds `.tsx` files that
 * are not components and a component directory holds them at every depth. Both
 * enumerations below have to skip them, and one regex rather than two is the point:
 * the copy that was missing from `collectComponents` is how `TimezoneSelect` — a
 * fixture declared inside `Select.test.tsx` — came to be documented as a component.
 */
const TEST_FILE = /\.test\.tsx?$/;

/**
 * Every source file under a directory, at any depth — `.ts` as well as `.tsx`.
 * A hook that renders no JSX is a `.ts` file by preference (`lib/useStepper.ts`),
 * and it is documented exactly like one that does: walking only `.tsx` silently
 * dropped every such hook's JSDoc the moment it was renamed.
 * @param {string} dir - Directory to walk
 * @returns {string[]} Absolute paths
 */
function collectSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    if (TEST_FILE.test(entry.name)) return [];
    return /\.tsx?$/.test(entry.name) ? [entryPath] : [];
  });
}

/**
 * The components to index, in either of the two layouts CLAUDE.md allows: a
 * single `foo.tsx`, or a `foo/` directory whose `index.tsx` is its only public
 * surface. Both land on the same subpath, because both build to the same entry.
 *
 * `sources` is every file worth scraping JSDoc from — for a directory that is
 * the whole tree, since the documented component lives under `ui/` rather than
 * in the barrel. `exports` is the barrel alone, so `__fileMap` lists what a
 * consumer can actually import and not the internals behind it.
 *
 * @param {string} uiComponentsPath - The `src/components/ui` directory
 * @returns {{subpath: string, sources: string[], exports: string}[]}
 */
function collectComponents(uiComponentsPath) {
  return fs
    .readdirSync(uiComponentsPath, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const entryPath = path.join(uiComponentsPath, entry.name);

      if (entry.isFile() && entry.name.endsWith(".tsx") && !TEST_FILE.test(entry.name)) {
        const subpath = entry.name.replace(/\.tsx$/, "");
        return [{ subpath, sources: [entryPath], exports: entryPath }];
      }

      const barrel = path.join(entryPath, "index.tsx");
      if (entry.isDirectory() && fs.existsSync(barrel)) {
        return [{ subpath: entry.name, sources: collectSourceFiles(entryPath), exports: barrel }];
      }

      return [];
    });
}

/**
 * Main function to analyze all components
 */
function analyzeAllComponents() {
  const srcPath = path.join(__dirname, "..", "src");
  const sourceDirs = LEVELS.map((level) => path.join(srcPath, level))
    .filter((p) => fs.existsSync(p))
    .map((p) => ({ dir: p, level: path.basename(p) }));

  if (sourceDirs.length === 0) {
    console.error("No component source directories found under src/");
    process.exit(1);
  }

  const allComponents = {};
  /** @type {Record<string, string>} Maps ComponentName → subpath (e.g. "Button" → "button") */
  const componentFileMap = {};
  /** @type {Record<string, string>} Maps ComponentName → atomic-design level (e.g. "Button" → "atoms") */
  const componentLevelMap = {};

  let totalComponents = 0;
  for (const { dir: sourceDir, level } of sourceDirs) {
    const components = collectComponents(sourceDir);
    totalComponents += components.length;
    console.log(`Found ${components.length} components in ${path.relative(srcPath, sourceDir)}`);

    for (const { subpath, sources, exports } of components) {
      console.log(`Analyzing ${subpath}...`);

      const documented = {};
      for (const source of sources) {
        Object.assign(documented, analyzeComponentFile(source));
      }

      const exported = extractExportedComponents(fs.readFileSync(exports, "utf8"));

      for (const name of exported) {
        componentFileMap[name] = subpath;
        componentLevelMap[name] = level;
      }

      // The entry decides what is published, not the files behind it. Scraping
      // every source and keeping all of it documents a directory component's
      // internals as though they were importable: `CarouselContent` and
      // `CarouselArrow` live under `ui/`, are deliberately absent from
      // `index.tsx`, and an agent reading ai-docs would write an import for them
      // that does not resolve. A name the entry re-exports but nothing documents
      // still gets its `null`, which is what lists it as undocumented.
      //
      // Fallback for a component whose public names cannot be read: a flat file
      // that exports inline (`export function Foo()`) rather than in a block at
      // the bottom. Publishing its internals is the lesser wrong against
      // publishing nothing at all.
      if (exported.length === 0) {
        Object.assign(allComponents, documented);
        console.warn(
          `  no export block found in ${path.basename(exports)} — documenting all of it`,
        );
        continue;
      }

      for (const name of exported) {
        allComponents[name] = documented[name] ?? null;
      }
    }
  }
  console.log(`\nFound ${totalComponents} components total\n`);

  const componentsWithDocs = {};
  const componentsWithoutDocs = {};
  /** @type {Record<string, string>} Maps an alias → the export it stands for ("Snackbar" → "Toaster") */
  const componentAliasMap = {};

  for (const [componentName, documentation] of Object.entries(allComponents)) {
    if (!documentation) {
      componentsWithoutDocs[componentName] = null;
      continue;
    }

    componentsWithDocs[componentName] = documentation;

    for (const alias of extractAliases(documentation)) {
      // A real export always wins: an alias that shadowed one would make the
      // component it shadows unreachable through the lookup.
      if (alias in allComponents) {
        console.warn(`  @alias ${alias} on ${componentName} is an exported name — ignored`);
        continue;
      }
      const claimed = componentAliasMap[alias];
      if (claimed && claimed !== componentName) {
        console.warn(
          `  @alias ${alias} claimed by ${claimed} and ${componentName} — keeping ${claimed}`,
        );
        continue;
      }
      componentAliasMap[alias] = componentName;
    }
  }

  console.log(`\nComponents without documentation (${Object.keys(componentsWithoutDocs).length}):`);
  for (const name of Object.keys(componentsWithoutDocs)) {
    console.log(`  ✗ ${name}`);
  }

  const resultDir = path.join(srcPath, "docs");
  fs.mkdirSync(resultDir, { recursive: true });

  // Embed the maps as reserved `__`-prefixed keys so consumers don't need a separate file
  const output = {
    __fileMap: componentFileMap,
    __levelMap: componentLevelMap,
    __aliasMap: componentAliasMap,
    ...allComponents,
  };

  const aiDocsPath = path.join(resultDir, "ai-docs.json");
  fs.writeFileSync(aiDocsPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`\nResult saved to file: ${aiDocsPath}`);

  return allComponents;
}

try {
  analyzeAllComponents();
} catch (error) {
  console.error("Error running script:", error.message);
  process.exit(1);
}
