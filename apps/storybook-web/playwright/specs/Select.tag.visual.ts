import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "select--all-states" }];

/**
 * The open menu needs a shot of its own and cannot come from `AllStates`: Radix
 * portals the panel to `document.body`, so a root-framed shot catches only the
 * trigger — hence the viewport frame — and the helper clicks the first trigger it
 * finds, while only one menu can be open at a time.
 *
 * `WithGroups` rather than `Default` because its panel carries the most: group
 * labels and `SelectSeparator` on top of the items.
 */
const open = [{ name: "WithGroupsOpen", id: "select--with-groups" }];

test.describe("Tag Select Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Select ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Select", story.name, story.id, theme);
      });
    }
  }

  for (const story of open) {
    for (const theme of THEME_VALUES) {
      test(`Select ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Select", story.name, story.id, theme, {
          capture: "viewport",
          interaction: "click",
        });
      });
    }
  }
});
