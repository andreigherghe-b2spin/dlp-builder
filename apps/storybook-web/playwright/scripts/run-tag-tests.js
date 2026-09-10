#!/usr/bin/env node

/**
 * Wrapper script to run tag-based Playwright tests
 *
 * This script parses the --tag argument and passes it to Playwright
 * via environment variables, then runs the appropriate Playwright command.
 */

import { spawn } from "child_process";
import { readdirSync, rmSync, statSync } from "fs";
import { join } from "path";

/**
 * The shared baseline, committed under `playwright/snapshots/prod/`, and the tag
 * every command uses unless told otherwise.
 *
 * Sharing it is an experiment: a screenshot carries the font rasterisation of
 * the machine that took it, and macOS and Linux disagree about hinting and
 * subpixel placement, so a set taken on one would be red on the other. Between
 * two Macs on the same major version there should be nothing left to disagree
 * about — Playwright brings its own Chromium, the fonts are bundled, and the
 * scale factor is pinned — but that is a prediction, not a measurement.
 *
 * If it turns out not to hold, the fix is not per-developer baselines; it is to
 * take the screenshots in one fixed place (a container, or one designated
 * machine). Use `--tag=<anything>` for a scratch set in the meantime — those
 * stay gitignored.
 */
const DEFAULT_TAG = "prod";

/**
 * The tag becomes a directory name under `playwright/snapshots/`, so it has to
 * be one path segment. `--tag=../prod` would otherwise write a scratch set over
 * the shared baseline, and `--tag=` would write to `snapshots//`.
 */
const VALID_TAG = /^[a-zA-Z0-9._-]+$/;

/**
 * Split our own `--tag` off the arguments, and hand the rest to Playwright
 * untouched so `--grep`, `-u`, `--ui` and a list of spec files all still work.
 *
 * One pass, one source of truth. Reading argv twice — once for the tag, once for
 * the passthrough — is how the two came to disagree: `--tag ""` was dropped by
 * the filter but read as "absent" by the parser, so an explicitly empty tag
 * silently ran against the shared baseline.
 *
 * `provided` distinguishes "no --tag, use the default" from "--tag with nothing
 * after it", which is a typo and should say so rather than pick a directory on
 * the user's behalf.
 */
function parseArgs(argv) {
  const passthrough = [];
  let tag = DEFAULT_TAG;
  let provided = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--tag" || arg === "-t") {
      provided = true;
      tag = argv[i + 1] ?? "";
      i++; // its value is ours, not Playwright's
      continue;
    }

    if (arg.startsWith("--tag=")) {
      provided = true;
      tag = arg.slice("--tag=".length);
      continue;
    }

    passthrough.push(arg);
  }

  return { tag, provided, passthrough };
}

/**
 * How many runs of a tag survive. Each keeps its HTML report, and for anything
 * that failed also the actual/expected/diff PNGs and a trace — so a run costs
 * tens of megabytes and a long-lived checkout reaches gigabytes without anyone
 * noticing. Five is enough to compare against yesterday and still bounded.
 */
const KEEP_REPORTS = 5;

const REPORTS_DIR = "playwright/reports";

/**
 * A run directory is `<tag>-<timestamp>`. Both halves have to match: prefix
 * matching alone would let `prod` sweep away `prod-local-verify`, which is a
 * different tag, and the timestamp shape is also what makes the ordering honest —
 * every field is zero-padded and coarse-to-fine, so these sort chronologically.
 * Same reasoning as `show-latest-report.js`, which had the prefix bug first.
 */
const RUN_DIR = /^(.+)-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/;

/**
 * Delete all but the newest runs of this tag, leaving room for the one about to
 * start so the directory settles at KEEP_REPORTS rather than one above it.
 *
 * Only this tag is touched. Another tag's runs belong to whoever made them, and
 * a scratch set is often exactly what someone is in the middle of comparing.
 */
function pruneOldReports(tag) {
  let entries;
  try {
    entries = readdirSync(join(process.cwd(), REPORTS_DIR));
  } catch {
    return; // nothing has run here yet
  }

  const mine = entries
    .filter((name) => RUN_DIR.exec(name)?.[1] === tag)
    .filter((name) => {
      try {
        return statSync(join(process.cwd(), REPORTS_DIR, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort()
    .reverse();

  const stale = mine.slice(Math.max(KEEP_REPORTS - 1, 0));
  if (stale.length === 0) return;

  for (const name of stale) {
    // A report is disposable output, so a failure to remove one is not worth
    // aborting the test run over — say so and carry on.
    try {
      rmSync(join(process.cwd(), REPORTS_DIR, name), { recursive: true, force: true });
    } catch (error) {
      console.warn(`⚠️  Could not remove ${REPORTS_DIR}/${name}: ${error.message}`);
    }
  }

  console.log(`🧹 Removed ${stale.length} old "${tag}" report(s), keeping ${KEEP_REPORTS - 1}.`);
}

/**
 * Main execution
 */
function main() {
  const { tag, provided, passthrough } = parseArgs(process.argv.slice(2));

  if (provided && !VALID_TAG.test(tag)) {
    console.error(tag ? `❌ Invalid tag: "${tag}"` : "❌ --tag was given with no value.");
    console.error("");
    console.error("   A tag names one directory under playwright/snapshots/, so it takes");
    console.error("   letters, digits, dot, dash and underscore — nothing else.");
    console.error("");
    console.error("   Omit --tag entirely to use the shared baseline:");
    console.error("     pnpm visual");
    console.error("   Or name a scratch set of your own:");
    console.error(`     pnpm visual --tag=${process.env.USER ?? "wip"}`);
    process.exit(1);
  }

  const playwrightArgs = passthrough;

  // `pnpm exec playwright` runs the bin from the `playwright` package, while the
  // specs `import { test } from "@playwright/test"`. Those are two packages, and
  // if they ever resolve to different versions the runner and the specs each get
  // their own copy of the module — which reports itself as "Playwright Test did
  // not expect test.describe() to be called here", naming neither package nor
  // version. Both are pinned to the same exact version in package.json; bump
  // them together.
  const command = "pnpm";
  const args = [
    "exec",
    "playwright",
    "test",
    "--config=playwright/playwright.tag.config.ts",
    ...playwrightArgs,
  ];

  // Generate timestamp once for the entire test run
  const timestamp = new Date().toISOString().replace(/T/, "-").replace(/:/g, "-").split(".")[0];

  pruneOldReports(tag);

  console.log(`🏷️  Running tag-based tests for: ${tag}`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`📋 Command: ${command} ${args.join(" ")}`);
  console.log("");

  // Set environment variables for the tag and timestamp
  const env = {
    ...process.env,
    TAG: tag,
    TIMESTAMP: timestamp,
  };

  // Spawn the Playwright process
  const child = spawn(command, args, {
    stdio: "inherit",
    env: env,
    shell: process.platform === "win32",
  });

  // A run killed by a signal — Ctrl-C, or the OOM killer — reports `code: null`.
  // Passing that through as `code || 0` would exit 0 and call an interrupted run
  // a pass.
  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`\n❌ Playwright was terminated by ${signal}.`);
      process.exit(1);
    }
    process.exit(code ?? 1);
  });

  // Handle errors
  child.on("error", (err) => {
    console.error("❌ Error running Playwright:", err.message);
    process.exit(1);
  });
}

main();
