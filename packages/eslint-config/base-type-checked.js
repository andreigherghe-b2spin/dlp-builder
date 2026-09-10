import path from "node:path";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import prettierConfig from "eslint-config-prettier/flat";
import globals from "globals";
import { sharedIgnores } from "./ignores.js";

/**
 * @param {string} tsconfigRootDir - `import.meta.dirname` of the consuming package
 * @param {string} [project] - path to the tsconfig used for type info, relative to tsconfigRootDir
 */
export default function baseTypeChecked(tsconfigRootDir, project = "./tsconfig.json") {
  return tseslint.config(
    { ignores: sharedIgnores },
    js.configs.recommended,
    importX.flatConfigs.recommended,
    {
      languageOptions: {
        globals: globals.node,
      },
      settings: {
        "import-x/resolver": {
          typescript: {
            project: path.join(tsconfigRootDir, "tsconfig.json"),
          },
        },
      },
    },
    {
      files: ["**/*.{ts,tsx,mts,cts}"],
      extends: [tseslint.configs.recommendedTypeChecked, importX.flatConfigs.typescript],
      languageOptions: {
        parserOptions: {
          projectService: false,
          project,
          tsconfigRootDir,
        },
      },
    },
    prettierConfig,
  );
}
