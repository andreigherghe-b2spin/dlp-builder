import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";

/**
 * Fonts are bundled rather than fetched from Google, because the visual tests
 * photograph this page. Over the network the font arrives after first paint —
 * `display=swap` means a screenshot can catch either the fallback or the real
 * face — and the file Google serves for a given family changes over time, which
 * would invalidate every baseline at once with no code change behind it.
 *
 * The families here are the ones the brand token files name in
 * `--typography-font-family` and `--typography-components-*-font-family`:
 * Ubuntu (mcluck, hellomillions), Radio Canada (spinblitz), Inter (white-label,
 * shadcn) and Lato (playfame). Weights are the four the brands use —
 * 400/500/600/700 — narrowed to what each family actually ships: Ubuntu has no
 * 600, and Lato has neither 500 nor 600, so the browser synthesises those from
 * the nearest face.
 *
 * These are the static packages, not `@fontsource-variable/*`, on purpose. The
 * variable ones register the family as `Inter Variable` / `Radio Canada
 * Variable`, and the tokens say `Inter` and `Radio Canada` — a name that
 * matches nothing falls back to the browser's default serif silently, with no
 * error anywhere. If you swap one of these for a variable package, rename the
 * token in the same commit.
 *
 * `Menlo` (shadcn) is a system font with no package to pin; it resolves to
 * whatever the rendering machine has, which is one more reason baselines are
 * generated on the pinned CI runner.
 */
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "@fontsource/radio-canada/300.css";
import "@fontsource/radio-canada/400.css";
import "@fontsource/radio-canada/500.css";
import "@fontsource/radio-canada/600.css";
import "@fontsource/radio-canada/700.css";
// No brand asks for a monospace face, but the token and typography specimens
// label every row with `<code>`. Left to the default, that is Menlo on macOS and
// DejaVu Sans Mono on Linux — a different typeface, which no screenshot taken on
// one machine can match on the other. One bundled face removes the platform from
// the picture. 400 only: nothing renders code in a second weight.
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/ubuntu/300.css";
import "@fontsource/ubuntu/400.css";
import "@fontsource/ubuntu/500.css";
import "@fontsource/ubuntu/700.css";

import { DEFAULT_THEME_KEY, THEMES } from "./themes";
import "./global.css";

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: THEMES,
      defaultTheme: DEFAULT_THEME_KEY,
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    layout: "centered",

    a11y: {
      test: "todo",
    },

    options: {
      storySort: {
        order: [
          "Needs Review",
          ["Atoms", "Molecules", "Organisms"],
          "Verified",
          ["Atoms", "Molecules", "Organisms"],
          "WIP",
          ["Atoms", "Molecules", "Organisms"],
          "Foundations",
          "Theme",
        ],
      },
    },
  },
};

export default preview;
