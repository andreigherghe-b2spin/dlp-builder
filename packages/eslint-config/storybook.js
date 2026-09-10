import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import base from "./base.js";

/**
 * @param {string} [tsconfigRootDir] - `import.meta.dirname` of the consuming package
 */
export default function storybookConfig(tsconfigRootDir) {
  return [
    ...base(tsconfigRootDir),
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
      },
    },
    ...storybook.configs["flat/recommended"],
  ];
}
