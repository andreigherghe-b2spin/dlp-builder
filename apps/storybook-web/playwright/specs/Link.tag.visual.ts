import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

// Only the combined story. `Sizes` is a subset of it, and `Visited` cannot be
// photographed at all — `:visited` is the browser reporting the user's history,
// so a fresh Playwright context never matches it. See the note on that story.
const stories = [{ name: "AllStates", id: "link--all-states" }];

/**
 * 416×268, and nearly every non-background pixel is a glyph edge or a 1px
 * underline. On ubuntu hellomillions came to 2128 differing pixels of 111,488
 * (1.91%), mcluck 2097 (1.88%) and spinblitz 1433 (1.29%), image sizes identical
 * throughout, so it is glyph antialiasing and nothing else. white-label and
 * playfame pass at the suite default. The gate sits just over the worst of them,
 * so there are about a hundred pixels of headroom and no more.
 */
const MAX_DIFF_PIXEL_RATIO = 0.02;

test.describe("Tag Link Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Link ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Link", story.name, story.id, theme, {
          maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
        });
      });
    }
  }
});
