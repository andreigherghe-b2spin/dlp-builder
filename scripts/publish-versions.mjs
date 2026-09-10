#!/usr/bin/env node
/**
 * Script to publish package versions using changesets
 *
 * Usage:
 * pnpm publish-versions
 *
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

try {
  console.log("Pulling latest changes...");
  await execAsync("git pull");

  console.log("Installing dependencies...");

  // todo [tech_high] add dynamic build ( changed packages only )
  console.log("Build packages ...");
  await execAsync("pnpm build");

  console.log("Publishing package versions...");
  await execAsync("pnpm changeset publish");

  console.log("Successfully published package versions");
} catch (error) {
  console.error("Error publishing package versions:", error);
  process.exit(1);
}
