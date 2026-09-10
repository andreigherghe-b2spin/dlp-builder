import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    exclude: ["**/node_modules/**", "**/dist/**"],
    // One run produces the results and the percentages. `test` is
    // `vitest run --coverage`, so there is no second command that could report on
    // a different commit than the tests it claims to describe, and no way to have
    // green tests with a coverage gate nobody ran.
    //
    // Coverage is configured here rather than per project on purpose: Vitest
    // accepts it at the root only, and merges what the node and browser projects
    // each recorded into one report.
    coverage: {
      provider: "v8",
      // Explicit, because the default is "files some test imported" — under which
      // a `lib/` with no test at all is absent from the report rather than at 0%,
      // and the gate below passes by having nothing to measure.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/docs/**"],
      reportsDirectory: "./coverage",
      // `text` prints a per-file and per-directory table wherever this ran, and on
      // a missed threshold Vitest names the gated number itself. `html` is what CI
      // uploads for anyone who wants to click through the uncovered lines. Nothing
      // else reads a report, so nothing else is written.
      reporter: ["text", "html"],
      // A failing run still writes the report, so CI posts the numbers for the
      // commit that failed instead of silently showing the last green one.
      reportOnFailure: true,
      thresholds: {
        // A component's `lib/` is where its logic lives once it is big enough to
        // have any — the step arithmetic, the wheel normalisation, the option
        // resolvers. Those are plain functions with real branches, so a number
        // means something here, and 85% leaves room for the branch that only a
        // broken browser takes.
        //
        // Deliberately no global threshold. A component's own coverage is a
        // percentage over JSX, which mostly reports how many CVA branches a test
        // happened to render — three other suites cover components better than a
        // number would.
        "**/lib/**": { lines: 85, functions: 85, branches: 85, statements: 85 },
      },
    },
    // Two runtimes, split by extension. A `.ts` test calls a function and runs in
    // node; a `.tsx` test mounts a component and runs in a real browser, because
    // the components under test are laid out by CSS and measured by Embla — a
    // simulated DOM has neither, and a carousel with no measurements has no
    // behaviour left to test.
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["**/*.test.ts"],
          exclude: ["**/node_modules/**", "**/dist/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["**/*.test.tsx"],
          exclude: ["**/node_modules/**", "**/dist/**"],
          setupFiles: ["./vitest.setup.ts"],
          // Autoplay is asserted by waiting for the slide to actually change, so
          // these tests spend real seconds rather than milliseconds.
          testTimeout: 20_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
            // Big enough that a carousel is fully on screen: autoplay refuses to
            // run off screen, which would otherwise look like a broken timer.
            viewport: { width: 900, height: 700 },
            // No screenshot on a failing test. The runner takes one by default and
            // leaves it in `__screenshots__/` beside the test, with a copy in
            // `.vitest-attachments/` — a second set of images in a repo where every
            // screenshot belongs to the Playwright visual suite. The failure message
            // already says which slide was where, which is what these tests are
            // about; a picture of an unstyled carousel adds nothing to it.
            screenshotFailures: false,
          },
        },
      },
    ],
  },
  // The same `@/` the components import themselves with. Without it a test can
  // only reach files that happen to have no internal imports.
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
});
