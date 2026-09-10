import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

/**
 * `capture: "viewport"` rather than the default root frame: Radix portals every
 * panel to `document.body`, so a shot of `#storybook-root` catches the trigger
 * buttons and quietly passes forever, whatever the tooltips do.
 *
 * And no `interaction`, unlike the other overlays here: `AllVariants` pins `open` on
 * its tooltip, so there is nothing to hover. That is also what lets the story be
 * laid out by hand rather than by whichever trigger the helper happens to find
 * first.
 */
const stories = [{ name: "AllVariants", id: "tooltip--all-variants" }];

test.describe("Tag Tooltip Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Tooltip ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Tooltip", story.name, story.id, theme, {
          capture: "viewport",
        });
      });
    }
  }
});
