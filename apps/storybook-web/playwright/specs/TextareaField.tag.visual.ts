import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "textareafield--all-states" }];

test.describe("Tag TextareaField Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`TextareaField ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "TextareaField", story.name, story.id, theme);
      });
    }
  }
});
