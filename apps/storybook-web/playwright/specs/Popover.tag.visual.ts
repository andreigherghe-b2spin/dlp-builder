import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "popover--default" }];

test.describe("Tag Popover Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Popover ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Popover", story.name, story.id, theme, {
          capture: "viewport",
          interaction: "click",
        });
      });
    }
  }
});
