import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "switch--all-states" }];

test.describe("Tag Switch Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Switch ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Switch", story.name, story.id, theme);
      });
    }
  }
});
