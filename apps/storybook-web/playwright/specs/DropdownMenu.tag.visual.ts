import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

/**
 * One entry, and it is the open panel.
 *
 * A closed dropdown is a `Button` and nothing else — `Button` has its own
 * baselines in five themes, so a root-framed shot here would photograph a
 * component this spec does not own. Radix portals the panel outside
 * `#storybook-root`, hence the viewport frame; `click` is what puts it on screen
 * and what makes the helper wait for the popper to stop moving.
 */
const open = [{ name: "AllStatesOpen", id: "dropdownmenu--all-states" }];

test.describe("Tag DropdownMenu Snapshots", () => {
  for (const story of open) {
    for (const theme of THEME_VALUES) {
      test(`DropdownMenu ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "DropdownMenu", story.name, story.id, theme, {
          capture: "viewport",
          interaction: "click",
        });
      });
    }
  }
});
