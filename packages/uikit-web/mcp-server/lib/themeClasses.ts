import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface AnimationsMeta {
  utilities: Array<{ pattern: string; cssProperty: string }>;
  keyframes: string[];
}

export interface ThemeClassesMeta {
  utilities: string[];
  colors: string[];
  fonts: string[];
  radii: string[];
}

/**
 * Reads a foundation CSS file by trying multiple locations in order:
 * 1. Monorepo (source): packages/uikit-web/mcp-server/ → packages/uikit-themes/src/foundation/
 * 2. Monorepo (built):  packages/uikit-web/dist/mcp-server/ → packages/uikit-themes/src/foundation/
 * 3. Installed package: dist/mcp-server/themes/ (copied there by tsup.config.ts build step)
 */
async function readFoundationCss(filename: string): Promise<string | null> {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // monorepo from source: mcp-server/lib/ → uikit-themes/src/foundation/
    path.join(dir, "..", "..", "uikit-themes", "src", "foundation", filename),
    // monorepo from dist: dist/mcp-server/ → uikit-themes/src/foundation/
    path.join(dir, "..", "..", "..", "uikit-themes", "src", "foundation", filename),
    // installed npm package: dist/mcp-server/themes/ (co-located, copied during build)
    path.join(dir, "themes", filename),
  ];

  for (const cssPath of candidates) {
    if (existsSync(cssPath)) {
      return fs.readFile(cssPath, "utf8");
    }
  }

  return null;
}

function parseAnimationsCss(css: string): AnimationsMeta {
  const utilities: AnimationsMeta["utilities"] = [];
  const keyframes: string[] = [];

  const utilRe = /@utility\s+([\w*-]+)\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = utilRe.exec(css)) !== null) {
    const propMatch = m[2].trim().match(/([\w-]+)\s*:/);
    utilities.push({ pattern: m[1], cssProperty: propMatch ? propMatch[1] : "" });
  }

  const kfRe = /@keyframes\s+([\w-]+)\s*\{/g;
  while ((m = kfRe.exec(css)) !== null) keyframes.push(m[1]);

  return { utilities, keyframes };
}

function parseConfigCss(css: string): ThemeClassesMeta {
  const colors: string[] = [];
  const fonts: string[] = [];
  const radii: string[] = [];
  const utilities: string[] = [];

  let m: RegExpExecArray | null;
  const utilRe = /@utility\s+([\w*-]+)\s*\{/g;
  while ((m = utilRe.exec(css)) !== null) utilities.push(m[1]);

  const colorRe = /--color-([\w-]+)\s*:/g;
  while ((m = colorRe.exec(css)) !== null) colors.push(m[1]);

  const fontRe = /--font-([\w-]+)\s*:/g;
  while ((m = fontRe.exec(css)) !== null) fonts.push(m[1]);

  const radiusRe = /--radius-([\w-]+)\s*:/g;
  while ((m = radiusRe.exec(css)) !== null) radii.push(m[1]);

  return { utilities, colors, fonts, radii };
}

let animationsCache: AnimationsMeta | null = null;
let themeClassesCache: ThemeClassesMeta | null = null;

export async function getAnimationsMeta(): Promise<AnimationsMeta> {
  if (animationsCache) return animationsCache;

  const css = await readFoundationCss("animations.css");
  if (css) {
    animationsCache = parseAnimationsCss(css);
    return animationsCache;
  }

  return { utilities: [], keyframes: [] };
}

export async function getThemeClassesMeta(): Promise<ThemeClassesMeta> {
  if (themeClassesCache) return themeClassesCache;

  const css = await readFoundationCss("config.css");
  if (css) {
    themeClassesCache = parseConfigCss(css);
    return themeClassesCache;
  }

  return { utilities: [], colors: [], fonts: [], radii: [] };
}

export function formatAnimationsText(meta: AnimationsMeta): string {
  return [
    "## Keyframe animations  →  animate-{name}",
    ...meta.keyframes.map((k) => `- animate-${k}`),
    "",
    "## Utilities",
    ...meta.utilities.map((u) => `- ${u.pattern}  (${u.cssProperty})`),
  ].join("\n");
}

export function formatThemeClassesText(meta: ThemeClassesMeta): string {
  return [
    "## Colors  →  bg-{t} / text-{t} / border-{t} / ring-{t} / fill-{t} / etc.",
    ...meta.colors.map((c) => `- ${c}`),
    "",
    "## Font families  →  font-{t}",
    ...meta.fonts.map((f) => `- ${f}`),
    "",
    "## Border radii  →  rounded-{t}",
    ...meta.radii.map((r) => `- ${r}`),
    "",
    "## Standalone utilities",
    ...meta.utilities.map((u) => `- ${u}`),
  ].join("\n");
}
