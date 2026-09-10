#!/usr/bin/env node
// Watches packages/uikit-web and packages/uikit-themes, rebuilds them in a
// fast dev mode, and delta-syncs their dist/ into a consuming brand repo's
// root node_modules/@ui/* so local edits show up in `pnpm local:<brand>`
// without publishing. See CLAUDE.md for the full workflow.

import { parseArgs } from "node:util";
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  renameSync,
  rmSync,
  utimesSync,
  watch,
} from "node:fs";
import { resolve, join, dirname, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webDir = join(repoRoot, "packages/uikit-web");
const themesDir = join(repoRoot, "packages/uikit-themes");

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    dts: { type: "boolean", default: false },
    once: { type: "boolean", default: false },
    touch: { type: "string" },
    verbose: { type: "boolean", default: false },
  },
});

const targetDir = resolve(positionals[0] ?? resolve(repoRoot, "..", "ui-b2spin-monorepo"));
const targetNodeModules = join(targetDir, "node_modules");

const log = (...args) => console.log("[dev-link]", ...args);
const verbose = (...args) => {
  if (values.verbose) console.log("[dev-link:v]", ...args);
};

// ---------------------------------------------------------------------------
// Preflight
// ---------------------------------------------------------------------------

function preflight() {
  if (!existsSync(targetDir)) {
    console.error(`Target repo not found: ${targetDir}`);
    console.error(
      "Pass the brand repo path as an argument, e.g. pnpm dev:web:link ../ui-b2spin-monorepo",
    );
    process.exit(1);
  }

  for (const pkg of ["web", "themes"]) {
    const pkgJsonPath = join(targetNodeModules, "@ui", pkg, "package.json");
    if (!existsSync(pkgJsonPath)) {
      console.error(`${pkgJsonPath} not found.`);
      console.error("Run the install command in the brand repo first (e.g. npm run install-deps).");
      process.exit(1);
    }
  }

  const localWebVersion = readJson(join(webDir, "package.json")).version;
  const installedWebVersion = readJson(join(targetNodeModules, "@ui/web/package.json")).version;
  if (localWebVersion !== installedWebVersion) {
    log(
      `warning: local @ui/web is v${localWebVersion}, brand repo has v${installedWebVersion} installed — that's fine for dev-link, just don't be surprised by other version-specific behavior.`,
    );
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

// ---------------------------------------------------------------------------
// Process running
// ---------------------------------------------------------------------------

function run(cmd, args, cwd, env) {
  return new Promise((resolvePromise) => {
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: values.verbose ? "inherit" : "pipe",
    });
    let output = "";
    if (!values.verbose) {
      child.stdout?.on("data", (d) => (output += d));
      child.stderr?.on("data", (d) => (output += d));
    }
    child.on("close", (code) => {
      if (code !== 0 && !values.verbose) console.error(output);
      resolvePromise(code ?? 1);
    });
  });
}

// ---------------------------------------------------------------------------
// Delta sync
// ---------------------------------------------------------------------------

function walkFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        stack.push(full);
      } else {
        files.push(full);
      }
    }
  }
  return files;
}

const tmpDir = join(targetNodeModules, ".uikit-dev-link-tmp");
let tmpCounter = 0;

// Stages the copy outside the destination package dir (still same
// filesystem, so the rename stays atomic) so brief .tmp files never appear
// inside directories the brand app's bundler/CSS scanner is watching.
function copyFileAtomic(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  mkdirSync(tmpDir, { recursive: true });
  const tmp = join(tmpDir, `${basename(dest)}.${process.pid}.${tmpCounter++}`);
  copyFileSync(src, tmp);
  renameSync(tmp, dest);
}

function filesEqual(srcFile, srcStat, destFile, destStat) {
  if (srcStat.size !== destStat.size) return false;
  return readFileSync(srcFile).equals(readFileSync(destFile));
}

// Copies changed/new files first, then deletes files that no longer exist
// locally. Never deletes before copying, so the consumer never sees a
// missing module — worst case is a few stale extra chunks for a moment.
// Files are compared by content, not mtime, so a rebuild that reproduces
// identical bytes (the common case for unrelated entries) is a no-op —
// the consumer's dev server never sees those files change.
function syncDir(srcDir, destDir) {
  let copied = 0;
  let deleted = 0;

  const srcFiles = walkFiles(srcDir);
  const srcRelSet = new Set(srcFiles.map((f) => relative(srcDir, f)));

  for (const srcFile of srcFiles) {
    const rel = relative(srcDir, srcFile);
    const destFile = join(destDir, rel);
    const srcStat = statSync(srcFile);
    const destStat = existsSync(destFile) ? statSync(destFile) : null;
    if (!destStat || !filesEqual(srcFile, srcStat, destFile, destStat)) {
      copyFileAtomic(srcFile, destFile);
      copied++;
    }
  }

  for (const destFile of walkFiles(destDir)) {
    const rel = relative(destDir, destFile);
    if (!srcRelSet.has(rel)) {
      rmSync(destFile, { force: true });
      deleted++;
    }
  }

  return { copied, deleted };
}

function syncPackage(pkg) {
  const localDir = pkg === "web" ? webDir : themesDir;
  const destDir = join(targetNodeModules, "@ui", pkg);

  const { copied, deleted } = syncDir(join(localDir, "dist"), join(destDir, "dist"));

  const pkgJsonSrc = join(localDir, "package.json");
  const pkgJsonDest = join(destDir, "package.json");
  const pkgJsonDestStat = existsSync(pkgJsonDest) ? statSync(pkgJsonDest) : null;
  let pkgJsonChanged = false;
  if (
    !pkgJsonDestStat ||
    !filesEqual(pkgJsonSrc, statSync(pkgJsonSrc), pkgJsonDest, pkgJsonDestStat)
  ) {
    copyFileAtomic(pkgJsonSrc, pkgJsonDest);
    pkgJsonChanged = true;
  }

  const markerPath = join(destDir, ".uikit-dev-link");
  if (!existsSync(markerPath)) {
    writeFileSync(markerPath, JSON.stringify({ source: localDir, syncedAt: Date.now() }, null, 2));
  }

  if (copied || deleted || pkgJsonChanged) {
    log(`@ui/${pkg}: synced (${copied} copied, ${deleted} deleted)`);
  }

  if (values.touch && (copied || deleted || pkgJsonChanged)) {
    try {
      const touchPath = resolve(targetDir, values.touch);
      const now = new Date();
      utimesSync(touchPath, now, now);
      verbose(`touched ${touchPath}`);
    } catch (err) {
      verbose(`touch failed: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Builds
// ---------------------------------------------------------------------------

async function buildWebFull() {
  log("building @ui/web (full)...");
  return run("pnpm", ["build"], webDir, { UIKIT_NO_SPLIT: "1" });
}

async function buildWebFast() {
  verbose("building @ui/web (fast)...");
  return run("pnpm", ["exec", "tsup"], webDir, {
    UIKIT_DEV_LINK: values.dts ? "0" : "1",
    UIKIT_NO_SPLIT: "1",
  });
}

async function buildThemes() {
  verbose("building @ui/themes...");
  return run("pnpm", ["build"], themesDir);
}

// ---------------------------------------------------------------------------
// Watch
// ---------------------------------------------------------------------------

function watchSrc(srcDir, onChange) {
  let building = false;
  let pending = false;
  let timer = null;

  const trigger = () => {
    if (building) {
      pending = true;
      return;
    }
    building = true;
    onChange().finally(() => {
      building = false;
      if (pending) {
        pending = false;
        trigger();
      }
    });
  };

  const debounced = () => {
    clearTimeout(timer);
    timer = setTimeout(trigger, 200);
  };

  watch(srcDir, { recursive: true }, () => debounced());
}

// ---------------------------------------------------------------------------
// Install-clobber detection
// ---------------------------------------------------------------------------

function markerExists(pkg) {
  return existsSync(join(targetNodeModules, "@ui", pkg, ".uikit-dev-link"));
}

function startInstallWatch() {
  setInterval(() => {
    if (!markerExists("web") || !markerExists("themes")) {
      log("brand repo install detected — re-syncing");
      syncPackage("web");
      syncPackage("themes");
    }
  }, 5000);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  preflight();

  // Clear any tmp files left behind by a previous crashed run.
  rmSync(tmpDir, { recursive: true, force: true });

  log(`target: ${targetDir}`);
  log("running initial full build...");

  const [webCode, themesCode] = await Promise.all([buildWebFull(), buildThemes()]);
  if (webCode !== 0 || themesCode !== 0) {
    console.error("Initial build failed — fix errors above and re-run.");
    process.exit(1);
  }

  syncPackage("web");
  syncPackage("themes");
  log("initial sync complete.");

  if (values.once) return;

  watchSrc(join(webDir, "src"), async () => {
    const code = await buildWebFast();
    if (code !== 0) {
      console.error("@ui/web build failed — skipping sync.");
      return;
    }
    syncPackage("web");
  });

  watchSrc(join(themesDir, "src"), async () => {
    const code = await buildThemes();
    if (code !== 0) {
      console.error("@ui/themes build failed — skipping sync.");
      return;
    }
    syncPackage("themes");
  });

  startInstallWatch();

  log("watching for changes. Press Ctrl+C to stop.");

  process.on("SIGINT", () => {
    log("stopping.");
    log(
      "The brand repo's node_modules/@ui/* still contains local dev builds — run its install command (e.g. npm run install-deps) to restore registry versions.",
    );
    process.exit(0);
  });
}

main();
