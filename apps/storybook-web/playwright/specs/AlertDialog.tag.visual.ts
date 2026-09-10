import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "alertdialog--default" }];

test.describe("Tag AlertDialog Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`AlertDialog ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "AlertDialog", story.name, story.id, theme, {
          capture: "viewport",
          interaction: "click",
        });
      });
    }
  }
});
