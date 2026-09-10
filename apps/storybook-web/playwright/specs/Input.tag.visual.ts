import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [
  { name: "AllStates", id: "input--all-states" },
  { name: "WithAdornments", id: "input--with-adornments" },
];

test.describe("Tag Input Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Input ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Input", story.name, story.id, theme);
      });
    }
  }
});
