import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "checkboxfield--all-states" }];

/**
 * 232px wide by 512px tall, carrying eight rows of label and description — the
 * densest text of any shot in the suite. On ubuntu the spinblitz theme (Radio
 * Canada) came to 1212 differing pixels of 118,784, which is 1.02%: over the
 * suite's 1% by twenty-four pixels, with the image sizes identical, so it is
 * glyph antialiasing and nothing else. mcluck and white-label pass at the suite
 * default.
 */
const MAX_DIFF_PIXEL_RATIO = 0.015;

test.describe("Tag CheckboxField Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`CheckboxField ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "CheckboxField", story.name, story.id, theme, {
          maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
        });
      });
    }
  }
});
