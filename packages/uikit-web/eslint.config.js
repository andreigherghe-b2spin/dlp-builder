import reactConfig from "@ui/eslint-config/react";

export default [
  ...reactConfig(import.meta.dirname, "./tsconfig.lint.json"),
  {
    files: ["mcp-server/**/*.ts"],
    rules: {
      // @modelcontextprotocol/sdk resolves these via a wildcard "./*" export
      // that eslint-import-resolver-typescript doesn't follow; verified they
      // resolve fine at runtime.
      "import-x/no-unresolved": ["error", { ignore: ["^@modelcontextprotocol/sdk/"] }],
    },
  },
];
