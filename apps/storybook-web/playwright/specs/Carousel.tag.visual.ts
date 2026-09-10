import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "carousel--all-states" }];

test.describe("Tag Carousel Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Carousel ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Carousel", story.name, story.id, theme);
      });
    }
  }
});
