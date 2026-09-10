import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "card--default" }];

test.describe("Tag Card Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Card ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Card", story.name, story.id, theme);
      });
    }
  }
});
