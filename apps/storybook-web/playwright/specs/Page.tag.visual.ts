import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "page--all-states" }];

test.describe("Tag Page Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Page ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Page", story.name, story.id, theme);
      });
    }
  }
});
