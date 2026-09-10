import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "textarea--all-states" }];

test.describe("Tag Textarea Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Textarea ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Textarea", story.name, story.id, theme);
      });
    }
  }
});
