import path from "node:path";
import { ESLint } from "eslint";

const WORKSPACE_ROOTS = ["packages", "apps"];
const repoRoot = process.cwd();

function packageDirFor(file) {
  const rel = path.relative(repoRoot, file);
  const [top, name] = rel.split(path.sep);
  return WORKSPACE_ROOTS.includes(top) ? path.join(top, name) : ".";
}

function groupByPackage(files) {
  const groups = new Map();
  for (const file of files) {
    const dir = packageDirFor(file);
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(file);
  }
  return groups;
}

async function lintGroup(dir, files) {
  const cwd = path.resolve(repoRoot, dir);
  // Some resolvers used by our eslint configs key off process.cwd() rather
  // than ESLint's `cwd` option, so we chdir for real rather than just
  // passing `cwd` to the ESLint constructor.
  process.chdir(cwd);
  try {
    const eslint = new ESLint({ cwd, fix: true });
    const results = await eslint.lintFiles(files);
    await ESLint.outputFixes(results);
    const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
    if (errorCount > 0) {
      const formatter = await eslint.loadFormatter("stylish");
      throw new Error(await formatter.format(results));
    }
  } finally {
    process.chdir(repoRoot);
  }
}

export default {
  "*.{ts,tsx,js,jsx,mjs,cjs}": async (files) => {
    const groups = groupByPackage(files);
    for (const [dir, groupFiles] of groups) {
      await lintGroup(dir, groupFiles);
    }
    return `prettier --write ${files.map((f) => JSON.stringify(f)).join(" ")}`;
  },
  "*.{json,css,md,yml,yaml}": ["prettier --write"],
};
