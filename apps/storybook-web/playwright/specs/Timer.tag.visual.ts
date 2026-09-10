import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllVariants", id: "timer--all-variants" }];

test.describe("Tag Timer Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Timer ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Timer", story.name, story.id, theme);
      });
    }
  }
});
