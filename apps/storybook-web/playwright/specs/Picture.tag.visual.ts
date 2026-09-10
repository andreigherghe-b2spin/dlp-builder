import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

// `AllStates` and nothing else. `Densities` is the one story here that cannot have a
// baseline: what it draws is chosen by the device pixel ratio, and the runner's is
// pinned to 1 while a developer's retina display is 2 — so the same story is a
// different picture depending on who looks at it. It is asserted where the descriptor
// is exact instead, in `molecules/Picture/lib/toSrcSet.test.ts`.
const stories = [{ name: "AllStates", id: "picture--all-states" }];

test.describe("Tag Picture Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Picture ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Picture", story.name, story.id, theme);
      });
    }
  }
});
