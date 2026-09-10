import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

/**
 * `AllStates` is the combined sheet and the only story photographed — six
 * fields, five of them the component's own derivation and one pinning `active`,
 * which is the state a still frame cannot hold focus for.
 */
const stories = [{ name: "AllStates", id: "inputotp--all-states" }];

test.describe("Tag InputOTP Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`InputOTP ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "InputOTP", story.name, story.id, theme);
      });
    }
  }
});
