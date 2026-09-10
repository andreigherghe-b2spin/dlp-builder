import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "tsup";

const dir = import.meta.dirname;

function getEntries() {
  const entries: Record<string, string> = {
    "lib/utils": "src/lib/utils.ts",
  };

  const uiDir = resolve(dir, "src/components/ui");
  for (const file of readdirSync(uiDir)) {
    if (statSync(resolve(uiDir, file)).isFile() && file.endsWith(".tsx")) {
      entries[`components/ui/${file.replace(/\.tsx$/, "")}`] = resolve(uiDir, file);
    }
  }

  return entries;
}

function resolveAtAlias() {
  return {
    name: "resolve-at-alias",
    setup(build: {
      onResolve: (
        options: { filter: RegExp },
        callback: (args: { path: string }) => { path: string },
      ) => void;
    }) {
      build.onResolve({ filter: /^@\// }, (args: { path: string }) => {
        const basePath = resolve(dir, "src", args.path.slice(2));
        for (const ext of ["", ".ts", ".tsx", ".js", ".jsx"]) {
          try {
            statSync(basePath + ext);
            return { path: basePath + ext };
          } catch {
            // extension doesn't exist, try the next one
          }
        }
        return { path: basePath };
      });
    },
  };
}

export default defineConfig({
  entry: getEntries(),
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  target: "es2022",
  outDir: "dist",
  external: [
    "react",
    "react-native",
    "react/jsx-runtime",
    "lucide-react-native",
    "react-native-reanimated",
    "uniwind",
    /^@rn-primitives\//,
  ],
  esbuildPlugins: [resolveAtAlias()],
});
