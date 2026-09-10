#!/usr/bin/env node

/**
 * Script to show the latest tag-based Playwright report
 * Usage: node show-latest-report.js [--tag=<tag-name>]
 * If no tag specified, shows the most recent report from all tags
 */

import { spawn } from "child_process";
import { promises as fs } from "fs";
import net from "net";
import path from "path";

const REPORTS_DIR = "playwright/reports";

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  let tag = "prod";

  for (const arg of args) {
    if (arg.startsWith("--tag=")) {
      tag = arg.split("=")[1];
    } else if (arg === "--tag" && args[args.indexOf(arg) + 1]) {
      tag = args[args.indexOf(arg) + 1];
    }
  }

  return { tag };
}

/**
 * Check if directory exists
 */
async function dirExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get the latest report directory based on timestamp, optionally filtered by tag
 */
async function getLatestReport(filterTag = null) {
  const reportsPath = path.join(process.cwd(), REPORTS_DIR);

  if (!(await dirExists(reportsPath))) {
    console.error(`❌ Reports directory not found: ${reportsPath}`);
    process.exit(1);
  }

  const reportDirs = await fs.readdir(reportsPath);

  if (reportDirs.length === 0) {
    console.error("❌ No reports found in reports directory");
    process.exit(1);
  }

  // A run directory is `<tag>-<timestamp>`, and both halves have to match, not
  // just the prefix.
  //
  // `startsWith("prod-")` also accepted `prod-local-verify` — a different tag
  // that happens to begin with the same word. Worse, the list was then ordered
  // alphabetically, and "l" sorts after "2", so that directory beat every
  // `prod-2026-…` and `pnpm visual:report` opened a run from three days earlier:
  // 44 failures from a suite that had since been fixed, with nothing on screen
  // to say the report was stale.
  //
  // Requiring the timestamp shape fixes the matching and makes the ordering
  // honest at the same time — these sort chronologically because every field is
  // zero-padded and ordered coarse to fine.
  const TIMESTAMP = String.raw`\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}`;
  const escapedTag = filterTag?.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const runDir = new RegExp(`^${escapedTag ?? ".+"}-${TIMESTAMP}$`);

  const validReports = [];
  for (const dir of reportDirs) {
    if (!runDir.test(dir)) continue;
    if (!(await dirExists(path.join(reportsPath, dir)))) continue;

    // A run killed part-way leaves `test-results/` but never gets an HTML
    // report written. Opening one shows an empty page rather than an error.
    if (!(await dirExists(path.join(reportsPath, dir, "playwright-report")))) continue;

    validReports.push(dir);
  }

  if (validReports.length === 0) {
    if (filterTag) {
      console.error(`❌ No reports found for tag "${filterTag}"`);
      console.log(`💡 Available reports:`);

      // Show available tags
      const allReports = [];
      for (const dir of reportDirs) {
        const dirPath = path.join(reportsPath, dir);
        if (await dirExists(dirPath)) {
          allReports.push(dir);
        }
      }

      if (allReports.length > 0) {
        const availableTags = [...new Set(allReports.map((report) => report.split("-")[0]))];
        availableTags.forEach((tag) => {
          console.log(`   • ${tag}`);
        });
      } else {
        console.log("   (no reports available)");
      }
    } else {
      console.error("❌ No valid report directories found");
    }
    process.exit(1);
  }

  // Sort by directory name (which includes timestamp) - latest first
  validReports.sort().reverse();

  return validReports[0];
}

/**
 * Check if port is available
 */
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, () => {
      server.once("close", () => {
        resolve(true);
      });
      server.close();
    });

    server.on("error", () => {
      resolve(false);
    });
  });
}

/**
 * Find an available port starting from the given port
 */
async function findAvailablePort(startPort = 9323) {
  let port = startPort;
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }

  throw new Error(
    `No available port found after ${maxAttempts} attempts starting from ${startPort}`,
  );
}

/**
 * Show the latest report
 */
async function showLatestReport() {
  try {
    const { tag } = parseArguments();

    console.log(`🔍 Looking for reports${tag ? ` for tag "${tag}"` : " (all tags)"}...`);

    const latestReport = await getLatestReport(tag);
    const reportPath = path.join(REPORTS_DIR, latestReport, "playwright-report");

    console.log(`📊 Opening latest report: ${latestReport}`);
    console.log(`📁 Report path: ${reportPath}`);

    // Find an available port
    const port = await findAvailablePort();
    console.log(`🌐 Starting Playwright report server on port ${port}...`);

    const playwrightProcess = spawn(
      "npx",
      ["playwright", "show-report", reportPath, "--port", port.toString()],
      {
        stdio: "inherit",
      },
    );

    playwrightProcess.on("error", (error) => {
      console.error(`❌ Error starting report server: ${error.message}`);
      process.exit(1);
    });

    playwrightProcess.on("close", (code) => {
      if (code !== 0) {
        console.log(`Report server exited with code ${code}`);
      }
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
showLatestReport();
