import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

// The combined story and only the combined story: it draws every ratio at once,
// so the per-case stories below it would photograph pixels this shot already has.
const stories = [{ name: "AllRatios", id: "aspectratio--all-ratios" }];

test.describe("Tag AspectRatio Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`AspectRatio ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "AspectRatio", story.name, story.id, theme);
      });
    }
  }
});
