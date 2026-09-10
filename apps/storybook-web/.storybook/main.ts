import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { InlineConfig } from "vite";

import { listComponents } from "../../../packages/uikit-web/scripts/component-entries";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

// Basename -> absolute entry path, for the `@ui/web/*` aliases below. What counts as a
// component is `scripts/component-entries.ts` in uikit-web, shared with tsup's entry
// discovery and the story-metadata guard so the three cannot drift — this copy was the
// one still minting a `@ui/web/Progress.test` alias pointing at a test file.
//
// Built once per config load, and **Storybook does not rebuild it when a component
// moves.** It restarts on config changes and HMRs story files, but a component moving
// between `atoms/`, `molecules/` and `organisms/` leaves this map pointing at the path
// it had at startup — so Vite cannot load the module, the story never mounts, and the
// visual suite reports `#storybook-root` resolving to hidden for all five themes.
// Moving a component means restarting the dev server before running `visual:update`.
function buildComponentLookup(uikitWebSrc: string): Map<string, string> {
  return new Map(listComponents(uikitWebSrc).map(({ name, entry }) => [name, entry]));
}

const config: StorybookConfig = {
  stories: ["./stories/**/*.stories.@(ts|tsx)"],
  /**
   * Serves `public/placeholders/*.svg`. Stories illustrate themselves from here
   * rather than from placecats.com or unsplash: a story that fetches its image
   * makes Storybook need the internet to look right, and makes the visual tests
   * need it to pass — the CDN re-encodes, and one run's photograph is not the
   * next run's. Flat SVG, so every renderer agrees on the pixels.
   */
  staticDirs: ["./public"],
  addons: [
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-themes"),
  ],
  framework: getAbsolutePath("@storybook/react-vite"),
  viteFinal: async (config: InlineConfig) => {
    const { mergeConfig } = await import("vite");
    const uikitWebSrc = resolve(__dirname, "../../../packages/uikit-web/src");
    const componentLookup = buildComponentLookup(uikitWebSrc);

    return mergeConfig(config, {
      plugins: [
        {
          name: "uikit-web-source",
          enforce: "pre" as const,
          resolveId(id: string) {
            const match = id.match(/^@ui\/web\/(.+)$/);
            if (!match) return null;
            const [, name] = match;
            if (name === "utils") return resolve(uikitWebSrc, "lib/utils.ts");
            const componentPath = componentLookup.get(name);
            if (!componentPath) {
              throw new Error(
                `@ui/web/${name} does not resolve to any component under uikit-web's src/.`,
              );
            }
            return componentPath;
          },
        },
      ],
      resolve: {
        alias: [
          // Resolve @/ alias used internally by uikit-web components
          { find: /^@\//, replacement: `${uikitWebSrc}/` },
        ],
      },
    });
  },
};

export default config;
