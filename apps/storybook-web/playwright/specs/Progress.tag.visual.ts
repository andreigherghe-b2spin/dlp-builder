import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "progress--all-states" }];

test.describe("Tag Progress Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Progress ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Progress", story.name, story.id, theme);
      });
    }
  }
});
