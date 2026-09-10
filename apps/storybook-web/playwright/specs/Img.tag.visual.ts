import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "img--all-states" }];

test.describe("Tag Img Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Img ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Img", story.name, story.id, theme);
      });
    }
  }
});
