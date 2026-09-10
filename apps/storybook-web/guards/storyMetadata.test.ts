import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readCsf } from "storybook/internal/csf-tools";
import { describe, expect, it } from "vitest";

import { listComponents } from "../../../packages/uikit-web/scripts/component-entries";

// Statically parses story files via the same CSF parser Storybook's own
// indexer uses (title/tags/id must be string literals per CSF, so this reads
// exactly what Storybook will resolve — no need to execute story modules,
// which matters because @ui/web/* only resolves through this app's Vite
// config, not through plain Node module resolution).

const __dirname = dirname(fileURLToPath(import.meta.url));
const storiesRoot = resolve(__dirname, "../.storybook/stories");
const specsRoot = resolve(__dirname, "../playwright/specs");
const uikitWebSrc = resolve(__dirname, "../../../packages/uikit-web/src");

function walkTsxFiles(rootDir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(rootDir)) {
    const full = resolve(rootDir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkTsxFiles(full));
    } else if (entry.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

function storyFiles(): string[] {
  return walkTsxFiles(storiesRoot).filter((f) => f.endsWith(".stories.tsx"));
}

function componentBasenames(): Set<string> {
  return new Set(componentLevelMap().keys());
}

// Maps component basename -> the atomic-design level directory it actually
// lives in (e.g. "button" -> "atoms"). `listComponents` is the one answer to
// "what counts as a component", shared with tsup's entry discovery and
// Storybook's aliases — the rule used to be copied here, and a copy is how
// `Progress.test` once became a component that owed the guard a story.
function componentLevelMap(): Map<string, string> {
  return new Map(listComponents(uikitWebSrc).map(({ name, level }) => [name, level]));
}

async function parseStory(filePath: string) {
  const csf = await readCsf(filePath, { makeTitle: (title) => title });
  csf.parse();
  return csf;
}

const STORY_ID_RE = /id:\s*"([a-z0-9-]+--[a-z0-9-]+)"/g;

function specReferencedIds(filePath: string): string[] {
  const content = readFileSync(filePath, "utf8");
  return [...content.matchAll(STORY_ID_RE)].map((m) => m[1]);
}

describe("story metadata", () => {
  it("every Playwright spec id resolves to a real story", async () => {
    const files = storyFiles();
    const realIds = new Set<string>();
    for (const file of files) {
      const csf = await parseStory(file);
      for (const story of csf.stories) {
        realIds.add(story.id);
      }
    }

    const specFiles = readdirSync(specsRoot).filter((f) => f.endsWith(".tag.visual.ts"));
    const danglingBySpec: Record<string, string[]> = {};

    for (const specFile of specFiles) {
      const ids = specReferencedIds(resolve(specsRoot, specFile));
      const dangling = ids.filter((id) => !realIds.has(id));
      if (dangling.length > 0) danglingBySpec[specFile] = dangling;
    }

    expect(danglingBySpec, "specs referencing story ids that no longer exist").toEqual({});
  });

  it("every component has exactly one story file, and vice versa", async () => {
    const files = storyFiles().filter((f) => !f.includes("/animations/"));
    const componentStoryBasenames = new Set<string>();

    for (const file of files) {
      const csf = await parseStory(file);
      // A component story declares `component:` in its meta; content/foundation
      // pages (e.g. design tokens) don't map to a single src component.
      if (!csf.meta?.component) continue;
      const basename = file
        .split("/")
        .pop()!
        .replace(/\.stories\.tsx$/, "");
      componentStoryBasenames.add(basename);
    }

    const components = componentBasenames();

    const missingStories = [...components].filter((c) => !componentStoryBasenames.has(c));
    const orphanStories = [...componentStoryBasenames].filter((c) => !components.has(c));

    expect({ missingStories, orphanStories }).toEqual({ missingStories: [], orphanStories: [] });
  });

  it("every story meta has a pinned id equal to its file basename", async () => {
    const files = storyFiles();
    const problems: string[] = [];

    for (const file of files) {
      const csf = await parseStory(file);
      const basename = file
        .split("/")
        .pop()!
        .replace(/\.stories\.tsx$/, "");
      if (csf.meta?.id !== basename) {
        problems.push(`${basename}.stories.tsx: id is "${csf.meta?.id}", expected "${basename}"`);
      }
    }

    expect(problems).toEqual([]);
  });

  const TITLE_RE = /^(WIP|Needs Review|Verified)\/(Atoms|Molecules|Organisms)\/[A-Za-z0-9]+$/;

  it("every component story title follows Status/Level/Component", async () => {
    const files = storyFiles().filter((f) => !f.includes("/animations/"));
    const problems: string[] = [];

    for (const file of files) {
      const csf = await parseStory(file);
      if (!csf.meta?.component) continue; // foundation/content pages are exempt
      const title = csf.meta?.title ?? "";
      if (!TITLE_RE.test(title)) {
        problems.push(
          `${file.split("/").pop()}: title "${title}" doesn't match Status/Level/Component`,
        );
      }
    }

    expect(problems).toEqual([]);
  });

  it("a story's title level matches the component's actual directory", async () => {
    const files = storyFiles().filter((f) => !f.includes("/animations/"));
    const levels = componentLevelMap();
    const problems: string[] = [];

    for (const file of files) {
      const csf = await parseStory(file);
      if (!csf.meta?.component) continue;
      const basename = file
        .split("/")
        .pop()!
        .replace(/\.stories\.tsx$/, "");
      const title = csf.meta?.title ?? "";
      const match = title.match(TITLE_RE);
      if (!match) continue; // reported by the previous assertion already
      const titleLevel = match[2].toLowerCase();
      const actualLevel = levels.get(basename);
      if (titleLevel !== actualLevel) {
        problems.push(
          `${basename}.stories.tsx: title says level "${titleLevel}" but the component lives in src/${actualLevel}/`,
        );
      }
    }

    expect(problems).toEqual([]);
  });

  it("a story's status:/level: tags agree with its title", async () => {
    const files = storyFiles().filter((f) => !f.includes("/animations/"));
    const problems: string[] = [];

    for (const file of files) {
      const csf = await parseStory(file);
      if (!csf.meta?.component) continue;
      const basename = file
        .split("/")
        .pop()!
        .replace(/\.stories\.tsx$/, "");
      const title = csf.meta?.title ?? "";
      const match = title.match(TITLE_RE);
      if (!match) continue; // reported by the title-format assertion already

      const expectedStatusTag = `status:${match[1].toLowerCase().replace(/\s+/g, "-")}`;
      const expectedLevelTag = `level:${match[2].toLowerCase()}`;
      const tags = csf.meta?.tags ?? [];

      if (!tags.includes(expectedStatusTag)) {
        problems.push(`${basename}.stories.tsx: missing tag "${expectedStatusTag}"`);
      }
      if (!tags.includes(expectedLevelTag)) {
        problems.push(`${basename}.stories.tsx: missing tag "${expectedLevelTag}"`);
      }
    }

    expect(problems).toEqual([]);
  });
});
