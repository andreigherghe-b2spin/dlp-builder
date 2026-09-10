import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "dialog--default" }];

test.describe("Tag Dialog Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Dialog ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Dialog", story.name, story.id, theme, {
          capture: "viewport",
        });
      });
    }
  }
});
