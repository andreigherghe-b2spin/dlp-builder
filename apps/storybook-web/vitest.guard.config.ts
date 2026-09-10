import { defineConfig } from "vitest/config";

// Separate from vite.config.ts's browser-mode Storybook interaction tests
// (which require a Playwright-driven browser). These guard tests are plain
// Node assertions over story file metadata, so they get their own fast,
// dependency-free config.
export default defineConfig({
  test: {
    name: "guard",
    environment: "node",
    include: ["guards/**/*.test.ts"],
  },
});
