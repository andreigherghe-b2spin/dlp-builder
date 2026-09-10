import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Resolves the path to ai-docs.json across all three environments:
 * - production  (dist/mcp-server/ → dist/components/ui/docs/)
 * - dev built   (mcp-server/      → dist/components/ui/docs/)
 * - dev source  (mcp-server/      → src/docs/)
 */
function resolveDocsPath(): string | null {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // production: bundled into dist/mcp-server/server.js → dir is dist/mcp-server/
    path.join(dir, "..", "components", "ui", "docs", "ai-docs.json"),
    // dev (tsx source): dir is mcp-server/lib/ → go up two levels to package root
    path.join(dir, "..", "..", "dist", "components", "ui", "docs", "ai-docs.json"),
    path.join(dir, "..", "..", "src", "docs", "ai-docs.json"),
  ];
  return candidates.find(existsSync) ?? null;
}

let packageNameCache: string | null = null;

/**
 * Reads the `name` field from the nearest package.json (package root).
 * Works in all three environments because package.json is always two levels
 * above the mcp-server entry point — `dist/mcp-server/` in production or
 * `mcp-server/lib/` in dev-source mode.
 * Cached after the first call.
 */
export async function getPackageName(): Promise<string> {
  if (packageNameCache) return packageNameCache;

  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath = path.join(dir, "..", "..", "package.json");
    const raw = await fs.readFile(pkgPath, "utf8");
    const name = (JSON.parse(raw) as { name?: string }).name;
    if (name) {
      packageNameCache = name;
      return name;
    }
  } catch {
    // fall through to default
  }

  packageNameCache = "@ui/web";
  return packageNameCache;
}

let fileMapCache: Map<string, string> | null = null;
let aliasMapCache: Map<string, string> | null = null;

/**
 * Returns a map of ComponentName → subpath (e.g. "Button" → "button", "CardContent" → "card").
 * The mapping is stored under the reserved `__fileMap` key in ai-docs.json so no separate
 * file is needed. Returns an empty map when unavailable (graceful degradation).
 * Cached after the first call (shares the same file read as getAllComponentsDocs).
 */
export async function getComponentFileMap(): Promise<Map<string, string>> {
  if (fileMapCache !== null) return fileMapCache;
  // Trigger the shared load which populates fileMapCache as a side-effect
  await getAllComponentsDocs();
  return fileMapCache!;
}

/**
 * Returns a map of alias → the exported name it stands for ("Snackbar" → "Toaster").
 * Generated from the `@alias` tags in each component's own JSDoc and stored under the
 * reserved `__aliasMap` key in ai-docs.json — see `extractAliases` in
 * `scripts/reindex-uikit-docs.js` for what belongs in one.
 * Cached after the first call (shares the same file read as getAllComponentsDocs).
 */
export async function getComponentAliasMap(): Promise<Map<string, string>> {
  if (aliasMapCache !== null) return aliasMapCache;
  await getAllComponentsDocs();
  return aliasMapCache!;
}

/** Parsed representation of a single JSDoc-annotated component entry from ai-docs.json. */
export interface ComponentDocEntry {
  name: string;
  description: string;
  props: string[];
  example: string;
}

/** A single prop with optional allowed string-literal values extracted from JSDoc union types. */
export interface PropConstraint {
  name: string;
  /** Allowed values for union string props (e.g. 'default' | 'ghost'). null = no restriction. */
  allowedValues: string[] | null;
  required: boolean;
}

// Matches: @param {('a' | 'b')} [propName] or @param {type} propName
const PARAM_RE = /@param\s+\{([^}]+)\}\s+(\[?)(\w+)/g;
// Extracts individual values from a union type string
const UNION_VALUE_RE = /'([\w-]+)'/g;

/**
 * Parses prop constraints from a raw JSDoc string.
 * Only props with union string types produce non-null `allowedValues`.
 */
function parseDocConstraints(doc: string): PropConstraint[] {
  const props: PropConstraint[] = [];

  PARAM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PARAM_RE.exec(doc)) !== null) {
    const typeStr = m[1];
    const isOptional = m[2] === "[";
    const propName = m[3];

    if (propName === "props") continue;

    let allowedValues: string[] | null = null;
    if (typeStr.includes("|")) {
      const values: string[] = [];
      UNION_VALUE_RE.lastIndex = 0;
      let vm: RegExpExecArray | null;
      while ((vm = UNION_VALUE_RE.exec(typeStr)) !== null) {
        values.push(vm[1]);
      }
      if (values.length > 0) allowedValues = values;
    }

    props.push({ name: propName, allowedValues, required: !isOptional });
  }

  return props;
}

let constraintsCache: Map<string, PropConstraint[]> | null = null;

/**
 * Returns a map of component name → constrained props (only props with union types).
 * Cached after the first call.
 */
export async function getAllComponentConstraints(): Promise<Map<string, PropConstraint[]>> {
  if (constraintsCache) return constraintsCache;

  const docs = await getAllComponentsDocs();
  const map = new Map<string, PropConstraint[]>();

  for (const [name, doc] of Object.entries(docs)) {
    if (!doc) continue;
    const constrained = parseDocConstraints(doc).filter((p) => p.allowedValues !== null);
    if (constrained.length > 0) map.set(name, constrained);
  }

  constraintsCache = map;
  return constraintsCache;
}

let docsCache: Record<string, string> | null = null;

/** One reserved `__`-prefixed entry of ai-docs.json as a Map. Empty when absent or malformed. */
function toStringMap(value: unknown): Map<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return new Map();
  return new Map<string, string>(Object.entries(value as Record<string, string>));
}

/**
 * Loads and parses ai-docs.json once, then returns the cached result on
 * subsequent calls. Safe to call concurrently — the file is only read once.
 *
 * As a side-effect, populates `fileMapCache` and `aliasMapCache` from the reserved
 * `__fileMap` and `__aliasMap` keys so that neither needs a second file read.
 */
export async function getAllComponentsDocs(): Promise<Record<string, string>> {
  if (docsCache) return docsCache;

  try {
    const docsPath = resolveDocsPath();
    if (!docsPath) {
      docsCache = {};
      fileMapCache = new Map();
      aliasMapCache = new Map();
      return docsCache;
    }

    const content = await fs.readFile(docsPath, "utf8");
    const parsed = JSON.parse(content) as Record<string, unknown>;

    // Reserved entries come out first; what is left is one doc string per component.
    fileMapCache = toStringMap(parsed["__fileMap"]);
    aliasMapCache = toStringMap(parsed["__aliasMap"]);

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!key.startsWith("__") && typeof value === "string" && value) {
        result[key] = value;
      }
    }

    docsCache = result;
    return result;
  } catch {
    docsCache = {};
    fileMapCache = new Map();
    aliasMapCache = new Map();
    return docsCache;
  }
}

/**
 * Parses a raw JSDoc string from ai-docs.json into structured fields.
 *
 * Extracts:
 * - `description` — first line of the doc string
 * - `props`       — param names from `@param` tags (skips the generic `props` catch-all)
 * - `example`     — everything after the first `@example` tag
 */
export function parseDocEntry(name: string, doc: string): ComponentDocEntry {
  const lines = doc.split("\n");

  const description = lines[0] ?? "";

  const props = lines
    .filter((l) => /@param\s/.test(l))
    .map((l) => {
      const match = l.match(/@param\s+(?:\{[^}]+\}\s+)?\[?(\w+)/);
      return match?.[1] ?? "";
    })
    .filter((p) => Boolean(p) && p !== "props");

  const exampleIdx = lines.findIndex((l) => l.includes("@example"));
  const example =
    exampleIdx !== -1
      ? lines
          .slice(exampleIdx + 1)
          .join("\n")
          .trim()
      : "";

  return { name, description, props, example };
}

/**
 * Reduces a component name to the form two spellings of the same component share:
 * lowercase, with every separator dropped.
 *
 * A caller reaching this server names a component in whatever casing their own
 * codebase uses — `ScrollArea` from the import statement, `scrollArea` from a
 * variable or the published subpath, `scroll-area` from a file path predating the
 * camelCase rename or from another design system. All three mean one component, and
 * which one an agent happens to hold is an accident of where
 * it read the name. Requiring the right one made `get_component_doc` fail on a
 * component that plainly exists, and a lookup that answers "not found" for a real
 * component is worse than no lookup at all.
 *
 * Only the *lookup* is loosened. The subpath an import actually resolves from stays
 * exactly what `__fileMap` says — see `checkImports` in `validate.ts`, which still
 * reports a mismatch, because `dist/` holds one file under one name and a
 * case-insensitive macOS filesystem is the only reason the wrong one ever appears to
 * work.
 *
 * Collisions are possible in principle — `ScrollArea` and `Section_Header` would
 * normalise alike — but the docs are keyed by exported identifier, and two exports
 * cannot differ only in separators and still both be valid JS.
 */
export function normalizeComponentKey(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/**
 * The canonical key for a name, following one alias hop. `null` when nothing matches.
 *
 * Spelling is handled by `normalizeComponentKey` on both sides. The hop after it is for
 * a name the *products* use for something this library ships under a different one —
 * `snackbar` for `Toaster`. Those come from `@alias` tags on the components themselves,
 * generated into `__aliasMap`; nothing about which names exist is written here.
 */
async function findKey(componentName: string): Promise<string | null> {
  const docs = await getAllComponentsDocs();
  const wanted = normalizeComponentKey(componentName);

  const direct = Object.keys(docs).find((k) => normalizeComponentKey(k) === wanted);
  if (direct) return direct;

  const aliases = await getComponentAliasMap();
  for (const [alias, canonical] of aliases) {
    if (normalizeComponentKey(alias) === wanted && canonical in docs) return canonical;
  }

  return null;
}

/**
 * Finds a component doc by name, ignoring casing and separators — `ScrollArea`,
 * `scrollArea`, `scroll-area` and `scroll_area` all resolve to the same
 * entry. A handful of product names resolve too, through `@alias`. Returns `null`
 * if not found.
 */
export async function getComponentDoc(componentName: string): Promise<string | null> {
  const docs = await getAllComponentsDocs();
  const key = await findKey(componentName);
  return key ? (docs[key] ?? null) : null;
}

/**
 * The exported identifier and the subpath it is imported from, for a name given in any
 * casing. `null` when no component matches.
 *
 * This is what turns a tolerant lookup into a useful one: an agent that had to guess at
 * the spelling of the name almost certainly cannot spell the subpath either, so the
 * answer carries the canonical import rather than leaving a second guess to make.
 */
export async function resolveComponentName(
  componentName: string,
): Promise<{ name: string; subpath: string | null } | null> {
  const fileMap = await getComponentFileMap();
  const name = await findKey(componentName);

  return name ? { name, subpath: fileMap.get(name) ?? null } : null;
}

/** Returns parsed doc entries for all components whose name starts with `prefix`. */
export async function getComponentDocsByPrefix(prefix: string): Promise<ComponentDocEntry[]> {
  const docs = await getAllComponentsDocs();
  return Object.entries(docs)
    .filter(([name]) => name.startsWith(prefix))
    .map(([name, doc]) => parseDocEntry(name, doc));
}
