import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "pagination--all-states" }];

test.describe("Tag Pagination Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Pagination ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Pagination", story.name, story.id, theme);
      });
    }
  }
});
