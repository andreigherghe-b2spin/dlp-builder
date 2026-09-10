/**
 * tokens-to-css.js
 *
 * Converts a Figma DTCG variable export (*.tokens.json) into a CSS
 * custom-properties file whose output is byte-identical to the
 * "Variables to CSS" community plugin (figma.com/community/plugin/1427238109341529865).
 *
 * Usage (CLI):
 *   node scripts/tokens-to-css.js <input.tokens.json> [output.css]
 *
 * If no output path is given, the CSS is written next to the input file
 * with a lowercased, hyphenated name derived from the filename:
 *   SpinBlitz.tokens.json  →  spinblitz.css
 *
 * Exports:
 *   convert(tokensJson: object) → string   (pure, testable)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Top-level collection keys whose tokens are emitted. */
const ALLOWED_COLLECTIONS = new Set(["colors", "components", "typography", "border radius"]);

/** Path segments that are dropped when building the CSS variable name. */
const DROP_SEGMENTS = new Set([
  "colors",
  "common",
  "components",
  "sc",
  "font family",
  "typography",
]);

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a `{dot.separated.path}` reference against the root token tree.
 * The path keys may contain spaces (e.g. `border radius`).
 */
function resolveRef(ref, root) {
  const key = ref.slice(1, -1); // strip { }
  const parts = key.split(".");
  let node = root;
  for (const part of parts) {
    if (node == null || typeof node !== "object") return null;
    node = node[part];
  }
  return node ?? null;
}

/**
 * Format a resolved color value object.
 * alpha === 1  →  lowercase hex  (#a3ffb7)
 * alpha < 1   →  rgba(r, g, b, rawAlphaFloat)
 */
function formatColor(value) {
  const { components, alpha, hex } = value;
  if (alpha === 1) return hex.toLowerCase();
  const [r, g, b] = components.map((c) => Math.round(c * 255));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Decide whether a CSS variable name is unitless (no px suffix).
 * Mirrors the `unitlessProperties` list in build.js.
 */
function isUnitless(varName) {
  const lower = varName.toLowerCase();
  return lower.includes("font-weight") || lower.includes("opacity") || lower.includes("z-index");
}

/**
 * Format a token value given its type and the fully-built CSS variable name.
 * Handles alias references recursively.
 */
function formatValue(token, varName, root) {
  const { $type: type, $value: value } = token;

  // Reference: {some.path}
  if (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) {
    const target = resolveRef(value, root);
    if (target != null && "$value" in target) {
      return formatValue(target, varName, root);
    }
    return value; // unresolvable — emit as-is
  }

  if (type === "color") return formatColor(value);

  if (type === "number") {
    if (varName.endsWith("boolean")) return value ? "true" : "false";
    if (isUnitless(varName)) return String(value);
    return `${value}px`;
  }

  // string → emit as-is (font family names, font-style literals, etc.)
  return String(value);
}

/**
 * Build the CSS variable name from a token's path segments.
 *
 * Rules (mirror cleanVariableNames in build.js):
 *  1. Drop: `colors`, `common`, `components`, `sc`, `font family`,
 *           `typography` (only at top level, i.e. the first segment).
 *  2. Rename: `border radius` → `radius`.
 *  3. Drop a trailing leaf segment named `default`.
 *  4. Lowercase, spaces → `-`, prefix `--`.
 */
function buildVarName(pathSegments) {
  const segs = [];
  for (let i = 0; i < pathSegments.length; i++) {
    let seg = pathSegments[i];

    // Rename `border radius` → `radius`
    if (seg === "border radius") seg = "radius";

    // Drop the top-level collection name and other structural segments
    if (DROP_SEGMENTS.has(seg)) continue;

    // Drop a trailing `default` leaf
    if (seg === "default" && i === pathSegments.length - 1) continue;

    segs.push(seg);
  }

  return "--" + segs.join("-").toLowerCase().replace(/ /g, "-");
}

// ---------------------------------------------------------------------------
// Core converter
// ---------------------------------------------------------------------------

/**
 * Walk the token tree and collect {varName, value} pairs.
 */
function walk(node, pathSegments, root, out) {
  if (node == null || typeof node !== "object") return;

  if ("$value" in node) {
    // Skip tokens inside excluded top-level collections
    if (pathSegments.length > 0 && !ALLOWED_COLLECTIONS.has(pathSegments[0])) return;

    const varName = buildVarName(pathSegments);
    const value = formatValue(node, varName, root);
    out.set(varName, value);
    return;
  }

  for (const [key, child] of Object.entries(node)) {
    if (key === "$extensions") continue;
    walk(child, [...pathSegments, key], root, out);
  }
}

/**
 * Convert a parsed Figma DTCG token JSON object to a CSS string.
 * This function is pure (no I/O) and is the unit-testable entry point.
 *
 * @param {object} tokensJson - Parsed contents of *.tokens.json
 * @returns {string} CSS text with `:root { --var: value; ... }` block
 */
export function convert(tokensJson) {
  const vars = new Map();
  walk(tokensJson, [], tokensJson, vars);

  const sorted = Array.from(vars.entries()).sort(([a], [b]) => a.localeCompare(b));
  const lines = [":root {", ...sorted.map(([k, v]) => `  ${k}: ${v};`), "}", ""];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , inputArg, outputArg] = process.argv;

  if (!inputArg) {
    console.error("Usage: node scripts/tokens-to-css.js <input.tokens.json> [output.css]");
    process.exit(1);
  }

  const inputPath = path.resolve(inputArg);
  const defaultOutputName =
    path
      .basename(inputPath)
      .replace(/\.tokens\.json$/i, "")
      .toLowerCase() + ".css";
  const outputPath = outputArg
    ? path.resolve(outputArg)
    : path.join(path.dirname(inputPath), defaultOutputName);

  const tokensJson = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const css = convert(tokensJson);
  fs.writeFileSync(outputPath, css, "utf8");

  console.log(
    `✅  ${path.relative(process.cwd(), inputPath)}  →  ${path.relative(process.cwd(), outputPath)}`,
  );
}
