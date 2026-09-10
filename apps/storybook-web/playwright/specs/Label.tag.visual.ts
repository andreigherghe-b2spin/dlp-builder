import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "label--all-states" }];

test.describe("Tag Label Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Label ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Label", story.name, story.id, theme);
      });
    }
  }
});
