import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "sheet--default" }];

test.describe("Tag Sheet Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Sheet ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Sheet", story.name, story.id, theme, {
          capture: "viewport",
          interaction: "click",
        });
      });
    }
  }
});
