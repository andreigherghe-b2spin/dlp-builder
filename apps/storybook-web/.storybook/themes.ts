/**
 * Single source of truth for theme names used by Storybook and visual tests.
 *
 * Each key maps to the className applied to <html> by withThemeByClassName.
 * The key matches a CSS theme defined inside @ui/themes/storybook.css
 * (which uses Tailwind v4 @variant blocks scoped by classname).
 */
export const THEMES = {
  WHITE_LABEL: "white-label",
  MCLUCK: "mcluck",
  HELLO_MILLIONS: "hellomillions",
  PLAYFAME: "playfame",
  SPINBLITZ: "spinblitz",
  // SHADCN: "shadcn",
} as const;

export type ThemeName = keyof typeof THEMES;
export type Theme = (typeof THEMES)[keyof typeof THEMES];

/**
 * The key `withThemeByClassName` selects by. It indexes THEMES, so a theme that
 * gets commented out above breaks the build here instead of at runtime.
 */
export const DEFAULT_THEME_KEY: ThemeName = "SPINBLITZ";

export const THEME_KEYS = Object.keys(THEMES) as ThemeName[];
export const THEME_VALUES = Object.values(THEMES) as Theme[];
