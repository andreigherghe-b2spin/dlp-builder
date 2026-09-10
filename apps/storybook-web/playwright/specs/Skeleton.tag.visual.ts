import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

/**
 * `AllVariants` is the combined sheet and the only story photographed — Figma's
 * three compositions over both grounds, with `animate-pulse` off. The animation
 * has no resting frame, so a baseline of any other story would be a picture of
 * whichever point of the fade the shutter caught.
 */
const stories = [{ name: "AllVariants", id: "skeleton--all-variants" }];

test.describe("Tag Skeleton Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Skeleton ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Skeleton", story.name, story.id, theme);
      });
    }
  }
});
