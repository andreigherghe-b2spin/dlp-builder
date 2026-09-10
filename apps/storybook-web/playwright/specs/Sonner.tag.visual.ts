import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

/**
 * `AllVariants` fires its four toasts on mount, so there is nothing to click —
 * but the toaster is `position: fixed`, which puts every toast outside
 * `#storybook-root`'s box even though it is inside its subtree. Framed on the
 * root, the shot would be of an empty story.
 */
const stories = [{ name: "AllVariants", id: "sonner--all-variants" }];

test.describe("Tag Sonner Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Sonner ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Sonner", story.name, story.id, theme, {
          capture: "viewport",
        });
      });
    }
  }
});
