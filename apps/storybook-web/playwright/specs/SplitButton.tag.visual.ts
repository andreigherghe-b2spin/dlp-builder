import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

// One story, `Variants` — the six variants at `size="default"`. It carries a fixed width
// and a fixed column count for the camera's sake: a wrapping row breaks where the host
// platform's font metrics say it should, and Playwright refuses to compare two shots whose
// sizes disagree at all.
//
// `AllVariants` stays a docs story and is deliberately not listed, so the size steps and
// the disabled row are not photographed by anything — add them back here to put them under
// test. There is no loading row either: the redrawn design has no `State=Loading`.
const stories = [{ name: "Variants", id: "splitbutton--variants" }];

test.describe("Tag SplitButton Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`SplitButton ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "SplitButton", story.name, story.id, theme);
      });
    }
  }
});
