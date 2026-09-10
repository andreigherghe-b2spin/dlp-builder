import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "textfield--all-states" }];

test.describe("Tag TextField Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`TextField ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "TextField", story.name, story.id, theme);
      });
    }
  }
});
