import base from "@ui/eslint-config/base";

export default [
  ...base(),
  {
    ignores: ["packages/**", "apps/**"],
  },
];
