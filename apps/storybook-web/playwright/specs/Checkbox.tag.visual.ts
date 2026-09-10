import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "checkbox--all-states" }];

test.describe("Tag Checkbox Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Checkbox ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Checkbox", story.name, story.id, theme);
      });
    }
  }
});
