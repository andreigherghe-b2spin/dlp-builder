import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "avatar--default" }];

test.describe("Tag Avatar Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Avatar ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Avatar", story.name, story.id, theme);
      });
    }
  }
});
