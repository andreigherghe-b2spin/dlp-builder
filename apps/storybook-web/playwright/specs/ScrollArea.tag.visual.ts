import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

// The combined story draws both axes and both bars at `type="always"`, which is
// the only way a scrollbar is on screen when the shutter goes: Radix's default
// reveals them on hover, so every other story would photograph an empty gutter.
const stories = [{ name: "AllStates", id: "scrollarea--all-states" }];

test.describe("Tag ScrollArea Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`ScrollArea ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "ScrollArea", story.name, story.id, theme);
      });
    }
  }
});
