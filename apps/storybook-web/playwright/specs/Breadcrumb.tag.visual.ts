import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "AllStates", id: "breadcrumb--all-states" }];

/**
 * 672×196 of trail text and 3.3px separator dots — the same all-text shot as
 * `Link`, which is what a crumb renders. On ubuntu playfame came to 2514
 * differing pixels of 131,712 (1.91%), mcluck 2384 (1.81%), hellomillions 2325
 * (1.77%) and spinblitz 2026 (1.54%), image sizes identical throughout, so it is
 * glyph antialiasing and nothing else. white-label passes at the suite default,
 * and so does `CollapsedOpen` — a panel of flat fill dilutes the same noise. The
 * gate sits just over the worst of them, so there are about a hundred and twenty
 * pixels of headroom and no more.
 */
const MAX_DIFF_PIXEL_RATIO = 0.02;

/**
 * The collapsed `…` opens a Radix menu, which is portalled out of
 * `#storybook-root` — a root-framed shot catches the trigger and nothing else,
 * hence the viewport frame. It cannot come from `AllStates` either: the helper
 * clicks the first trigger it finds, and `AllStates` has four plain trails
 * before the collapsed one.
 */
const open = [{ name: "CollapsedOpen", id: "breadcrumb--collapsed" }];

test.describe("Tag Breadcrumb Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Breadcrumb ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Breadcrumb", story.name, story.id, theme, {
          maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
        });
      });
    }
  }

  for (const story of open) {
    for (const theme of THEME_VALUES) {
      test(`Breadcrumb ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Breadcrumb", story.name, story.id, theme, {
          capture: "viewport",
          interaction: "click",
        });
      });
    }
  }
});
