import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "accordion--default" }];

test.describe("Tag Accordion Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Accordion ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Accordion", story.name, story.id, theme);
      });
    }
  }
});
