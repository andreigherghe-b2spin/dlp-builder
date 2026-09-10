import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import baseTypeChecked from "./base-type-checked.js";

/**
 * @param {string} tsconfigRootDir - `import.meta.dirname` of the consuming package
 * @param {string} [project] - path to the tsconfig used for type info, relative to tsconfigRootDir
 */
export default function reactConfig(tsconfigRootDir, project) {
  return [
    ...baseTypeChecked(tsconfigRootDir, project),
    reactHooks.configs.flat.recommended,
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        globals: globals.browser,
      },
    },
  ];
}
