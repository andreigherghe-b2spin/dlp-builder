import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "alert--default" }];

test.describe("Tag Alert Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Alert ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Alert", story.name, story.id, theme);
      });
    }
  }
});
