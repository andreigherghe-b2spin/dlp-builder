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
const stories = [
  { name: "AllStates", id: "stepper--all-states" },
  { name: "AllVariations", id: "stepper--all-variations" },
];

test.describe("Tag Stepper Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Stepper ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Stepper", story.name, story.id, theme);
      });
    }
  }
});
