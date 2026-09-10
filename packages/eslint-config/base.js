import path from "node:path";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import prettierConfig from "eslint-config-prettier/flat";
import globals from "globals";
import { sharedIgnores } from "./ignores.js";

/**
 * @param {string} [tsconfigRootDir] - `import.meta.dirname` of the consuming package, if it has a tsconfig.json
 */
export default function base(tsconfigRootDir) {
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
          typescript: tsconfigRootDir
            ? { project: path.join(tsconfigRootDir, "tsconfig.json") }
            : true,
        },
      },
    },
    {
      files: ["**/*.{ts,tsx,mts,cts}"],
      extends: [tseslint.configs.recommended, importX.flatConfigs.typescript],
      ...(tsconfigRootDir && {
        languageOptions: {
          parserOptions: { tsconfigRootDir },
        },
      }),
    },
    prettierConfig,
  );
}
