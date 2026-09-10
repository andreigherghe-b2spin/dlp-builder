import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Get tag from command line arguments or environment variable
function getTag(): string {
  const args = process.argv;
  const tagIndex = args.findIndex((arg) => arg === "--tag" || arg === "-t");

  if (tagIndex >= 0 && args[tagIndex + 1]) {
    return args[tagIndex + 1];
  }

  // Alternative syntax: --tag=value
  const tagArg = args.find((arg) => arg.startsWith("--tag="));
  if (tagArg) {
    return tagArg.split("=")[1];
  }

  // Environment variable fallback
  if (process.env.TAG) {
    return process.env.TAG;
  }

  throw new Error("TAG is required. Use --tag=<tag> or set TAG environment variable");
}

const tag = getTag();
const timestamp =
  process.env.TIMESTAMP ||
  new Date().toISOString().replace(/T/, "-").replace(/:/g, "-").split(".")[0];

/**
 * Tests run against the Storybook dev server — the same `pnpm dev` you already
 * have open. That means no build step before a run, and a Storybook already
 * running gets reused instead of a second one being started.
 *
 * What the dev server adds over a production build is the HMR client and
 * unminified modules, neither of which paints a pixel, so the screenshots are
 * the same either way.
 */
const port = Number(process.env.PW_STORYBOOK_PORT ?? 6006);
const baseURL = process.env.PW_STORYBOOK_URL ?? `http://127.0.0.1:${port}`;

/**
 * Playwright configuration for tag-based snapshot regression testing.
 * Uses Playwright's built-in reporting and comparison features.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./specs",
  testMatch: "**/*.tag.visual.{ts,js}",

  /* Output directory for test results */
  outputDir: `./reports/${tag}-${timestamp}/test-results`,

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only.
   *
   * `retries` counts attempts *after* the first, so 1 means two runs of a failing
   * test. That is what a flake needs — it either reproduces or it does not — while
   * the old 2 meant three runs, so a genuinely red suite cost triple the wall
   * clock and printed triple the result lines with no new information. One red CI
   * run of 70 tests produced 210 of them.
   */
  retries: process.env.CI ? 1 : 0,

  /* Workers do not affect the pixels, only how fast we get to them. */
  workers: Number(process.env.PW_WORKERS ?? (process.env.CI ? 4 : 14)),

  /* Use Playwright's built-in HTML reporter with rich visual comparison */
  reporter: [
    [
      "html",
      {
        outputFolder: `./reports/${tag}-${timestamp}/playwright-report`,
        open: "never",
      },
    ],
    [
      "json",
      {
        outputFile: `./reports/${tag}-${timestamp}/test-results.json`,
      },
    ],
    ["list"],
  ],

  /* Shared settings for all the projects below */
  use: {
    baseURL,

    /* Collect trace when retrying the failed test - useful for debugging differences */
    trace: "retain-on-failure",

    /* Take screenshots on failure to capture the actual vs expected */
    screenshot: "only-on-failure",
  },

  /* Configure Playwright's built-in visual comparison */
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
    toMatchSnapshot: { maxDiffPixels: 20 },
  },

  /* Custom snapshot path template - organize by tag and component */
  snapshotPathTemplate: `snapshots/${tag}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}`,

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium-tag",
      use: {
        ...devices["Desktop Chrome"],
        // Pinned rather than inherited: `devices` supplies a viewport, but the
        // scale factor and colour scheme are what decide how many pixels a
        // glyph gets, and a baseline is only comparable to a run that made the
        // same choices.
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        colorScheme: "light",
        // The themes are brand palettes, not locales, but the browser still
        // picks number and date formats from these — Calendar renders them.
        locale: "en-US",
        timezoneId: "UTC",
        // Take the host platform out of text rendering, so one baseline can serve
        // both a developer's macOS and the Linux CI runner.
        //
        // The problem these solve is not colour, it is *metrics*: a macOS-taken
        // baseline failed on ubuntu with "expected 774px by 72px, received 776px
        // by 72px", and Playwright refuses to compare pixels at all once the sizes
        // disagree, so no threshold can absorb it. Hinting is what snaps a glyph's
        // advance width to whole pixels, and each platform snaps differently;
        // turning it off makes the advances come from the font's own metrics
        // instead, which are the same everywhere.
        //
        // The cost is text that looks very slightly softer than the browser would
        // draw it for a human. That is the right trade for a screenshot whose only
        // job is to be compared with another screenshot.
        launchOptions: {
          args: [
            "--font-render-hinting=none",
            "--disable-font-subpixel-positioning",
            "--disable-lcd-text",
          ],
        },
      },
    },
  ],

  /* Start Storybook, or reuse the one you already have open on 6006. */
  webServer: {
    command: "pnpm dev",
    // Playwright runs this from the config's own directory; `pnpm dev` belongs
    // to the package root.
    cwd: path.resolve(import.meta.dirname, ".."),
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
