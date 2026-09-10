import expoConfig from "eslint-config-expo/flat.js";
import base from "./base.js";

/**
 * @param {string} [tsconfigRootDir] - `import.meta.dirname` of the consuming package
 */
export default function expoAppConfig(tsconfigRootDir) {
  return [
    ...base(tsconfigRootDir),
    ...expoConfig,
    {
      files: ["**/metro.config.js", "**/babel.config.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
      },
    },
  ];
}
