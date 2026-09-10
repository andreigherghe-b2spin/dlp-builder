import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

/**
 * The one deliberate exception to "the combined story is what gets
 * photographed", and the reason is that `AllStates` cannot be photographed
 * across platforms at all.
 *
 * Its bar selects a tab in the middle, which is the only position both arrows
 * appear in — so the row comes to rest wherever centring that pill puts it, and
 * that offset is the sum of the four pills' measured widths. macOS and Linux
 * hint the same bundled font differently, a fraction of a pixel per glyph, and
 * forty glyphs of accumulated fractions moved the whole row 26px. 2% of the
 * image against a 1% threshold, three themes, every run.
 *
 * `Scrollable` selects the *first* tab, so the row rests at nothing — flat
 * against its start, with no measurement in the answer. What drifts is then only
 * the rasterisation inside the labels, which is what the other sixty-odd
 * baselines already live with.
 *
 * What that costs: the `previous` arrow, the disabled tab, the vertical
 * orientation and a bar that fits are no longer under a snapshot. All four are
 * still stories, and all four are asserted by `ui/Tabs.test.tsx` — which is the
 * right suite for them, because each is a question about behaviour rather than
 * about pixels. Do not "fix" this back to `AllStates` without first making the
 * row's resting place independent of text measurement.
 */
const stories = [{ name: "Scrollable", id: "tabs--scrollable" }];

test.describe("Tag Tabs Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Tabs ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Tabs", story.name, story.id, theme);
      });
    }
  }
});
