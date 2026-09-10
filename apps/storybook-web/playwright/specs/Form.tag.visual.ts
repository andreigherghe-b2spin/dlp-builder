import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [
  { name: "Default", id: "form--default" },
  { name: "CustomLayout", id: "form--custom-layout" },
  { name: "Invalid", id: "form--invalid" },
];

test.describe("Tag Form Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Form ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Form", story.name, story.id, theme);
      });
    }
  }
});
