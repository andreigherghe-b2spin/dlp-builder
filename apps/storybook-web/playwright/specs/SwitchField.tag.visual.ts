import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "switchfield--all-states" }];

test.describe("Tag SwitchField Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`SwitchField ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "SwitchField", story.name, story.id, theme);
      });
    }
  }
});
