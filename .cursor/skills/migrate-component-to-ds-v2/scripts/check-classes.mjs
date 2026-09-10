#!/usr/bin/env node
/**
 * Verify that Tailwind utility classes actually resolve against the built themes.
 *
 * Usage (from anywhere inside the repo):
 *   node .cursor/skills/migrate-component-to-ds-v2/scripts/check-classes.mjs \
 *     bg-background-brand-primary-container \
 *     'rounded-(--components-button-radius)'
 *
 * Exits 1 if any class fails to generate a rule, or if uikit-themes/dist is
 * stale relative to src (the most common cause of a "missing" token).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

function findRepoRoot(from) {
  let dir = path.resolve(from);
  for (;;) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error("Could not locate repo root (no pnpm-workspace.yaml found)");
    }
    dir = parent;
  }
}

function newestCssMtime(dir) {
  let newest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestCssMtime(full));
    else if (entry.name.endsWith(".css")) {
      newest = Math.max(newest, fs.statSync(full).mtimeMs);
    }
  }
  return newest;
}

/**
 * Locate a package directory on disk. Walks node_modules upward rather than
 * using require.resolve, because some packages gate ./package.json behind
 * their exports map.
 */
function findPackageDir(startDir, id) {
  let dir = path.resolve(startDir);
  for (;;) {
    const candidate = path.join(dir, "node_modules", id);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`Cannot locate package "${id}"`);
    dir = parent;
  }
}

function readPackageJson(pkgDir) {
  return JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
}

/** Resolve a CSS import, falling back to the package's declared style entry. */
function resolveCss(require_, id, base, fromDir) {
  if (id.startsWith(".")) return path.resolve(base, id);
  try {
    const direct = require_.resolve(id);
    if (direct.endsWith(".css")) return direct;
  } catch {
    // fall through to the package's style entry
  }
  const pkgDir = findPackageDir(fromDir, id);
  const pkg = readPackageJson(pkgDir);
  const entry = pkg.style ?? pkg.exports?.["."]?.style ?? pkg.main;
  if (!entry?.endsWith(".css")) {
    throw new Error(`Cannot resolve a CSS entry for "${id}"`);
  }
  return path.resolve(pkgDir, entry);
}

/** Mirror Tailwind's selector escaping so we can string-search the output. */
function escapeSelector(cls) {
  return cls.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

const classes = process.argv.slice(2);
if (classes.length === 0) {
  console.error("usage: check-classes.mjs <class> [<class> ...]");
  process.exit(2);
}

const repoRoot = findRepoRoot(process.cwd());
const storybookDir = path.join(repoRoot, "apps/storybook-web");
const cssPath = path.join(storybookDir, ".storybook/global.css");
const themesSrc = path.join(repoRoot, "packages/uikit-themes/src");
const themesDist = path.join(repoRoot, "packages/uikit-themes/dist");

// Resolve modules as if we were inside apps/storybook-web.
const require_ = createRequire(path.join(storybookDir, "package.json"));

let stale = false;
if (!fs.existsSync(themesDist)) {
  console.error("uikit-themes/dist is MISSING. Run: pnpm --filter @ui/themes build\n");
  stale = true;
} else if (newestCssMtime(themesSrc) > newestCssMtime(themesDist)) {
  console.error("uikit-themes/dist is STALE (src is newer). Run: pnpm --filter @ui/themes build\n");
  stale = true;
}

const twDir = findPackageDir(storybookDir, "tailwindcss");
const twEsm = readPackageJson(twDir).exports["."].import;
const { compile } = await import(pathToFileURL(path.resolve(twDir, twEsm)).href);

const compiler = await compile(fs.readFileSync(cssPath, "utf8"), {
  base: path.dirname(cssPath),
  loadStylesheet: async (id, base) => {
    const resolved = resolveCss(require_, id, base, storybookDir);
    return {
      path: resolved,
      base: path.dirname(resolved),
      content: fs.readFileSync(resolved, "utf8"),
    };
  },
});

const out = compiler.build(classes);
let missing = 0;

for (const cls of classes) {
  const selector = `.${escapeSelector(cls)}`;
  const at = out.indexOf(`${selector} {`);
  if (at === -1) {
    console.log(`MISSING  ${cls}`);
    missing++;
    continue;
  }
  const body = out.slice(out.indexOf("{", at) + 1, out.indexOf("}", at));
  console.log(`OK       ${cls}  ->  ${body.trim().replace(/\s+/g, " ")}`);
}

if (missing > 0) {
  console.error(
    `\n${missing} class(es) did not generate. Confirm the token is bridged in ` +
      `packages/uikit-themes/src/foundation/config.css (@theme inline) and has a ` +
      `value in packages/uikit-themes/src/static/<brand>.css.`,
  );
}

process.exit(missing > 0 || stale ? 1 : 0);
