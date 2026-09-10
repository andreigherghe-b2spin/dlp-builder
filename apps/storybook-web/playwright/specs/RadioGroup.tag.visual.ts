import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "radiogroup--default" }];

test.describe("Tag RadioGroup Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`RadioGroup ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "RadioGroup", story.name, story.id, theme);
      });
    }
  }
});
