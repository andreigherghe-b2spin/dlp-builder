import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "calendar--default" }];

test.describe("Tag Calendar Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Calendar ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Calendar", story.name, story.id, theme);
      });
    }
  }
});
