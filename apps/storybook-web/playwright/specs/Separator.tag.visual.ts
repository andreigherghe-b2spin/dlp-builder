import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

/**
 * One story, showing both orientations at once, rather than one story per
 * orientation.
 *
 * `Horizontal` and `Vertical` still exist for the docs page — they are simply
 * not photographed: each was a separate navigation and settle for a shot the
 * combined story already contains, and three themes multiplied that by three.
 * An orientation or inset case added to the combined story is under test with no
 * change here.
 */
const stories = [{ name: "AllVariants", id: "separator--all-variants" }];

test.describe("Tag Separator Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Separator ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Separator", story.name, story.id, theme);
      });
    }
  }
});
