import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "collapsible--all-states" }];

test.describe("Tag Collapsible Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Collapsible ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Collapsible", story.name, story.id, theme);
      });
    }
  }
});
