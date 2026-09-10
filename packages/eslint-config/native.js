import expoConfig from "eslint-config-expo/flat.js";
import baseTypeChecked from "./base-type-checked.js";

/**
 * @param {string} tsconfigRootDir - `import.meta.dirname` of the consuming package
 * @param {string} [project] - path to the tsconfig used for type info, relative to tsconfigRootDir
 */
export default function nativeConfig(tsconfigRootDir, project) {
  return [...baseTypeChecked(tsconfigRootDir, project), ...expoConfig];
}
