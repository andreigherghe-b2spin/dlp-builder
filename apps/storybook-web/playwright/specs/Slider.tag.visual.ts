import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "slider--default" }];

test.describe("Tag Slider Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Slider ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Slider", story.name, story.id, theme);
      });
    }
  }
});
