import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [
  { name: "VariantsGroup", id: "button--variants-group" },
  { name: "SizesGroup", id: "button--sizes-group" },
];

test.describe("Tag Button Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Button ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Button", story.name, story.id, theme);
      });
    }
  }
});
