import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

/**
 * One story, showing every state at once, rather than one story per state.
 *
 * Per-state stories still exist for the docs page — they are simply not
 * photographed: each was a separate navigation and settle for a shot that the
 * combined story already contains, and three themes multiplied that by three.
 * A state added to the combined story is under test with no change here.
 */
const stories = [{ name: "AllStates", id: "selectfield--all-states" }];

/**
 * The open panel needs a shot of its own and cannot come from `AllStates`: Radix
 * portals it to `document.body`, so a root-framed shot catches only the trigger —
 * hence the viewport frame — and the helper clicks the first trigger it finds,
 * while only one panel can be open at a time.
 *
 * `Grouped` rather than `Default` because its panel carries group labels and
 * separators on top of the options.
 */
const open = [{ name: "GroupedOpen", id: "selectfield--grouped" }];

test.describe("Tag SelectField Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`SelectField ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "SelectField", story.name, story.id, theme);
      });
    }
  }

  for (const story of open) {
    for (const theme of THEME_VALUES) {
      test(`SelectField ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "SelectField", story.name, story.id, theme, {
          capture: "viewport",
          interaction: "click",
        });
      });
    }
  }
});
