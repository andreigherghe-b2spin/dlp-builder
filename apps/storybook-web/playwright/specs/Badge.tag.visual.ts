import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllVariants", id: "badge--all-variants" }];

test.describe("Tag Badge Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Badge ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Badge", story.name, story.id, theme);
      });
    }
  }
});
