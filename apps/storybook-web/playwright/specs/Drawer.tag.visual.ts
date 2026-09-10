import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

/**
 * Two entries rather than one, and no combined story.
 *
 * A drawer is portalled outside `#storybook-root` and only one panel can be open
 * at a time, so the usual "everything in one shot" story is not available here —
 * a combined story would photograph a row of trigger buttons. Both stories open
 * themselves with `defaultOpen`, which is why neither needs an `interaction`.
 *
 * `FullScreen` earns the second entry: it is a different panel shape, not a
 * different state of the first one — edge to edge, no radius, and the page
 * background instead of the surface one.
 */
const stories = [
  { name: "Default", id: "drawer--default" },
  { name: "FullScreen", id: "drawer--full-screen" },
];

test.describe("Tag Drawer Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Drawer ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Drawer", story.name, story.id, theme, {
          capture: "viewport",
        });
      });
    }
  }
});
